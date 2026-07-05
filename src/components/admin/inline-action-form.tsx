"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import type { ActionResult } from "@/actions/public";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimedMessage } from "@/components/ui/timed-message";

export function InlineActionForm({
  action,
  children,
  className,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<ActionResult | void>;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runAction() {
    const form = formRef.current;
    if (!form || isPending) return;

    startTransition(async () => {
      const response = await action(new FormData(form));
      setResult(response || { ok: true, message: "Acción realizada." });
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <form
        ref={formRef}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          if (isPending) return;
          if (confirmMessage) {
            setConfirmOpen(true);
            return;
          }

          runAction();
        }}
      >
        <fieldset disabled={isPending} className="contents">
          {children}
        </fieldset>
        <TimedMessage message={result?.message} ok={result?.ok ?? true} messageKey={result} className="basis-full" />
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={runAction} disabled={isPending}>
              {isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
