"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
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

export function ApiStateForm({
  endpoint,
  redirectTo,
  className,
  children,
}: {
  endpoint: string;
  redirectTo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionResult>({ ok: false, message: "" });

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;

        const form = event.currentTarget;
        setPending(true);
        setState({ ok: false, message: "" });

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            body: new FormData(form),
          });
          const result = (await response.json()) as ActionResult;
          setState(result);

          if (result.ok && redirectTo) {
            window.sessionStorage.setItem("adminFlash", JSON.stringify(result));
            router.push(redirectTo);
            router.refresh();
          }
        } catch {
          setState({ ok: false, message: "No se pudo completar la acción." });
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
    </form>
  );
}
