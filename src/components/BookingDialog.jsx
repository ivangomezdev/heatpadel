"use client";

import { useEffect, useRef } from "react";
import { club } from "../data/club";
import { Arrow, Button, SectionLabel } from "./ui";

export default function BookingDialog({ open, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="booking"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="booking-title"
    >
      <div className="booking__content">
        <button
          className="booking__close"
          onClick={onClose}
          aria-label="Cerrar reservas"
        >
          ×
        </button>
        <SectionLabel>ELIGE TU PRÓXIMO PARTIDO</SectionLabel>
        <h2 className="booking__title" id="booking-title">
          LA CANCHA
          <br />
          TE ESPERA.
        </h2>
        <p className="booking__description">
          Consulta los horarios disponibles y confirma tu reserva en Playtomic,
          o habla directamente con nuestro equipo.
        </p>
        <a
          className="booking__option"
          href={`${club.playtomic}?sport=PADEL`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <strong>Pádel</strong>
            <small>5 canchas · Reservar en Playtomic</small>
          </span>
          <Arrow diagonal />
        </a>
        <a
          className="booking__option"
          href={`${club.playtomic}?sport=PICKLEBALL`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <strong>Pickleball</strong>
            <small>4 canchas · Reservar en Playtomic</small>
          </span>
          <Arrow diagonal />
        </a>
        <Button
          className="booking__whatsapp"
          href={club.whatsapp}
          external
          variant="dark"
        >
          Reservar por WhatsApp <Arrow diagonal />
        </Button>
        <p className="booking__hours">Atención todos los días · {club.hours}</p>
      </div>
    </dialog>
  );
}
