import Image from "next/image";
import Link from "next/link";

import {
  deleteMediaAsset,
  updateGalleryCategory,
  updateMediaAsset,
  uploadMediaAsset,
} from "@/app/admin/(protected)/media/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { CompactEmptyState } from "@/components/admin/compact-empty-state";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getMediaLibraryData,
  type MediaLibraryAsset,
} from "@/lib/admin/site-management";
import { mediaPlacementDefinitions } from "@/lib/site/marketing";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Admin Media",
};

type AdminMediaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AssignmentOption = {
  checked: boolean;
  description?: string;
  label: string;
  order: number;
  value: string;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function ToggleField({
  defaultChecked,
  label,
  name,
}: Readonly<{
  defaultChecked: boolean;
  label: string;
  name: string;
}>) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-ivory/55 px-4 py-3 text-sm text-charcoal/74">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
      />
      <span>{label}</span>
    </label>
  );
}

function AssignmentEditor({
  checkboxName,
  items,
  orderPrefix,
  title,
}: Readonly<{
  checkboxName: string;
  items: AssignmentOption[];
  orderPrefix: string;
  title: string;
}>) {
  return (
    <div className="rounded-[1.5rem] border border-charcoal/10 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
        {title}
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${checkboxName}-${item.value}`}
            className="grid gap-3 rounded-2xl border border-charcoal/8 bg-ivory/60 px-3 py-3 lg:grid-cols-[1fr_120px]"
          >
            <label className="flex items-start gap-3 text-sm text-charcoal/74">
              <input
                type="checkbox"
                name={checkboxName}
                value={item.value}
                defaultChecked={item.checked}
                className="mt-1 h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
              />
              <span>
                <span className="block font-medium text-charcoal">{item.label}</span>
                {item.description ? (
                  <span className="mt-1 block text-xs leading-6 text-charcoal/58">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </label>

            <div>
              <Label htmlFor={`${orderPrefix}-${item.value}`}>Order</Label>
              <Input
                id={`${orderPrefix}-${item.value}`}
                name={`${orderPrefix}.${item.value}`}
                type="number"
                defaultValue={item.order}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetPreview({ asset }: Readonly<{ asset: MediaLibraryAsset }>) {
  if (!asset.previewUrl) {
    return (
      <div className="flex h-72 items-center justify-center bg-charcoal/5 px-6 text-center text-sm text-charcoal/58">
        Preview unavailable
      </div>
    );
  }

  return (
    <Image
      src={asset.previewUrl}
      alt={asset.altText || asset.caption || asset.filename}
      width={1200}
      height={900}
      sizes="(min-width: 1280px) 42vw, 100vw"
      unoptimized
      className="h-72 w-full object-cover"
    />
  );
}

function DeleteMediaAssetForm({
  assetId,
  label,
}: Readonly<{
  assetId: string;
  label: string;
}>) {
  return (
    <form action={deleteMediaAsset}>
      <input type="hidden" name="mediaAssetId" value={assetId} />
      <input type="hidden" name="redirectTo" value="/admin/media" />
      <ConfirmSubmitButton
        type="submit"
        variant="secondary"
        size="sm"
        className="border-rose/30 bg-white text-rose-700 hover:border-rose/45 hover:bg-rose/10"
        confirmMessage="Delete this image permanently? This cannot be undone."
      >
        {label}
      </ConfirmSubmitButton>
    </form>
  );
}

export default async function AdminMediaPage({ searchParams }: AdminMediaPageProps) {
  const [rawSearchParams, data] = await Promise.all([searchParams, getMediaLibraryData()]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-4">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "category-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The gallery category change could not be saved.",
          },
          "category-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Gallery category updated.",
          },
          "media-deleted": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Image deleted.",
          },
          "media-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The media change could not be completed.",
          },
          "media-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Media details updated.",
          },
          "media-uploaded": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Image uploaded to the website media library.",
          },
        }}
      />

      <AdminSectionCard
        title="Upload image"
        description="Upload website-ready photos here. These assets can be assigned to the homepage, gallery, and category tags without mixing in client inspiration uploads."
        collapsible
      >
        <form action={uploadMediaAsset} className="space-y-5">
          <input type="hidden" name="redirectTo" value="/admin/media" />

          <div>
            <Label htmlFor="media-image">Image file</Label>
            <input
              id="media-image"
              name="image"
              type="file"
              accept="image/*"
              required
              className="block w-full rounded-3xl border border-charcoal/10 bg-white px-4 py-4 text-sm text-charcoal"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="media-alt">Alt text</Label>
              <Input id="media-alt" name="altText" placeholder="Describe the image for accessibility." />
            </div>

            <div>
              <Label htmlFor="media-caption">Caption or display title</Label>
              <Input id="media-caption" name="caption" placeholder="Textured wedding tiers" />
            </div>
          </div>

          <ToggleField defaultChecked={false} label="Mark as featured" name="featured" />

          <div className="grid gap-4 xl:grid-cols-2">
            <AssignmentEditor
              checkboxName="galleryCategoryIds"
              items={data.categories.map((category) => ({
                checked: false,
                description: category.description ?? undefined,
                label: category.name,
                order: category.display_order,
                value: category.id,
              }))}
              orderPrefix="categoryOrder"
              title="Category tags"
            />
            <AssignmentEditor
              checkboxName="pagePlacementKeys"
              items={mediaPlacementDefinitions.map((placement, index) => ({
                checked: false,
                description: "Safe reuse means the same image can appear in more than one section.",
                label: placement.label,
                order: (index + 1) * 10,
                value: placement.key,
              }))}
              orderPrefix="placementOrder"
              title="Page placements"
            />
          </div>

          <Button type="submit">Upload image</Button>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Gallery categories"
        description="These keep the gallery feeling curated instead of random. The slug stays fixed; name, description, order, and visibility stay editable."
        collapsible
        defaultOpen={false}
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {data.categories.map((category) => (
            <article
              key={category.id}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                {category.slug}
              </p>
              <form action={updateGalleryCategory} className="mt-4 space-y-4">
                <input type="hidden" name="categoryId" value={category.id} />
                <input type="hidden" name="redirectTo" value="/admin/media" />

                <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
                  <div>
                    <Label htmlFor={`category-name-${category.id}`}>Name</Label>
                    <Input
                      id={`category-name-${category.id}`}
                      name="name"
                      defaultValue={category.name}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`category-order-${category.id}`}>Display order</Label>
                    <Input
                      id={`category-order-${category.id}`}
                      name="displayOrder"
                      type="number"
                      defaultValue={category.display_order}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`category-description-${category.id}`}>Description</Label>
                  <Textarea
                    id={`category-description-${category.id}`}
                    name="description"
                    defaultValue={category.description ?? ""}
                  />
                </div>

                <ToggleField
                  defaultChecked={category.is_active}
                  label="Show this category in the live gallery system"
                  name="isActive"
                />

                <Button type="submit">Save category</Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Website media library"
        description="These are the images intended for the live website. Alt text, captions, featured state, category tags, page placements, and deletion all live here."
        collapsible
        defaultOpen={false}
      >
        {data.websiteAssets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {data.websiteAssets.map((asset) => {
              const categoryOrderMap = new Map(
                asset.categoryAssignments.map((assignment) => [assignment.categoryId, assignment.displayOrder]),
              );
              const pageOrderMap = new Map(
                asset.pageAssignments.map((assignment) => [assignment.placementKey, assignment.displayOrder]),
              );

              return (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-[1.8rem] border border-charcoal/10 bg-paper"
                >
                  <AssetPreview asset={asset} />

                  <div className="space-y-5 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/68">
                        Website image
                      </span>
                      <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/68">
                        {asset.filename}
                      </span>
                      <span className="rounded-full border border-charcoal/10 bg-ivory/80 px-3 py-1 text-xs text-charcoal/66">
                        Added {formatDate(asset.createdAt)}
                      </span>
                    </div>

                    <form action={updateMediaAsset} className="space-y-5">
                      <input type="hidden" name="mediaAssetId" value={asset.id} />
                      <input type="hidden" name="redirectTo" value="/admin/media" />

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <Label htmlFor={`asset-alt-${asset.id}`}>Alt text</Label>
                          <Input
                            id={`asset-alt-${asset.id}`}
                            name="altText"
                            defaultValue={asset.altText}
                            placeholder="Describe the image for accessibility."
                          />
                        </div>

                        <div>
                          <Label htmlFor={`asset-caption-${asset.id}`}>Caption or display title</Label>
                          <Input
                            id={`asset-caption-${asset.id}`}
                            name="caption"
                            defaultValue={asset.caption}
                            placeholder="Short label for the gallery card"
                          />
                        </div>
                      </div>

                      <ToggleField
                        defaultChecked={asset.featured}
                        label="Mark as featured"
                        name="featured"
                      />

                      <div className="grid gap-4 xl:grid-cols-2">
                        <AssignmentEditor
                          checkboxName="galleryCategoryIds"
                          items={data.categories.map((category) => ({
                            checked: categoryOrderMap.has(category.id),
                            description: category.description ?? undefined,
                            label: category.name,
                            order: categoryOrderMap.get(category.id) ?? category.display_order,
                            value: category.id,
                          }))}
                          orderPrefix="categoryOrder"
                          title="Category tags"
                        />
                        <AssignmentEditor
                          checkboxName="pagePlacementKeys"
                          items={mediaPlacementDefinitions.map((placement, index) => ({
                            checked: pageOrderMap.has(placement.key),
                            description: "This same image can safely appear in multiple page sections.",
                            label: placement.label,
                            order: pageOrderMap.get(placement.key) ?? (index + 1) * 10,
                            value: placement.key,
                          }))}
                          orderPrefix="placementOrder"
                          title="Page placements"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit">Save image details</Button>
                        <DeleteMediaAssetForm assetId={asset.id} label="Delete image" />
                      </div>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <CompactEmptyState
            align="left"
            title="No website images yet"
            description="Upload polished bakery photos here to build the live gallery and page placements without mixing in inquiry inspiration files."
          />
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Client uploads"
        description="These inspiration files came from inquiries and stay separate from the live website media library. Review them here, jump to the linked inquiry, or delete them when they are no longer needed."
        collapsible
        defaultOpen={false}
      >
        {data.clientAssets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {data.clientAssets.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-[1.8rem] border border-charcoal/10 bg-paper"
              >
                <AssetPreview asset={asset} />

                <div className="space-y-5 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-gold/24 bg-gold/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal">
                      Client upload
                    </span>
                    <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/68">
                      {asset.filename}
                    </span>
                    <span className="rounded-full border border-charcoal/10 bg-ivory/80 px-3 py-1 text-xs text-charcoal/66">
                      Added {formatDate(asset.createdAt)}
                    </span>
                  </div>

                  <div className="rounded-[1.55rem] border border-charcoal/10 bg-white/84 p-4 text-sm leading-6 text-charcoal/66">
                    <p>
                      <span className="font-medium text-charcoal">Storage bucket:</span> {asset.bucket}
                    </p>
                    <p className="mt-2">
                      <span className="font-medium text-charcoal">Source type:</span> {asset.sourceKind}
                    </p>
                    <p className="mt-2">
                      <span className="font-medium text-charcoal">Live site use:</span> kept separate from
                      website gallery placements
                    </p>
                    {asset.referenceCode ? (
                      <p className="mt-2">
                        <span className="font-medium text-charcoal">Inquiry reference:</span>{" "}
                        {asset.referenceCode}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {asset.inquiryId ? (
                      <Link
                        href={`/admin/inquiries/${asset.inquiryId}`}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-charcoal/12 bg-ivory/82 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/24 hover:bg-white"
                      >
                        Open inquiry
                      </Link>
                    ) : null}
                    <DeleteMediaAssetForm assetId={asset.id} label="Delete upload" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <CompactEmptyState
            align="left"
            title="No client uploads stored"
            description="Inquiry inspiration files will appear here when clients attach photos during the order request flow."
          />
        )}
      </AdminSectionCard>
    </div>
  );
}
