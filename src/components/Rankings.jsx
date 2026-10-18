"use client";

import { useState } from "react";
import { club } from "../data/club";
import { rankings } from "../data/rankings";
import { Arrow, Button, SectionLabel } from "./ui";
import "./Rankings.css";

export default function Rankings() {
  const [selectedSport, setSelectedSport] = useState(rankings[0].id);
  const selected = rankings.find((sport) => sport.id === selectedSport);
  const hasResults = selected.players.length > 0;

  return (
    <section
      className="rankings"
      id="rankings"
      aria-labelledby="rankings-title"
    >
      <div className="rankings__visual" aria-hidden="true">
        <img
          className="rankings__court"
          src="/images/club-wide.webp"
          alt=""
          loading="lazy"
        />
        <div className="rankings__shade" />
        <div className="rankings__frame" />
        <span className="rankings__visual-label">
          EL SIGUIENTE NIVEL ES TUYO
        </span>
        <span className="rankings__backdrop-type">
          NEXT
          <br />
          LEVEL.
        </span>
        <img
          className="rankings__player"
          src="/images/player-rankings.webp"
          alt=""
          loading="lazy"
          width="800"
          height="1200"
        />
        <span className="rankings__visual-footer">
          PASIÓN. CONSTANCIA. HEAT.
        </span>
      </div>

      <div className="rankings__content">
        <SectionLabel light>CADA PARTIDO CUENTA</SectionLabel>
        <h2 className="rankings__title" id="rankings-title">
          <span>RANKINGS</span>
          <br />
          DE MEJORES
          <br />
          JUGADORES.
        </h2>
        <p className="rankings__intro">
          El esfuerzo se entrena. El lugar se gana.
          <br />
          Tu próximo reto empieza en la cancha.
        </p>

        <div
          className="rankings__switch"
          role="group"
          aria-label="Deporte del ranking"
        >
          {rankings.map((sport) => (
            <button
              key={sport.id}
              type="button"
              className={`rankings__sport${sport.id === selectedSport ? " rankings__sport--active" : ""}`}
              aria-pressed={sport.id === selectedSport}
              onClick={() => setSelectedSport(sport.id)}
            >
              {sport.label}
            </button>
          ))}
        </div>

        <div className="rankings__board" aria-live="polite" aria-atomic="true">
          <div className="rankings__board-heading">
            <h3>Ranking semanal · {selected.label}</h3>
            {(selected.isDemo || !hasResults) && (
              <span className="rankings__status">
                {selected.isDemo ? "Ejemplo" : "Próximamente"}
              </span>
            )}
          </div>
          {hasResults ? (
            <table className="rankings__table">
              <caption className="rankings__caption">
                {selected.isDemo
                  ? "Semana de ejemplo · Jugadores y puntos ficticios"
                  : `Mejores jugadores de ${selected.label}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pos.</th>
                  <th scope="col">Jugador</th>
                  <th scope="col">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {selected.players.map((player, index) => (
                  <tr key={player.id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <th scope="row">{player.name}</th>
                    <td>{player.points.toLocaleString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rankings__empty">
              <svg
                width="29"
                height="29"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 25V16h7m0 9V8h8v17m0-6h7v6M3 26h26"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>
                Aquí conocerás a quienes marcan el ritmo.
                <span>
                  La clasificación oficial de {selected.label.toLowerCase()}{" "}
                  estará disponible próximamente.
                </span>
              </p>
            </div>
          )}
        </div>

        <Button
          className="rankings__cta"
          href={`${club.whatsapp}?text=${encodeURIComponent(`Hola HEAT, quiero información sobre las ligas y el ranking de ${selected.label.toLowerCase()}.`)}`}
          external
        >
          Quiero competir <Arrow diagonal />
        </Button>
      </div>
    </section>
  );
}
