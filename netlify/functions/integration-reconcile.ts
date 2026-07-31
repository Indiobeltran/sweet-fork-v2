import { hydrateNetlifyEnvironment } from "./_shared/runtime-env";

import { dispatchDueCustomerEmails } from "../../src/lib/integrations/customer-email-workflow";
import { renewGoogleCalendarWatch, syncGoogleCalendar } from "../../src/lib/integrations/google-calendar-workflow";
import { reconcileAllSquareInvoices } from "../../src/lib/integrations/square-workflow";

export default async function integrationReconcile() {
  hydrateNetlifyEnvironment();
  const results = await Promise.allSettled([
    reconcileAllSquareInvoices(),
    syncGoogleCalendar(),
    renewGoogleCalendarWatch(),
    dispatchDueCustomerEmails(),
  ]);
  const failed = results.filter((result) => result.status === "rejected").length;
  return new Response(JSON.stringify({ failed, ok: failed === 0 }), {
    headers: { "Content-Type": "application/json" },
    status: failed === results.length ? 500 : 200,
  });
}

export const config = {
  schedule: "*/15 * * * *",
};
