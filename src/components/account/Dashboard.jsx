"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Button, SectionLabel } from "../ui";
import { api } from "../../lib/api";
import {
  COURTS,
  HOURS,
  clubToday,
  startsAt,
  canChange,
  formatDate,
  formatHour,
} from "../../lib/booking";
import ConfirmDialog from "./ConfirmDialog";
import BookingDatePicker from "./BookingDatePicker";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("book");
  const [sport, setSport] = useState("padel");
  const [courtId, setCourtId] = useState("padel-1");
  const [date, setDate] = useState(clubToday);
  const [hour, setHour] = useState(null);
  const [occupied, setOccupied] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [now, setNow] = useState(Date.now);
  const [history, setHistory] = useState(false);
  const clockOffset = useRef(0);
  const requestId = useRef(0);
  function syncClock(serverNow) {
    clockOffset.current = serverNow - Date.now();
    setNow(serverNow);
  }
  function handleError(e) {
    if (e.status === 401) {
      window.location.assign(
        `/login${sport === "pickleball" ? "?sport=pickleball" : ""}`,
      );
      return;
    }
    setError(e.message);
  }
  async function loadReservations() {
    const data = await api("/api/reservations");
    setReservations(data.reservations);
    syncClock(data.serverNow);
  }
  const loadAvailability = useCallback(
    async (quiet = false) => {
      const id = ++requestId.current;
      if (!quiet) setLoading(true);
      try {
        const data = await api(
          `/api/availability?date=${encodeURIComponent(date)}`,
        );
        if (id !== requestId.current) return;
        setOccupied(data.occupied);
        syncClock(data.serverNow);
        setAvailabilityError("");
      } catch (e) {
        if (id === requestId.current) {
          setAvailabilityError(e.message);
          if (e.status === 401) window.location.assign("/login");
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [date],
  );
  useEffect(() => {
    api("/api/auth/get-session")
      .then(async (session) => {
        if (!session?.user) {
          window.location.replace(`/login${window.location.search}`);
          return;
        }
        setUser(session.user);
        await loadReservations();
      })
      .catch(handleError);
    if (
      new URLSearchParams(window.location.search).get("sport") === "pickleball"
    ) {
      setSport("pickleball");
      setCourtId("pickleball-1");
    }
    const timer = setInterval(
      () => setNow(Date.now() + clockOffset.current),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!user) return;
    loadAvailability();
    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadAvailability(true);
        loadReservations().catch(handleError);
      }
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      ++requestId.current;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [user, loadAvailability]);
  const court = COURTS.find((c) => c.id === courtId);
  const upcoming = reservations
    .filter((r) => r.status === "confirmed" && r.startsAt > now)
    .sort((a, b) => a.startsAt - b.startsAt);
  const past = reservations.filter(
    (r) => r.status === "cancelled" || r.startsAt <= now,
  );
  const isBlocked = (h) =>
    startsAt(date, h) <= now ||
    occupied.some(
      (slot) =>
        slot.courtId === courtId &&
        slot.hour === h &&
        !(
          editing?.courtId === courtId &&
          editing.date === date &&
          editing.hour === h
        ),
    );
  const ready =
    hour !== null && !loading && !availabilityError && !isBlocked(hour);
  function chooseSport(value) {
    setSport(value);
    setCourtId(`${value}-1`);
    setHour(null);
  }
  function startEdit(reservation) {
    setEditing(reservation);
    setSport(COURTS.find((c) => c.id === reservation.courtId).sport);
    setCourtId(reservation.courtId);
    setDate(reservation.date);
    setHour(null);
    setView("book");
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openAction(value) {
    setDialogError("");
    setAction(value);
  }
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setDialogError("");
    try {
      if (action.type === "cancel")
        await api(`/api/reservations/${action.reservation.id}`, {
          method: "DELETE",
          body: JSON.stringify({ version: action.reservation.version }),
        });
      else
        await api(
          editing ? `/api/reservations/${editing.id}` : "/api/reservations",
          {
            method: editing ? "PATCH" : "POST",
            body: JSON.stringify({
              courtId,
              date,
              hour,
              ...(editing ? { version: editing.version } : {}),
            }),
          },
        );
      const message =
        action.type === "cancel"
          ? "Reserva cancelada. El turno vuelve a estar disponible."
          : editing
            ? "Cambio confirmado. Tu nuevo turno ya está reservado."
            : "¡La cancha es tuya! Tu reserva está confirmada.";
      setAction(null);
      setEditing(null);
      setHour(null);
      setNotice(message);
      setError("");
      setView("reservations");
      setHistory(false);
      await Promise.all([loadReservations(), loadAvailability()]);
    } catch (e) {
      setDialogError(e.message);
      if (e.status === 401) handleError(e);
      await loadAvailability();
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/api/auth/sign-out", { method: "POST", body: "{}" });
      window.location.assign("/");
    } catch (e) {
      handleError(e);
    }
  }
  if (!user)
    return (
      <main className="dashboard__loading">
        <img src="/images/heat-logo-dark.svg" alt="HEAT" width="150" />
        <p role="status">Preparando tu próxima jugada…</p>
        {error && (
          <>
            <p role="alert">{error}</p>
            <a href="/login">Volver a iniciar sesión</a>
          </>
        )}
      </main>
    );
  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <a href="/" aria-label="HEAT, volver al club">
          <img src="/images/heat-logo.svg" width="126" height="42" alt="HEAT" />
        </a>
        <nav className="dashboard__nav" aria-label="Mi cuenta">
          <button
            className={
              view === "book"
                ? "dashboard__nav-link dashboard__nav-link--active"
                : "dashboard__nav-link"
            }
            onClick={() => setView("book")}
          >
            Reservar cancha
          </button>
          <button
            className={
              view === "reservations"
                ? "dashboard__nav-link dashboard__nav-link--active"
                : "dashboard__nav-link"
            }
            onClick={() => {
              setView("reservations");
              loadReservations().catch(handleError);
            }}
          >
            Mis reservas <span>{upcoming.length}</span>
          </button>
        </nav>
        <div className="dashboard__identity">
          <span className="dashboard__avatar" title={user.name}>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </span>
          <button className="dashboard__logout" onClick={logout}>
            Salir ↗
          </button>
        </div>
      </header>
      <div className="dashboard__content">
        <section className="dashboard__hero">
          <img src="/images/club-02.webp" alt="" />
          <div className="dashboard__hero-copy">
            <SectionLabel light>
              BIENVENIDO A TU CLUB, {user.firstName.toUpperCase()}
            </SectionLabel>
            <h1>
              {view === "book" ? (
                <>
                  TU PRÓXIMO
                  <br />
                  <span>GRAN PARTIDO.</span>
                </>
              ) : (
                <>
                  MÁS JUEGO.
                  <br />
                  <span>MÁS HEAT.</span>
                </>
              )}
            </h1>
            <p>
              {view === "book"
                ? "Elige tu cancha. Nosotros ponemos la energía."
                : "Todos tus partidos, en un solo lugar."}
            </p>
          </div>
          <div className="dashboard__hero-stamp">
            PLAY.
            <br />
            CONNECT.
            <br />
            <span>REPEAT.</span>
          </div>
        </section>
        {notice && (
          <div className="dashboard__notice" role="status">
            ✓ {notice}
            <button aria-label="Cerrar mensaje" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        {error && (
          <p className="account-form__error" role="alert">
            {error}
          </p>
        )}
        {view === "book" ? (
          <div className="dashboard__booking-layout">
            <section className="court-picker">
              <div className="dashboard__section-heading">
                <div>
                  <SectionLabel>
                    {editing ? "UN NUEVO PLAN" : "HAZ ESPACIO PARA JUGAR"}
                  </SectionLabel>
                  <h2>
                    {editing ? "CAMBIA TU TURNO." : "ENCUENTRA TU CANCHA."}
                  </h2>
                </div>
                <span className="dashboard__duration">60 MIN / TURNO</span>
              </div>
              {editing && (
                <div className="court-picker__editing">
                  Tu reserva actual se mantiene hasta confirmar el cambio.
                  <button
                    onClick={() => {
                      setEditing(null);
                      setHour(null);
                    }}
                  >
                    Descartar cambio ×
                  </button>
                </div>
              )}
              <div
                className="court-picker__sports"
                role="group"
                aria-label="Deporte"
              >
                {["padel", "pickleball"].map((value) => (
                  <button
                    key={value}
                    aria-pressed={sport === value}
                    className={`court-picker__sport${sport === value ? " court-picker__sport--active" : ""}`}
                    onClick={() => chooseSport(value)}
                  >
                    {value === "padel" ? "Pádel" : "Pickleball"}
                    <span>
                      {value === "padel" ? "05 CANCHAS" : "04 CANCHAS"}
                    </span>
                  </button>
                ))}
              </div>
              <BookingDatePicker
                value={date}
                now={now}
                onChange={(value) => {
                  if (value !== date) {
                    setDate(value);
                    setHour(null);
                    setLoading(true);
                  }
                }}
              />
              <div className="court-picker__step">
                <h3>
                  <span>02</span> Tu cancha
                </h3>
                <div
                  className="court-picker__courts"
                  role="group"
                  aria-label="Cancha"
                >
                  {COURTS.filter((c) => c.sport === sport).map((c) => (
                    <button
                      key={c.id}
                      aria-pressed={courtId === c.id}
                      className={`court-picker__court${courtId === c.id ? " court-picker__court--active" : ""}`}
                      onClick={() => {
                        setCourtId(c.id);
                        setHour(null);
                      }}
                    >
                      <span
                        className="court-picker__court-icon"
                        aria-hidden="true"
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="court-picker__step">
                <div className="court-picker__time-heading">
                  <h3>
                    <span>03</span> ¿A qué hora jugamos?
                  </h3>
                  <p>Hora de Playa del Carmen</p>
                </div>
                <div className="court-picker__legend">
                  <span>● Disponible</span>
                  <span>▧ No disponible</span>
                </div>
                {loading ? (
                  <p className="court-picker__status" role="status">
                    Consultando disponibilidad…
                  </p>
                ) : availabilityError ? (
                  <div className="account-form__error" role="alert">
                    {availabilityError}
                    <button
                      className="dashboard__text-button"
                      onClick={() => loadAvailability()}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div
                    className="court-picker__hours"
                    role="group"
                    aria-label="Horario"
                  >
                    {HOURS.map((h) => (
                      <button
                        key={h}
                        disabled={isBlocked(h)}
                        aria-pressed={hour === h}
                        aria-label={`${formatHour(h)}${isBlocked(h) ? ", no disponible" : ""}`}
                        className={`court-picker__hour${hour === h ? " court-picker__hour--selected" : ""}`}
                        onClick={() => setHour(h)}
                      >
                        {formatHour(h)}
                        <span>
                          {isBlocked(h) ? "No disponible" : "Disponible"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
            <aside className="booking-summary">
              <div className="booking-summary__image">
                <img
                  src={
                    sport === "padel"
                      ? "/images/club-02.webp"
                      : "/images/club-01.webp"
                  }
                  alt={`Cancha de ${sport === "padel" ? "pádel" : "pickleball"} en HEAT`}
                />
                <span>
                  SEE YOU
                  <br />
                  ON COURT.
                </span>
              </div>
              <div className="booking-summary__body">
                <SectionLabel>TU PRÓXIMA JUGADA</SectionLabel>
                <h2>{court.name.toUpperCase()}</h2>
                <dl>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{formatDate(date)}</dd>
                  </div>
                  <div>
                    <dt>Horario</dt>
                    <dd>
                      {hour !== null
                        ? `${formatHour(hour)} — ${formatHour(hour + 1)}`
                        : "Elige tu turno"}
                    </dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd>1 hora</dd>
                  </div>
                </dl>
                <Button
                  className="booking-summary__confirm"
                  disabled={!ready || busy}
                  onClick={() =>
                    openAction({
                      type: "book",
                      title: editing
                        ? "¿CAMBIAMOS EL PLAN?"
                        : "¿NOS VEMOS EN LA CANCHA?",
                      description: `${court.name} · ${formatDate(date)} · ${formatHour(hour)} a ${formatHour(hour + 1)}. Hora de Playa del Carmen.`,
                      label: editing ? "Confirmar cambio" : "Confirmar reserva",
                    })
                  }
                >
                  {editing ? "Confirmar cambio" : "Reservar mi cancha"}
                  <Arrow />
                </Button>
                <p className="booking-summary__policy">
                  Cambios y cancelaciones hasta <strong>24 horas antes</strong>{" "}
                  del inicio. Si reservas con menos anticipación, el turno ya no
                  admite cambios.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <section className="my-reservations">
            <div className="dashboard__section-heading">
              <div>
                <SectionLabel>TU AGENDA CON MÁS ENERGÍA</SectionLabel>
                <h2>MIS RESERVAS.</h2>
              </div>
              <Button
                onClick={() => {
                  setEditing(null);
                  setHour(null);
                  setView("book");
                }}
              >
                Nueva reserva <Arrow diagonal />
              </Button>
            </div>
            <div
              className="my-reservations__tabs"
              role="group"
              aria-label="Filtrar reservas"
            >
              <button aria-pressed={!history} onClick={() => setHistory(false)}>
                Próximas <span>{upcoming.length}</span>
              </button>
              <button aria-pressed={history} onClick={() => setHistory(true)}>
                Historial <span>{past.length}</span>
              </button>
            </div>
            <div className="my-reservations__list">
              {(history ? past : upcoming).map((r) => (
                <article className="reservation-card" key={r.id}>
                  <div className="reservation-card__visual">
                    <img
                      src={
                        r.courtId.startsWith("padel")
                          ? "/images/club-02.webp"
                          : "/images/club-01.webp"
                      }
                      alt=""
                    />
                    <span>
                      {String(r.hour).padStart(2, "0")}
                      <small>:00</small>
                    </span>
                  </div>
                  <div className="reservation-card__details">
                    <span
                      className={`reservation-card__badge${r.status === "cancelled" ? " reservation-card__badge--cancelled" : ""}`}
                    >
                      {r.status === "cancelled"
                        ? "Cancelada"
                        : r.startsAt <= now
                          ? "Finalizada"
                          : "Confirmada"}
                    </span>
                    <h3>
                      {COURTS.find(
                        (c) => c.id === r.courtId,
                      ).name.toUpperCase()}
                    </h3>
                    <p>
                      {formatDate(r.date)} · {formatHour(r.hour)} —{" "}
                      {formatHour(r.hour + 1)}
                    </p>
                    <small>Playa del Carmen · 1 hora</small>
                  </div>
                  <div className="reservation-card__actions">
                    {canChange(r, now) ? (
                      <>
                        <button onClick={() => startEdit(r)}>
                          Cambiar turno ↗
                        </button>
                        <button
                          onClick={() =>
                            openAction({
                              type: "cancel",
                              reservation: r,
                              title: "¿CANCELAMOS ESTE PARTIDO?",
                              description: `${COURTS.find((c) => c.id === r.courtId).name} · ${formatDate(r.date)} · ${formatHour(r.hour)}. Al cancelar, la cancha quedará libre para otros jugadores.`,
                              label: "Sí, cancelar reserva",
                            })
                          }
                        >
                          Cancelar reserva
                        </button>
                      </>
                    ) : r.status === "confirmed" && r.startsAt > now ? (
                      <p>
                        Cambios cerrados
                        <br />
                        <span>Faltan menos de 24 horas</span>
                      </p>
                    ) : (
                      <span>Nos vemos en el próximo.</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {(history ? past : upcoming).length === 0 && (
              <div className="my-reservations__empty">
                <span>LET’S PLAY.</span>
                <h3>
                  {history
                    ? "Aquí quedarán tus partidos."
                    : "Tu próximo partido está por escribirse."}
                </h3>
                <p>
                  {history
                    ? "Encuentra aquí tus reservas finalizadas y canceladas."
                    : "Elige una cancha y dale un buen plan a tu semana."}
                </p>
                <Button variant="dark" onClick={() => setView("book")}>
                  Encontrar mi cancha <Arrow />
                </Button>
              </div>
            )}
          </section>
        )}
        <footer className="dashboard__footer">
          <p>HEAT PÁDEL & PICKLEBALL</p>
          <span>Tu juego. Tu ritmo. Tu lugar.</span>
          <a href="/">Volver al club ↗</a>
        </footer>
      </div>
      <ConfirmDialog
        action={action}
        busy={busy}
        error={dialogError}
        onConfirm={confirm}
        onClose={() => {
          if (!busy) setAction(null);
        }}
      />
    </main>
  );
}
