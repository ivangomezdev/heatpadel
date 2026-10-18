"use client";

import { useState } from "react";
import { club } from "../data/club";
import { rankings } from "../data/rankings";
import { Arrow, Button, SectionLabel } from "./ui";
import "./Rankings.css";

function Crown() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 6 4.5 4L12 4l4.5 6L21 6l-2 11H5L3 6Zm3 14h12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayerAvatar({ name, champion = false }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className={`rankings__avatar${champion ? " rankings__avatar--champion" : ""}`}
      aria-hidden="true"
    >
      {champion && (
        <span className="rankings__crown">
          <Crown />
        </span>
      )}
      {initials}
    </span>
  );
}

function Podium({ players }) {
  return (
    <ol className="rankings__podium" aria-label="Los tres mejores jugadores">
      {players.map((player, index) => (
        <li
          key={player.id}
          className={`rankings__podium-place rankings__podium-place--${index + 1}`}
        >
          <span className="rankings__place-label">
            {index === 0
              ? "LÍDER"
              : `${String(index + 1).padStart(2, "0")} · TOP 3`}
          </span>
          <PlayerAvatar name={player.name} champion={index === 0} />
          <h4 className="rankings__podium-name">{player.name}</h4>
          <p className="rankings__podium-score">
            {player.points.toLocaleString("es-MX")} <span>PTS</span>
          </p>
          <span className="rankings__podium-number" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Leaderboard({ sport, competitionUrl }) {
  const players = [...sport.players].sort((a, b) => b.points - a.points);
  return (
    <div className="rankings__board" aria-live="polite" aria-atomic="true">
      <div className="rankings__board-heading">
        <div>
          <span className="rankings__eyebrow">
            EL CLUB TIENE A SUS PROTAGONISTAS
          </span>
          <h3>
            Ranking semanal <span>· {sport.label}</span>
          </h3>
        </div>
        <span className="rankings__top-label">
          TOP {String(players.length).padStart(2, "0")}
        </span>
      </div>
      {players.length > 0 ? (
        <>
          <Podium players={players.slice(0, 3)} />
          {players.length > 3 && (
            <table className="rankings__table">
              <caption className="rankings__sr-only">
                Más posiciones del ranking semanal de {sport.label}
              </caption>
              <thead>
                <tr>
                  <th scope="col">POS.</th>
                  <th scope="col">JUGADOR</th>
                  <th scope="col">PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {players.slice(3).map((player, index) => (
                  <tr key={player.id}>
                    <td>
                      <span className="rankings__row-position">
                        {String(index + 4).padStart(2, "0")}
                      </span>
                    </td>
                    <th scope="row">
                      <span className="rankings__row-player">
                        <PlayerAvatar name={player.name} />
                        <span>{player.name}</span>
                      </span>
                    </th>
                    <td>
                      <strong>{player.points.toLocaleString("es-MX")}</strong>
                      <span className="rankings__points-unit"> PTS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <a
            className="rankings__invitation"
            href={competitionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="rankings__invitation-icon" aria-hidden="true">
              ?
            </span>
            <p>
              <strong>TU NOMBRE AQUÍ.</strong>
              <span>El próximo lugar se gana en la cancha.</span>
            </p>
            <Arrow diagonal />
          </a>
        </>
      ) : (
        <p className="rankings__empty">
          La primera posición está por escribirse. La clasificación de{" "}
          {sport.label.toLowerCase()} estará disponible próximamente.
        </p>
      )}
    </div>
  );
}

export default function Rankings() {
  const [selectedSport, setSelectedSport] = useState(rankings[0].id);
  const selected = rankings.find((sport) => sport.id === selectedSport);
  const competitionUrl = `${club.whatsapp}?text=${encodeURIComponent(`Hola HEAT, quiero información sobre las ligas y el ranking de ${selected.label.toLowerCase()}.`)}`;
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
        <div className="rankings__visual-footer">
          <span>NO SOLO JUEGUES.</span>
          <strong>DEJA TU HUELLA.</strong>
          <span>PASIÓN. CONSTANCIA. HEAT.</span>
        </div>
      </div>
      <div className="rankings__content">
        <SectionLabel light>RANKINGS · HEAT CLUB</SectionLabel>
        <h2 className="rankings__title" id="rankings-title">
          TU NOMBRE.
          <br />
          <span>EN LO MÁS ALTO.</span>
        </h2>
        <p className="rankings__intro">
          Cada partido cuenta. Cada punto te acerca al top.
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
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <Leaderboard sport={selected} competitionUrl={competitionUrl} />
        <div className="rankings__actions">
          <p>
            ¿LISTO PARA SUBIR?<span>Tu próximo reto empieza en HEAT.</span>
          </p>
          <Button className="rankings__cta" href={competitionUrl} external>
            Quiero competir <Arrow diagonal />
          </Button>
        </div>
        {selected.isDemo && (
          <p className="rankings__demo-note">
            Vista previa con jugadores y puntos ficticios.
          </p>
        )}
      </div>
    </section>
  );
}
