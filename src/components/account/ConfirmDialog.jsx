"use client";
import { useEffect, useRef } from "react";
import { Button } from "../ui";
export default function ConfirmDialog({
  action,
  busy,
  error,
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (action && !dialog.open) dialog.showModal();
    if (!action && dialog.open) dialog.close();
  }, [action]);
  return (
    <dialog
      className="reservation-dialog"
      ref={ref}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
      aria-labelledby="reservation-dialog-title"
    >
      {action && (
        <>
          <p className="reservation-dialog__eyebrow">TU PARTIDO EN HEAT</p>
          <h2 id="reservation-dialog-title">{action.title}</h2>
          <p>{action.description}</p>
          {error && (
            <p className="account-form__error" role="alert">
              {error}
            </p>
          )}
          <div className="reservation-dialog__actions">
            <Button variant="dark" disabled={busy} onClick={onConfirm}>
              {busy ? "Guardando…" : action.label}
            </Button>
            <button
              className="dashboard__text-button"
              disabled={busy}
              onClick={onClose}
            >
              Volver
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
