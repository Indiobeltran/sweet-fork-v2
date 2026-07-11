import type { InquiryProductItem } from "@/types/domain";

/**
 * Pure, framework-free helpers for the Start Order inquiry wizard.
 *
 * These functions hold the wizard's step routing, error mapping, and summary
 * formatting logic so the large client component can stay focused on state and
 * presentation. Nothing here touches the submission payload, uploads, Supabase,
 * or Netlify Forms behavior — it is display/validation-routing logic only.
 */

export type ErrorMap = Record<string, string>;



export function flattenIssues(
  issues: Array<{ path: (string | number)[]; message: string }>,
): ErrorMap {
  return issues.reduce<ErrorMap>((accumulator, issue) => {
    const key = issue.path.join(".");

    if (!accumulator[key]) {
      accumulator[key] = issue.message;
    }

    return accumulator;
  }, {});
}



export function getErrorDescriptionId(key: string) {
  return `${key.replace(/[^a-z0-9_-]+/gi, "-")}-error`;
}

export function getDescribedBy(...ids: Array<string | false | null | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value.length > 0 ? value : undefined;
}

export function getFieldErrorClass(...messages: Array<string | undefined>) {
  return messages.some(Boolean)
    ? "border-rose-300 bg-rose-50/70 focus:border-rose-400 focus:ring-rose-100"
    : undefined;
}

export function getStepErrorMessage(stepIndex: number) {
  switch (stepIndex) {
    case 0:
      return "Please review the event details below before continuing.";
    case 1:
      return "Select at least one dessert to continue.";
    case 2:
      return "Each selected dessert needs its required count or serving target before you continue.";
    case 3:
      return "Please review the inspiration details below before continuing.";
    default:
      return "Please review the highlighted fields before submitting.";
  }
}

export function getSafeSubmissionErrorMessage(error: unknown) {
  const fallback = "We could not submit the inquiry right now. Please try again in a few minutes.";

  if (!(error instanceof Error) || error.message.trim().length === 0) {
    return fallback;
  }

  const message = error.message.trim();
  const isExpectedSubmissionMessage =
    message.startsWith("We ") ||
    message.startsWith("Please ") ||
    message.startsWith("This inquiry") ||
    message.startsWith("The inquiry") ||
    message.startsWith("Too many ") ||
    message.startsWith("Online submission") ||
    message.startsWith("Image ") ||
    message.startsWith("Reference ") ||
    message.includes("upload") ||
    message.includes("inspiration");

  return isExpectedSubmissionMessage ? message : fallback;
}

export function isErrorForStep(key: string, stepIndex: number) {
  if (stepIndex === 0) {
    return (
      key.startsWith("event") ||
      key.startsWith("guestCount") ||
      key.startsWith("fulfillmentMethod") ||
      key.startsWith("deliveryZip") ||
      key.startsWith("budget")
    );
  }

  if (stepIndex === 1) {
    return key === "orderItems";
  }

  if (stepIndex === 2) {
    return key.startsWith("orderItems.");
  }

  if (stepIndex === 3) {
    return (
      key.startsWith("colorPalette") ||
      key.startsWith("inspiration")
    );
  }

  return (
    key.startsWith("customer") ||
    key.startsWith("instagram") ||
    key.startsWith("preferredContact") ||
    key.startsWith("howDidYouHear") ||
    key.startsWith("additionalNotes")
  );
}

export function formatSelectedItemSummary(item: InquiryProductItem) {
  switch (item.productType) {
    case "custom-cake":
      return `${item.servings ?? "?"} servings`;
    case "wedding-cake":
      return `${item.weddingServings ?? item.servings ?? "?"} servings`;
    case "cupcakes":
      return `${item.cupcakeCount ?? "?"} cupcakes`;
    case "sugar-cookies":
      return `${item.cookieCount ?? "?"} cookies`;
    case "macarons":
      return `${item.macaronCount ?? "?"} macarons`;
    case "diy-kit":
      return `${item.kitCount ?? "?"} kits`;
    default:
      return `${item.quantity} item${item.quantity === 1 ? "" : "s"}`;
  }
}

export function findStepForErrors(errors: ErrorMap) {
  const keys = Object.keys(errors);
  if (
    keys.some(
      (key) =>
        key.startsWith("event") ||
        key.startsWith("guestCount") ||
        key.startsWith("fulfillmentMethod") ||
        key.startsWith("deliveryZip") ||
        key.startsWith("budget"),
    )
  ) {
    return 0;
  }
  if (keys.some((key) => key === "orderItems")) {
    return 1;
  }
  if (keys.some((key) => key.startsWith("orderItems."))) {
    return 2;
  }
  if (
    keys.some(
      (key) =>
        key.startsWith("colorPalette") ||
        key.startsWith("inspiration"),
    )
  ) {
    return 3;
  }
  return 4;
}
