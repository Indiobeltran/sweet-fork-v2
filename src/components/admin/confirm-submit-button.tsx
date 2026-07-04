"use client";

import type { ComponentProps, MouseEventHandler } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  confirmMessage: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  disabled,
  onClick,
  pendingLabel = "Working...",
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (pending) {
      event.preventDefault();
      return;
    }

    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return (
    <Button {...props} disabled={disabled || pending} onClick={handleClick}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
