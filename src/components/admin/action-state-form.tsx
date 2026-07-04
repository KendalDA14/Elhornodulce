"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/actions/public";
import { TimedMessage } from "@/components/ui/timed-message";

const initialState: ActionResult = { ok: false, message: "" };

export function ActionStateForm({
  action,
  className,
  children,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {children}
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
    </form>
  );
}
