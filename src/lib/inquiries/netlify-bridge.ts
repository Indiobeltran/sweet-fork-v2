// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getBudgetFlexibilityLabel, getBudgetRangeLabel } from "./config.ts";
// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { getProductDisplayLabel } from "../pricing.ts";
import type { BudgetFlexibility, BudgetRangeValue, InquiryProductItem } from "../../types/domain.ts";

function describeItem(item: InquiryProductItem) {
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

export function serializeNetlifyFormsPayload(data: {
  inquiryId: string;
  referenceCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  eventDate: string;
  eventType: string;
  fulfillmentMethod: string;
  budgetRange: BudgetRangeValue;
  budgetFlexibility: BudgetFlexibility;
  additionalNotes: string | null | undefined;
  orderItems: InquiryProductItem[];
  origin: string;
}) {
  const params = new URLSearchParams();
  params.append("form-name", "inquiry-notification");
  params.append("inquiryId", data.inquiryId);
  params.append("referenceCode", data.referenceCode);
  params.append("name", data.customerName);
  params.append("email", data.customerEmail);
  params.append("phone", data.customerPhone || "Not provided");
  params.append("eventDate", data.eventDate);
  params.append("eventType", data.eventType);
  params.append("fulfillmentMethod", data.fulfillmentMethod);
  params.append("budgetRange", getBudgetRangeLabel(data.budgetRange));
  params.append("budgetFlexibility", getBudgetFlexibilityLabel(data.budgetFlexibility));
  params.append("notes", data.additionalNotes || "None");

  const itemSummary = data.orderItems
    .map((item) => `${getProductDisplayLabel(item.productType)}: ${describeItem(item)}`)
    .join("; ");
  params.append("items", itemSummary);
  params.append("adminUrl", `${data.origin}/admin/inquiries/${data.inquiryId}`);

  return params.toString();
}

export async function submitNetlifyFormsBridge(
  payloadString: string,
  origin: string,
): Promise<boolean> {
  const targetUrl = `${origin}/__forms.html`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Netlify Forms notification bridge returned status ${response.status} for target ${targetUrl}`);
      return false;
    }

    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Netlify Forms notification bridge network request failed:", error);
    return false;
  }
}
