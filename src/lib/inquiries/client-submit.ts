import type { InquirySubmissionResponse } from "@/lib/inquiries/types";
import type { InquiryFormValues } from "@/lib/validations/inquiry";

type InquirySubmissionRequest = {
  fetchImpl?: typeof fetch;
  honeypotValue: string;
  startedAt: number;
  values: InquiryFormValues;
};

function isInquirySubmissionResponse(
  value: unknown,
): value is InquirySubmissionResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "inquiryId" in value &&
      typeof value.inquiryId === "string" &&
      value.inquiryId.length > 0 &&
      "persisted" in value &&
      value.persisted === true &&
      "referenceCode" in value &&
      typeof value.referenceCode === "string" &&
      value.referenceCode.length > 0,
  );
}

export async function submitInquiryRequest({
  fetchImpl = fetch,
  honeypotValue,
  startedAt,
  values,
}: InquirySubmissionRequest): Promise<InquirySubmissionResponse> {
  const response = await fetchImpl("/api/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload: values,
      startedAt,
      website: honeypotValue,
    }),
  });
  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
        ? payload.error
        : "We could not submit the inquiry right now.",
    );
  }

  if (!isInquirySubmissionResponse(payload)) {
    throw new Error("We could not confirm that the inquiry was saved.");
  }

  return payload;
}
