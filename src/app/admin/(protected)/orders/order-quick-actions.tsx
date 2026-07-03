"use client";

import { CheckCircle2, MoreHorizontal, RotateCcw } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  markOrderCompletedQuickAction,
  markOrderPaidQuickAction,
  undoMarkOrderCompletedQuickAction,
  undoMarkOrderPaidQuickAction,
} from "@/app/admin/(protected)/orders/actions";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/types/supabase.generated";

type UndoPayload =
  | {
      orderId: string;
      paymentId: string;
      type: "payment";
    }
  | {
      completedAt: string | null;
      orderId: string;
      previousStatus: Enums<"order_status">;
      type: "status";
    };

type NoticeState = {
  message: string;
  undo?: UndoPayload;
};

type OrderQuickActionsProps = {
  balanceDue: number;
  orderId: string;
  status: Enums<"order_status">;
};

export function OrderQuickActions({
  balanceDue,
  orderId,
  status,
}: Readonly<OrderQuickActionsProps>) {
  const pressTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isPending, startTransition] = useTransition();
  const canMarkCompleted = status !== "completed" && status !== "cancelled";
  const canMarkPaid = balanceDue > 0;

  function clearPressTimer() {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  function handlePressStart() {
    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => setIsOpen(true), 450);
  }

  function runAction(action: "paid" | "completed") {
    startTransition(async () => {
      const result =
        action === "paid"
          ? await markOrderPaidQuickAction({ orderId })
          : await markOrderCompletedQuickAction({ orderId });

      setNotice(result.ok ? { message: result.message, undo: result.undo } : { message: result.message });
      setIsOpen(false);
    });
  }

  function undoAction(undo: UndoPayload) {
    startTransition(async () => {
      const result =
        undo.type === "payment"
          ? await undoMarkOrderPaidQuickAction({
              orderId: undo.orderId,
              paymentId: undo.paymentId,
            })
          : await undoMarkOrderCompletedQuickAction({
              completedAt: undo.completedAt,
              orderId: undo.orderId,
              previousStatus: undo.previousStatus,
            });

      setNotice({ message: result.message });
    });
  }

  return (
    <div
      className="relative"
      onPointerDown={handlePressStart}
      onPointerLeave={clearPressTimer}
      onPointerUp={clearPressTimer}
      onPointerCancel={clearPressTimer}
      onContextMenu={(event) => {
        event.preventDefault();
        setIsOpen(true);
      }}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-11 w-11 rounded-full px-0"
        aria-expanded={isOpen}
        aria-label="Show order quick actions"
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-56 rounded-[1.25rem] border border-charcoal/10 bg-ivory p-2 shadow-[0_18px_45px_rgba(53,37,29,0.16)]">
          <button
            type="button"
            disabled={!canMarkPaid || isPending}
            className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2.5 text-left text-sm font-medium text-charcoal transition hover:bg-white disabled:cursor-not-allowed disabled:text-charcoal/38"
            onClick={() => runAction("paid")}
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-700" />
            Mark paid
          </button>
          <button
            type="button"
            disabled={!canMarkCompleted || isPending}
            className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2.5 text-left text-sm font-medium text-charcoal transition hover:bg-white disabled:cursor-not-allowed disabled:text-charcoal/38"
            onClick={() => runAction("completed")}
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-charcoal/64" />
            Mark completed
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-[1.1rem] border border-charcoal/10 bg-charcoal px-4 py-3 text-sm text-ivory shadow-[0_18px_45px_rgba(53,37,29,0.22)]"
        >
          <span>{notice.message}</span>
          {notice.undo ? (
            <button
              type="button"
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-ivory transition hover:bg-white/18"
              onClick={() => notice.undo && undoAction(notice.undo)}
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
