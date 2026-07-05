"use client";

import { useEffect, useState } from "react";

export function TimedMessage({
  message,
  ok = true,
  className = "",
  messageKey,
}: {
  message?: string;
  ok?: boolean;
  className?: string;
  messageKey?: unknown;
}) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;

    const showTimeout = window.setTimeout(() => setVisible(true), 0);
    const hideTimeout = window.setTimeout(() => setVisible(false), 3000);
    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [message, ok, messageKey]);

  if (!message || !visible) return null;

  return (
    <p
      aria-live="polite"
      className={`rounded-lg border px-3 py-2 text-sm font-medium shadow-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      } ${className}`}
    >
      {message}
    </p>
  );
}
