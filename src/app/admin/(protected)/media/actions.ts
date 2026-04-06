"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseOptionalString,
  parseRequiredString,
  parseStringList,
  redirectWithNotice,
  revalidateMarketingSite,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingMediaBucket, mediaPlacementDefinitions } from "@/lib/site/marketing";
import type { Json, TablesInsert, TablesUpdate } from "@/types/supabase.generated";

const mediaRedirectPath = "/admin/media";

function getMediaRedirectTarget(value: FormDataEntryValue | null) {
  return getSafeRedirectTarget(value, mediaRedirectPath, mediaRedirectPath);
}

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildStoragePath(file: File) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const safeName = slugifySegment(file.name.replace(/\.[^.]+$/, "")) || "gallery";

  return `marketing/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}${extension}`;
}

async function ensureMarketingBucket() {
  const admin = createAdminClient();
  const { data: bucket } = await admin.storage.getBucket(marketingMediaBucket);

  if (!bucket) {
    const { error } = await admin.storage.createBucket(marketingMediaBucket, {
      allowedMimeTypes: ["image/*"],
      public: true,
    });

    if (error) {
      throw error;
    }

    return;
  }

  if (!bucket.public) {
    const { error } = await admin.storage.updateBucket(marketingMediaBucket, {
      allowedMimeTypes: bucket.allowed_mime_types ?? ["image/*"],
      fileSizeLimit: bucket.file_size_limit ?? null,
      public: true,
    });

    if (error) {
      throw error;
    }
  }
}

async function replaceAssetAssignments(
  mediaAssetId: string,
  formData: FormData,
) {
  const admin = createAdminClient();
  const categoryIds = parseStringList(formData.getAll("galleryCategoryIds"));
  const placementKeys = parseStringList(formData.getAll("pagePlacementKeys"));

  const { error: categoryDeleteError } = await admin
    .from("media_assignments")
    .delete()
    .eq("media_asset_id", mediaAssetId)
    .eq("assignment_type", "gallery-category");

  if (categoryDeleteError) {
    throw categoryDeleteError;
  }

  const { error: pageDeleteError } = await admin
    .from("media_assignments")
    .delete()
    .eq("media_asset_id", mediaAssetId)
    .eq("assignment_type", "page");

  if (pageDeleteError) {
    throw pageDeleteError;
  }

  const categoryAssignments: TablesInsert<"media_assignments">[] = categoryIds.map((categoryId) => ({
    assignment_type: "gallery-category",
    display_order: parseInteger(formData.get(`categoryOrder.${categoryId}`)),
    media_asset_id: mediaAssetId,
    target_id: categoryId,
  }));
  const pageAssignments = placementKeys.reduce<TablesInsert<"media_assignments">[]>(
    (accumulator, placementKey) => {
      const placement = mediaPlacementDefinitions.find((definition) => definition.key === placementKey);

      if (!placement) {
        return accumulator;
      }

      accumulator.push({
        assignment_type: "page" as const,
        display_order: parseInteger(formData.get(`placementOrder.${placement.key}`)),
        media_asset_id: mediaAssetId,
        page_key: placement.pageKey,
        section_key: placement.sectionKey,
        slot_key: placement.slotKey,
      } satisfies TablesInsert<"media_assignments">);

      return accumulator;
    },
    [],
  );

  if (categoryAssignments.length > 0) {
    const { error } = await admin.from("media_assignments").insert(categoryAssignments);

    if (error) {
      throw error;
    }
  }

  if (pageAssignments.length > 0) {
    const { error } = await admin.from("media_assignments").insert(pageAssignments);

    if (error) {
      throw error;
    }
  }
}

export async function uploadMediaAsset(formData: FormData) {
  const adminProfile = await requireAdmin();

  const redirectTarget = getMediaRedirectTarget(formData.get("redirectTo"));
  const altText = parseOptionalString(formData.get("altText"));
  const caption = parseOptionalString(formData.get("caption"));
  const featured = parseBoolean(formData.get("featured"));
  const fileValue = formData.get("image");

  if (!(fileValue instanceof File) || fileValue.size === 0 || !fileValue.type.startsWith("image/")) {
    redirectWithNotice(redirectTarget, "media-error");
  }

  const admin = createAdminClient();
  const mediaAssetId = crypto.randomUUID();
  const storagePath = buildStoragePath(fileValue);

  try {
    await ensureMarketingBucket();

    const { error: uploadError } = await admin.storage
      .from(marketingMediaBucket)
      .upload(storagePath, Buffer.from(await fileValue.arrayBuffer()), {
        cacheControl: "3600",
        contentType: fileValue.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const publicUrl = admin.storage.from(marketingMediaBucket).getPublicUrl(storagePath).data.publicUrl;
    const metadata: Record<string, Json> = {
      isFeatured: featured,
    };
    const payload: TablesInsert<"media_assets"> = {
      alt_text: altText,
      asset_kind: "image",
      bucket: marketingMediaBucket,
      caption,
      file_size_bytes: fileValue.size,
      metadata,
      mime_type: fileValue.type,
      original_filename: fileValue.name,
      public_url: publicUrl,
      source_kind: "upload",
      storage_path: storagePath,
      uploaded_by_profile_id: adminProfile.id,
    };
    const { error: insertError } = await admin
      .from("media_assets")
      .insert({ ...payload, id: mediaAssetId });

    if (insertError) {
      throw insertError;
    }

    await replaceAssetAssignments(mediaAssetId, formData);
  } catch (error) {
    console.error("Unable to upload marketing media asset.", error);
    await admin.storage.from(marketingMediaBucket).remove([storagePath]);
    await admin.from("media_assets").delete().eq("id", mediaAssetId);
    redirectWithNotice(redirectTarget, "media-error");
  }

  revalidatePaths([mediaRedirectPath]);
  revalidateMarketingSite(["/", "/gallery"]);
  redirectWithNotice(redirectTarget, "media-uploaded");
}

export async function updateMediaAsset(formData: FormData) {
  await requireAdmin();

  const mediaAssetId = parseRequiredString(formData.get("mediaAssetId"));
  const redirectTarget = getMediaRedirectTarget(formData.get("redirectTo"));
  const altText = parseOptionalString(formData.get("altText"));
  const caption = parseOptionalString(formData.get("caption"));
  const featured = parseBoolean(formData.get("featured"));

  if (!mediaAssetId) {
    redirectWithNotice(redirectTarget, "media-error");
  }

  const admin = createAdminClient();
  const { data: currentAsset, error: currentAssetError } = await admin
    .from("media_assets")
    .select("metadata")
    .eq("id", mediaAssetId)
    .maybeSingle();

  if (currentAssetError) {
    console.error("Unable to load current media asset before update.", currentAssetError);
    redirectWithNotice(redirectTarget, "media-error");
  }

  const currentMetadata =
    currentAsset?.metadata && typeof currentAsset.metadata === "object" && !Array.isArray(currentAsset.metadata)
      ? (currentAsset.metadata as Record<string, Json>)
      : {};
  const payload: TablesUpdate<"media_assets"> = {
    alt_text: altText,
    caption,
    metadata: {
      ...currentMetadata,
      isFeatured: featured,
    },
  };
  const { error } = await admin.from("media_assets").update(payload).eq("id", mediaAssetId);

  if (error) {
    console.error("Unable to update media asset.", error);
    redirectWithNotice(redirectTarget, "media-error");
  }

  try {
    await replaceAssetAssignments(mediaAssetId, formData);
  } catch (assignmentError) {
    console.error("Unable to update media assignments.", assignmentError);
    redirectWithNotice(redirectTarget, "media-error");
  }

  revalidatePaths([mediaRedirectPath]);
  revalidateMarketingSite(["/", "/gallery"]);
  redirectWithNotice(redirectTarget, "media-updated");
}

export async function updateGalleryCategory(formData: FormData) {
  await requireAdmin();

  const categoryId = parseRequiredString(formData.get("categoryId"));
  const redirectTarget = getMediaRedirectTarget(formData.get("redirectTo"));
  const name = parseRequiredString(formData.get("name"));
  const description = parseOptionalString(formData.get("description"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isActive = parseBoolean(formData.get("isActive"));

  if (!categoryId || name.length < 2) {
    redirectWithNotice(redirectTarget, "category-error");
  }

  const admin = createAdminClient();
  const payload: TablesUpdate<"gallery_categories"> = {
    description,
    display_order: displayOrder,
    is_active: isActive,
    name,
  };
  const { error } = await admin
    .from("gallery_categories")
    .update(payload)
    .eq("id", categoryId);

  if (error) {
    console.error("Unable to update gallery category.", error);
    redirectWithNotice(redirectTarget, "category-error");
  }

  revalidatePaths([mediaRedirectPath]);
  revalidateMarketingSite(["/", "/gallery"]);
  redirectWithNotice(redirectTarget, "category-updated");
}
