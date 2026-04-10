import { NextResponse } from "next/server";

import { InquirySubmissionError, submitInquiry } from "@/lib/inquiries/submit";

const MIN_SUBMISSION_TIME_MS = 3500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

const submissionAttempts = new Map<string, number[]>();

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "anonymous";
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

    if (registerSubmissionAttempt(getClientIdentifier(request))) {
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

    const result = await submitInquiry(parsePayload(payload), files);

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
