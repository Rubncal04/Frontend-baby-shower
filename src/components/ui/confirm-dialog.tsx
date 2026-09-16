"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Modal confirmation for destructive actions, with focus restore. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusable = node?.querySelector<HTMLElement>("button");
    focusable?.focus();

    /** Closes on Escape and keeps focus inside the dialog. */
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !node) return;
      const items = [
        ...node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((item) => !item.hasAttribute("disabled"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={cancelLabel}
        className="absolute inset-0 bg-navy-950/45"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-md overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-6 paper-shadow"
        style={{ overscrollBehavior: "contain" }}
      >
        <h2 id={titleId} className="font-display text-2xl text-foreground">
          {title}
        </h2>
        <p id={bodyId} className="mt-2 text-sm text-muted">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
