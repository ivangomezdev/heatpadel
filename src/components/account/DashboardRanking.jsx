"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/booking";
import { Leaderboard } from "../Rankings";
import { Button, Arrow, SectionLabel } from "../ui";

export default function DashboardRanking({ user, onCompete }) {
  const [sport, setSport] = useState("padel"),
    [data, setData] = useState(null),
    [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api(`/api/rankings?sport=${sport}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [sport, refresh]);
  return (
    <section className="member-ranking" aria-labelledby="member-ranking-title">
      <div className="member-ranking__personal">
        <div>
          <SectionLabel>TU HUELLA EN HEAT</SectionLabel>
          <h2 id="member-ranking-title">
            ESTE ES TU LUGAR.
            <br />
            <span>EL SIGUIENTE LO GANAS TÚ.</span>
          </h2>
          <p>
            {data?.me.position
              ? `¡Vas con todo, ${user.firstName}! Cada punto te acerca a la cima.`
              : "Tu próxima historia empieza con el primer partido."}
          </p>
        </div>
        <div className="member-ranking__numbers">
          <div>
            <span>MI POSICIÓN</span>
            <strong>
              {data ? (data.me.position ? `#${data.me.position}` : "—") : "…"}
            </strong>
            <small>
              {data?.me.position
                ? `de ${data.total} ${data.total === 1 ? "jugador" : "jugadores"}`
                : "Sin clasificar aún"}
            </small>
          </div>
          <div>
            <span>MIS PUNTOS</span>
            <strong>{data?.me.points ?? "—"}</strong>
            <small>
              {data?.me.played ?? 0} partidos · {data?.me.wins ?? 0} victorias
            </small>
          </div>
        </div>
      </div>
      <div className="member-ranking__stage">
        <aside className="member-ranking__visual">
          <img
            className="member-ranking__court"
            src="/images/club-wide.webp"
            alt=""
          />
          <p>
            PLAY.
            <br />
            <span>RISE.</span>
            <br />
            REPEAT.
          </p>
          <img
            className="member-ranking__player"
            src="/images/player-rankings.webp"
            alt=""
          />
          <div>
            <span>NO SOLO JUEGUES.</span>
            <strong>DEJA TU HUELLA.</strong>
          </div>
        </aside>
        <div className="member-ranking__board">
          <div
            className="rankings__switch"
            role="group"
            aria-label="Deporte del ranking"
          >
            {["padel", "pickleball"].map((id) => (
              <button
                key={id}
                className={`rankings__sport${sport === id ? " rankings__sport--active" : ""}`}
                aria-pressed={sport === id}
                onClick={() => setSport(id)}
              >
                {id === "padel" ? "Pádel" : "Pickleball"}
                <span>↗</span>
              </button>
            ))}
          </div>
          {error ? (
            <div className="account-form__error" role="alert">
              {error}
              <button
                className="dashboard__text-button"
                onClick={() => setRefresh(refresh + 1)}
              >
                Reintentar
              </button>
            </div>
          ) : !data ? (
            <p role="status">Cargando clasificación…</p>
          ) : (
            <>
              <p className="member-ranking__week">
                SEMANA DEL {formatDate(data.week).toUpperCase()} · PLAYA DEL
                CARMEN
              </p>
              {data.players.length ? (
                <Leaderboard
                  sport={{
                    label: sport === "padel" ? "Pádel" : "Pickleball",
                    players: data.players,
                  }}
                  currentUserId={user.id}
                />
              ) : (
                <div className="member-ranking__empty">
                  <div aria-hidden="true">
                    <span>02</span>
                    <span>01</span>
                    <span>03</span>
                  </div>
                  <h3>
                    EL PRIMER PUESTO
                    <br />
                    TE ESTÁ ESPERANDO.
                  </h3>
                  <p>
                    Aún no hay resultados de torneos finalizados esta semana.
                    Aquí aparecerán los jugadores y sus puntos reales.
                  </p>
                </div>
              )}
              <p className="member-ranking__rules">
                Cada jugador suma los puntos de su pareja en cada partido. Los
                torneos finalizados cuentan en la semana de cierre, de lunes a
                domingo. Desempate por victorias; si persiste, se comparte
                posición.
              </p>
            </>
          )}
          <Button onClick={onCompete} className="member-ranking__compete">
            Jugar un americano <Arrow diagonal />
          </Button>
        </div>
      </div>
    </section>
  );
}
