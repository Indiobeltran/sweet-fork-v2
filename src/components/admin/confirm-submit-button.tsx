"use client";

import type { ComponentProps, MouseEventHandler } from "react";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  };

  return <Button {...props} onClick={handleClick} />;
}
