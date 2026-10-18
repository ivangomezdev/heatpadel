"use client";
import { useState } from "react";
import { PLAYER_COUNTS, POINT_TARGETS } from "../../lib/americano";
import { Button, Arrow, SectionLabel } from "../ui";

export default function AmericanoSetup({ user, busy, onCreate, onBack }) {
  const [players, setPlayers] = useState([
    { name: user.name, email: user.email },
    ...Array.from({ length: 3 }, () => ({ name: "", email: "" })),
  ]);
  const [sport, setSport] = useState("padel"),
    [courts, setCourts] = useState(1);
  function resize(count) {
    setPlayers(
      Array.from(
        { length: count },
        (_, i) => players[i] || { name: "", email: "" },
      ),
    );
    setCourts(Math.min(courts, count / 4));
  }
  function update(index, field, value) {
    setPlayers(
      players.map((player, i) =>
        i === index ? { ...player, [field]: value } : player,
      ),
    );
  }
  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    onCreate({
      name: fields.get("name"),
      sport,
      courtCount: courts,
      pointsPerMatch: Number(fields.get("points")),
      players,
    });
  }
  return (
    <form className="americano-setup" onSubmit={submit}>
      <div className="dashboard__section-heading">
        <div>
          <SectionLabel>ARMA TU PRÓXIMO RETO</SectionLabel>
          <h2>UN GRUPO. MIL BUENOS PUNTOS.</h2>
        </div>
        <button
          type="button"
          className="dashboard__text-button"
          onClick={onBack}
        >
          ← Mis torneos
        </button>
      </div>
      <div className="americano-setup__config">
        <label className="account-form__field">
          Nombre del torneo
          <input
            name="name"
            required
            maxLength="80"
            placeholder="Americano de los viernes"
          />
        </label>
        <label className="account-form__field">
          Deporte
          <select
            value={sport}
            onChange={(e) => {
              setSport(e.target.value);
              setCourts(Math.min(courts, e.target.value === "padel" ? 5 : 4));
            }}
          >
            <option value="padel">Pádel</option>
            <option value="pickleball">Pickleball</option>
          </select>
        </label>
        <label className="account-form__field">
          Jugadores
          <select
            value={players.length}
            onChange={(e) => resize(Number(e.target.value))}
          >
            {PLAYER_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} jugadores
              </option>
            ))}
          </select>
        </label>
        <label className="account-form__field">
          Canchas simultáneas
          <select
            value={courts}
            onChange={(e) => setCourts(Number(e.target.value))}
          >
            {Array.from(
              {
                length: Math.min(players.length / 4, sport === "padel" ? 5 : 4),
              },
              (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} {i ? "canchas" : "cancha"}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="account-form__field">
          Puntos totales por partido
          <select name="points" defaultValue="24">
            {POINT_TARGETS.map((n) => (
              <option key={n} value={n}>
                {n} puntos
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="americano-setup__explanation">
        <strong>Juega con todos. Suma los puntos de tu pareja.</strong>
        <p>
          Las parejas cambian en cada rotación. Los dos marcadores suman el
          total elegido (por ejemplo, 15–9 en un partido de 24 puntos). Las
          tandas distribuyen los encuentros entre las canchas disponibles.
        </p>
      </div>
      <div className="americano-setup__players">
        <h3>¿QUIÉNES ENTRAN A LA CANCHA?</h3>
        <p>
          Añade el email de su cuenta HEAT para sumar al ranking semanal. Sin
          email, jugará como invitado y sus puntos quedarán solo en este torneo.
          Los nombres de las cuentas se verifican al crear.
        </p>
        {players.map((player, index) => (
          <div className="americano-setup__player" key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <label className="account-form__field">
              Jugador {index + 1}
              <input
                aria-label={`Nombre del jugador ${index + 1}`}
                required={!player.email.trim()}
                maxLength="80"
                value={player.name}
                onChange={(e) => update(index, "name", e.target.value)}
                placeholder="Nombre y apellido"
              />
            </label>
            <label className="account-form__field">
              Email de cuenta (opcional)
              <input
                aria-label={`Email del jugador ${index + 1}`}
                type="email"
                maxLength="254"
                value={player.email}
                onChange={(e) => update(index, "email", e.target.value)}
                placeholder="Invitado si lo dejas vacío"
              />
            </label>
          </div>
        ))}
      </div>
      <div className="americano-setup__bottom">
        <p>
          Se generarán {players.length - 1} partidos por jugador. Crear el
          torneo no bloquea horarios: reserva las canchas desde «Reservar
          cancha».
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? "Preparando las rondas…" : "Crear torneo y generar rondas"}
          <Arrow />
        </Button>
      </div>
    </form>
  );
}
