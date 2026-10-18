"use client";

import { useEffect, useRef, useState } from "react";
import { navigation } from "../data/club";
import { Arrow, Button } from "./ui";

export default function Header({ onReserve }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="header">
      <a className="header__brand" href="#inicio" aria-label="HEAT, inicio">
        <img
          src="/images/heat-logo.svg"
          width="156"
          height="52"
          alt="HEAT Pádel & Pickleball"
        />
      </a>
      <nav
        className={`header__nav${open ? " header__nav--open" : ""}`}
        id="navigation"
        aria-label="Navegación principal"
      >
        {navigation.map((item) => (
          <a
            key={item.href}
            className="header__link"
            href={item.href}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <Button className="header__reserve" onClick={onReserve}>
        Reservar cancha <Arrow diagonal />
      </Button>
      <button
        ref={toggleRef}
        className="header__toggle"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        <span /> <span />
      </button>
    </header>
  );
}
