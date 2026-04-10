import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { InquirySubmissionError, submitInquiry } from "@/lib/inquiries/submit";
import {
  MAX_INQUIRY_PAYLOAD_SIZE_BYTES,
  normalizeInquiryFormValues,
} from "@/lib/validations/inquiry";

const MIN_SUBMISSION_TIME_MS = 3500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const DUPLICATE_SUBMISSION_WINDOW_MS = 15 * 60 * 1000;

const submissionAttempts = new Map<string, number[]>();
const recentSubmissionFingerprints = new Map<string, number>();
const pendingSubmissionFingerprints = new Set<string>();

function isInquirySubmissionError(
  error: unknown,
): error is Pick<InquirySubmissionError, "message" | "status"> {
  return Boolean(
    error &&
      typeof error === "object" &&
      "message" in error &&
      "status" in error &&
      typeof error.message === "string" &&
      typeof error.status === "number",
  );
}

function getClientIdentifier(request: Request) {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const connectingIp = request.headers.get("cf-connecting-ip");

  return (
    vercelForwardedFor?.split(",")[0]?.trim() ||
    forwardedFor?.split(",")[0]?.trim() ||
    connectingIp?.trim() ||
    realIp?.trim() ||
    "anonymous"
  );
}

function registerSubmissionAttempt(identifier: string) {
  const now = Date.now();
  const recentAttempts = (submissionAttempts.get(identifier) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  submissionAttempts.set(identifier, [...recentAttempts, now]);

  return recentAttempts.length >= MAX_SUBMISSIONS_PER_WINDOW;
}

function parsePayload(payload: string) {
  if (payload.length > MAX_INQUIRY_PAYLOAD_SIZE_BYTES) {
    throw new InquirySubmissionError(
      "Some inquiry details are too long to send at once. Please shorten the notes and try again.",
    );
  }

  try {
    const parsed = JSON.parse(payload);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid payload shape.");
    }

    return parsed;
  } catch {
    throw new InquirySubmissionError(
      "We couldn't read the inquiry details. Please refresh the page and try again.",
    );
  }
}

function createSubmissionFingerprint(payload: unknown, files: File[]) {
  const normalized = normalizeInquiryFormValues(payload);

  const itemFingerprint = [...normalized.orderItems]
    .map((item) => ({
      colorPalette: item.colorPalette ?? "",
      cookieCount: item.cookieCount ?? 0,
      cupcakeCount: item.cupcakeCount ?? 0,
      designNotes: item.designNotes ?? "",
      flavorNotes: item.flavorNotes ?? "",
      icingStyle: item.icingStyle ?? "",
      inspirationNotes: item.inspirationNotes ?? "",
      kitCount: item.kitCount ?? 0,
      macaronCount: item.macaronCount ?? 0,
      productType: item.productType,
      servings: item.servings ?? 0,
      shape: item.shape ?? "",
      tiers: item.tiers ?? 0,
      topperText: item.topperText ?? "",
      weddingServings: item.weddingServings ?? 0,
    }))
    .sort((left, right) => left.productType.localeCompare(right.productType));

  const payloadFingerprint = {
    additionalNotes: normalized.additionalNotes ?? "",
    budgetFlexibility: normalized.budgetFlexibility,
    budgetRange: normalized.budgetRange,
    colorPalette: normalized.colorPalette ?? "",
    customerEmail: normalized.customerEmail,
    customerName: normalized.customerName.toLowerCase(),
    customerPhone: normalized.customerPhone.replace(/\D/g, ""),
    deliveryZip: normalized.deliveryZip ?? "",
    eventDate: normalized.eventDate,
    eventType: normalized.eventType.toLowerCase(),
    fulfillmentMethod: normalized.fulfillmentMethod,
    guestCount: normalized.guestCount ?? 0,
    inspirationLinks: [...normalized.inspirationLinks].sort(),
    inspirationText: normalized.inspirationText ?? "",
    orderItems: itemFingerprint,
    preferredContact: normalized.preferredContact,
  };

  const uploadFingerprint = files
    .map((file) => `${file.name}:${file.size}:${file.type}`)
    .sort();

  return createHash("sha256")
    .update(JSON.stringify({ payload: payloadFingerprint, uploads: uploadFingerprint }))
    .digest("hex");
}

function pruneRecentSubmissionFingerprints() {
  const now = Date.now();

  recentSubmissionFingerprints.forEach((timestamp, key) => {
    if (now - timestamp >= DUPLICATE_SUBMISSION_WINDOW_MS) {
      recentSubmissionFingerprints.delete(key);
    }
  });
}

function getFingerprintKey(identifier: string, fingerprint: string) {
  return `${identifier}:${fingerprint}`;
}

function hasRecentSubmission(identifier: string, fingerprint: string) {
  pruneRecentSubmissionFingerprints();

  const key = getFingerprintKey(identifier, fingerprint);
  const submittedAt = recentSubmissionFingerprints.get(key);

  return pendingSubmissionFingerprints.has(key) || Boolean(
    submittedAt && Date.now() - submittedAt < DUPLICATE_SUBMISSION_WINDOW_MS,
  );
}

function markSubmissionPending(identifier: string, fingerprint: string) {
  pendingSubmissionFingerprints.add(getFingerprintKey(identifier, fingerprint));
}

function markSubmissionComplete(identifier: string, fingerprint: string) {
  const key = getFingerprintKey(identifier, fingerprint);

  pendingSubmissionFingerprints.delete(key);
  recentSubmissionFingerprints.set(key, Date.now());
}

function clearPendingSubmission(identifier: string, fingerprint: string) {
  pendingSubmissionFingerprints.delete(getFingerprintKey(identifier, fingerprint));
}

function validateSubmissionTiming(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InquirySubmissionError(
      "Please take a moment to review the inquiry before submitting.",
    );
  }

  const startedAt = Number(value);

  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_SUBMISSION_TIME_MS) {
    throw new InquirySubmissionError(
      "Please take a moment to review the inquiry before submitting.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const honeypot = formData.get("website");
    const payload = formData.get("payload");
    const identifier = getClientIdentifier(request);

    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      throw new InquirySubmissionError(
        "We couldn't verify this inquiry. Please refresh the page and try again.",
      );
    }

    validateSubmissionTiming(formData.get("startedAt"));

    if (typeof payload !== "string") {
      return NextResponse.json(
        {
          error: "Missing inquiry details.",
        },
        { status: 400 },
      );
    }

    if (registerSubmissionAttempt(identifier)) {
      return NextResponse.json(
        {
          error: "Too many inquiry attempts were received. Please wait a few minutes and try again.",
        },
        { status: 429 },
      );
    }

    const files = formData
      .getAll("inspirationFiles")
      .filter((entry): entry is File => entry instanceof File);
    const parsedPayload = parsePayload(payload);
    const fingerprint = createSubmissionFingerprint(parsedPayload, files);

    if (hasRecentSubmission(identifier, fingerprint)) {
      return NextResponse.json(
        {
          error:
            "This inquiry looks like it was just sent. Please wait a few minutes before submitting it again.",
        },
        { status: 429 },
      );
    }

    markSubmissionPending(identifier, fingerprint);

    let result: Awaited<ReturnType<typeof submitInquiry>>;

    try {
      result = await submitInquiry(parsedPayload, files);
    } catch (error) {
      clearPendingSubmission(identifier, fingerprint);
      throw error;
    }

    markSubmissionComplete(identifier, fingerprint);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      isInquirySubmissionError(error)
        ? error.message
        : "We could not submit the inquiry right now. Please try again in a few minutes.";
    const status = isInquirySubmissionError(error) ? error.status : 500;

    if (!isInquirySubmissionError(error)) {
      console.error("Inquiry submission failed.", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
