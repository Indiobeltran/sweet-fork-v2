"use client";

import { useEffect, useId, useState } from "react";

import { validateMediaUploadFile } from "@/lib/admin/media-upload-validation";

type MediaUploadFormGuardProps = {
  inputId: string;
};

export function MediaUploadFormGuard({ inputId }: Readonly<MediaUploadFormGuardProps>) {
  const errorId = useId();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const input = document.getElementById(inputId);

    if (!(input instanceof HTMLInputElement) || input.type !== "file") {
      return;
    }

    const form = input.form;

    if (!form) {
      return;
    }

    const existingDescriptionIds = input.getAttribute("aria-describedby");
    input.setAttribute("aria-describedby", [existingDescriptionIds, errorId].filter(Boolean).join(" "));

    const validateCurrentFile = () => {
      const file = input.files?.[0];

      if (!file) {
        setMessage("");
        return true;
      }

      const result = validateMediaUploadFile(file);

      if (!result.ok) {
        setMessage(result.message);
        return false;
      }

      setMessage("");
      return true;
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (validateCurrentFile()) {
        return;
      }

      event.preventDefault();
      input.focus();
    };

    input.addEventListener("change", validateCurrentFile);
    form.addEventListener("submit", handleSubmit);

    return () => {
      input.removeEventListener("change", validateCurrentFile);
      form.removeEventListener("submit", handleSubmit);
      if (existingDescriptionIds) {
        input.setAttribute("aria-describedby", existingDescriptionIds);
      } else {
        input.removeAttribute("aria-describedby");
      }
    };
  }, [errorId, inputId]);

  return (
    <p id={errorId} role={message ? "alert" : undefined} className="mt-2 text-sm leading-6 text-rose-700">
      {message}
    </p>
  );
}
