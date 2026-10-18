"use client";

import { useEffect, useState } from "react";
import { Arrow, Button, SectionLabel } from "../ui";
import { api, dashboardDestination } from "../../lib/api";
import { clubToday } from "../../lib/booking";

export default function AuthForm({ register = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [suffix, setSuffix] = useState("");
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("sport") === "pickleball"
    )
      setSuffix("?sport=pickleball");
    api("/api/auth/get-session")
      .then((session) => {
        if (session?.user) window.location.replace(dashboardDestination());
      })
      .catch(() => {});
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const body = register
      ? { ...fields, name: `${fields.firstName} ${fields.lastName}` }
      : fields;
    try {
      await api(`/api/auth/${register ? "sign-up" : "sign-in"}/email`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      window.location.assign(dashboardDestination());
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <main className="account-entry">
      <aside className="account-entry__story">
        <img
          className="account-entry__background"
          src="/images/club-wide.webp"
          alt=""
        />
        <a className="account-entry__brand" href="/" aria-label="Volver a HEAT">
          <img src="/images/heat-logo.svg" width="156" height="52" alt="HEAT" />
        </a>
        <div className="account-entry__headline">
          <SectionLabel light>TU PRÓXIMO PARTIDO EMPIEZA AQUÍ</SectionLabel>
          <p>
            ENTRA.
            <br />
            JUEGA.
            <br />
            <span>SIENTE HEAT.</span>
          </p>
        </div>
        <img
          className="account-entry__player"
          src="/images/player-padel.webp"
          alt="Jugador de pádel en acción"
        />
        <p className="account-entry__location">
          PLAYA DEL CARMEN <span>20.65° N / 87.07° W</span>
        </p>
      </aside>
      <section className="account-entry__panel">
        <a className="account-entry__back" href="/">
          ← Volver al club
        </a>
        <div className="account-entry__form-wrap">
          <SectionLabel>
            {register ? "TU LUGAR EN LA CANCHA" : "QUÉ BUENO VERTE DE NUEVO"}
          </SectionLabel>
          <h1 className="account-entry__title">
            {register ? (
              <>
                HAZLO
                <br />
                <span>TUYO.</span>
              </>
            ) : (
              <>
                VOLVEMOS
                <br />
                <span>A JUGAR.</span>
              </>
            )}
          </h1>
          <p className="account-entry__intro">
            {register
              ? "Crea tu cuenta. Elige tu turno. Nos vemos en HEAT."
              : "Entra a tu cuenta y prepara tu próximo partido."}
          </p>
          <form className="account-form" onSubmit={submit}>
            {register && (
              <>
                <div className="account-form__row">
                  <label className="account-form__field">
                    Nombre
                    <input
                      name="firstName"
                      autoComplete="given-name"
                      required
                      maxLength="80"
                      placeholder="Tu nombre"
                    />
                  </label>
                  <label className="account-form__field">
                    Apellido
                    <input
                      name="lastName"
                      autoComplete="family-name"
                      required
                      maxLength="80"
                      placeholder="Tu apellido"
                    />
                  </label>
                </div>
                <div className="account-form__row account-form__row--birth-details">
                  <label className="account-form__field">
                    Fecha de nacimiento
                    <input
                      type="date"
                      className="account-form__date"
                      name="birthDate"
                      autoComplete="bday"
                      required
                      min="1900-01-01"
                      max={clubToday()}
                    />
                  </label>
                  <label className="account-form__field">
                    Nacionalidad
                    <input
                      name="nationality"
                      required
                      maxLength="80"
                      placeholder="Ej. mexicana"
                    />
                  </label>
                </div>
              </>
            )}
            <label className="account-form__field">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength="254"
                placeholder="tu@email.com"
              />
            </label>
            <label className="account-form__field">
              Contraseña
              <span className="account-form__password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 10 : 1}
                  maxLength="128"
                  placeholder={
                    register ? "Mínimo 10 caracteres" : "Tu contraseña"
                  }
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </span>
            </label>
            {error && (
              <p className="account-form__error" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="account-form__submit"
              variant="dark"
              disabled={busy}
            >
              {busy
                ? "Un momento…"
                : register
                  ? "Crear mi cuenta"
                  : "Entrar a mi cuenta"}
              <Arrow />
            </Button>
          </form>
          <p className="account-entry__switch">
            {register
              ? "¿Ya eres parte de HEAT?"
              : "¿Es tu primer partido con nosotros?"}{" "}
            <a href={`${register ? "/login" : "/registro"}${suffix}`}>
              {register ? "Inicia sesión" : "Crea tu cuenta"} ↗
            </a>
          </p>
        </div>
        <p className="account-entry__footnote">TU JUEGO. TU RITMO. TU LUGAR.</p>
      </section>
    </main>
  );
}
