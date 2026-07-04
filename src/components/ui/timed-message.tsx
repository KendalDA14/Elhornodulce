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
      className={`${ok ? "text-emerald-700" : "text-destructive"} text-sm ${className}`}
    >
      {message}
    </p>
  );
}
