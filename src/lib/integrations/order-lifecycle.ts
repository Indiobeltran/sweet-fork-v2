import "server-only";

import { sendOrderLifecycleEmail } from "@/lib/integrations/customer-email-workflow";
import { syncConfirmedOrderToGoogleCalendar } from "@/lib/integrations/google-calendar-workflow";

export async function handleConfirmedOrderIntegrations(orderId: string) {
  const [calendar, email] = await Promise.allSettled([
    syncConfirmedOrderToGoogleCalendar(orderId),
    sendOrderLifecycleEmail(orderId, "booking"),
  ]);

  return {
    calendar: calendar.status,
    email: email.status,
  };
}
