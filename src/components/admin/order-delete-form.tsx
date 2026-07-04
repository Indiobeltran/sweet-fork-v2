"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_DELETE_CONFIRMATION_TEXT } from "@/lib/admin/order-deletion";

type OrderDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  orderReference: string;
  redirectTo: string;
  safeOrderLabel: string;
  unavailableReason?: string;
};

function DeleteDialogSubmitButton({
  confirmationMatches,
  submitted,
}: Readonly<{
  confirmationMatches: boolean;
  submitted: boolean;
}>) {
  const { pending } = useFormStatus();
  const disabled = pending || submitted || !confirmationMatches;

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={disabled}
      className="w-full border-rose/35 bg-rose-700 text-white hover:border-rose/45 hover:bg-rose-800 disabled:bg-charcoal/12 disabled:text-charcoal/45 sm:w-auto"
    >
      {pending || submitted ? "Deleting..." : "Permanently delete order"}
    </Button>
  );
}

export function OrderDeleteForm({
  action,
  orderId,
  orderReference,
  redirectTo,
  safeOrderLabel,
  unavailableReason,
}: Readonly<OrderDeleteFormProps>) {
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const confirmationMatches = confirmText === ORDER_DELETE_CONFIRMATION_TEXT;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (dialogOpen && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => confirmInputRef.current?.focus());
      return;
    }

    if (!dialogOpen && dialog.open) {
      dialog.close();
    }
  }, [dialogOpen]);

  const closeDialog = () => {
    if (submitted) {
      return;
    }

    setConfirmText("");
    setDialogOpen(false);
  };

  return (
    <section className="rounded-[1.75rem] border border-rose/20 bg-rose/5 p-4 shadow-soft sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
        Delete order
      </p>
      <h2 className="mt-2 font-serif text-[1.6rem] tracking-[-0.04em] text-charcoal sm:text-[1.75rem]">
        Permanently delete order
      </h2>
      <p className="mt-3 text-sm leading-7 text-charcoal/68">
        Permanent deletion is reserved for cancelled orders that should no longer appear in
        admin workflows.
      </p>

      {unavailableReason ? (
        <div className="mt-4 rounded-[1.25rem] border border-charcoal/10 bg-white/78 p-4">
          <p className="text-sm font-medium text-charcoal">{unavailableReason}</p>
          <Button
            type="button"
            variant="secondary"
            disabled
            className="mt-3 w-full border-charcoal/12 bg-white text-charcoal/45 sm:w-auto"
          >
            Permanently delete order
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full border-rose/30 bg-white text-rose-700 hover:border-rose/45 hover:bg-rose/10 sm:w-auto"
            onClick={() => setDialogOpen(true)}
          >
            Permanently delete order
          </Button>

          <dialog
            ref={dialogRef}
            aria-labelledby="delete-order-dialog-title"
            aria-describedby="delete-order-dialog-description"
            className="w-[min(calc(100vw-2rem),36rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.35rem] border border-rose/25 bg-white p-0 text-charcoal shadow-2xl backdrop:bg-charcoal/45"
            onCancel={closeDialog}
            onClose={() => {
              if (!submitted) {
                setDialogOpen(false);
              }
            }}
          >
            <div className="p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Destructive action
              </p>
              <h3
                id="delete-order-dialog-title"
                className="mt-2 font-serif text-[1.65rem] tracking-[-0.04em] text-charcoal"
              >
                Permanently delete order
              </h3>
              <p
                id="delete-order-dialog-description"
                className="mt-3 text-sm leading-7 text-charcoal/68"
              >
                This cannot be undone. Associated order items, payment records, and internal
                order notes will also be removed. Customer and inquiry records will be
                preserved.
              </p>

              <dl className="mt-4 space-y-3 rounded-[1.1rem] border border-charcoal/10 bg-ivory/70 p-4 text-sm">
                <div>
                  <dt className="font-semibold text-charcoal/55">Order reference</dt>
                  <dd className="mt-1 break-words font-medium text-charcoal">{orderReference}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-charcoal/55">Full UUID</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-semibold text-charcoal">
                    {orderId}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-charcoal/55">Safe order label</dt>
                  <dd className="mt-1 break-words font-medium text-charcoal">{safeOrderLabel}</dd>
                </div>
              </dl>

              <form
                action={action}
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  if (!confirmationMatches || submitted) {
                    event.preventDefault();
                    return;
                  }

                  setSubmitted(true);
                }}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div>
                  <Label htmlFor="deleteOrderConfirmation">
                    Type {ORDER_DELETE_CONFIRMATION_TEXT} to confirm
                  </Label>
                  <Input
                    ref={confirmInputRef}
                    id="deleteOrderConfirmation"
                    name="deleteOrderConfirmation"
                    value={confirmText}
                    disabled={submitted}
                    autoComplete="off"
                    className="mt-2"
                    onChange={(event) => setConfirmText(event.target.value)}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-charcoal/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={submitted}
                    className="w-full sm:w-auto"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <DeleteDialogSubmitButton
                    confirmationMatches={confirmationMatches}
                    submitted={submitted}
                  />
                </div>
              </form>
            </div>
          </dialog>
        </>
      )}
    </section>
  );
}
