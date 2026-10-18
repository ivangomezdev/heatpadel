"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Button, Arrow, SectionLabel } from "../ui";
import AmericanoSetup from "./AmericanoSetup";
import AmericanoMatch from "./AmericanoMatch";
import ConfirmDialog from "./ConfirmDialog";

export default function Americanos({ user, onRanking }) {
  const [items, setItems] = useState([]),
    [tournament, setTournament] = useState(null),
    [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [roundIndex, setRoundIndex] = useState(0),
    [finishing, setFinishing] = useState(false);
  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/tournaments");
      setItems(data.tournaments);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadList();
  }, []);
  async function open(id) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const data = await api(`/api/tournaments/${id}`);
      setTournament(data.tournament);
      setCreating(false);
      const next = data.tournament.rounds.findIndex((r) =>
        r.matches.some((m) => !data.tournament.results[m.id]),
      );
      setRoundIndex(Math.max(0, next));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function create(payload) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await open(result.id);
    } catch (e) {
      setError(e.message);
      window.scrollTo({ top: 320, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }
  async function save(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...action, version: tournament.version }),
      });
      setTournament(result.tournament);
      setNotice(
        action.action === "finish"
          ? "¡Torneo finalizado! Los puntos de las cuentas vinculadas ya están en el ranking semanal."
          : "Resultado guardado. Clasificación actualizada.",
      );
      setFinishing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function back() {
    setTournament(null);
    setCreating(false);
    setNotice("");
    loadList();
  }
  const matches = tournament?.rounds.flatMap((r) => r.matches) || [];
  const completed = matches.filter((m) => tournament.results[m.id]).length;
  const round = tournament?.rounds[roundIndex];
  return (
    <section className="americanos" aria-label="Torneos americanos">
      {error && (
        <div className="account-form__error" role="alert">
          {error}
          {tournament && !finishing && (
            <button
              className="dashboard__text-button"
              onClick={() => open(tournament.id)}
            >
              Recargar torneo
            </button>
          )}
          {!tournament && !creating && (
            <button className="dashboard__text-button" onClick={loadList}>
              Reintentar
            </button>
          )}
        </div>
      )}
      {notice && (
        <p className="dashboard__notice" role="status">
          ✓ {notice}
        </p>
      )}
      {creating ? (
        <AmericanoSetup
          user={user}
          busy={busy}
          onCreate={create}
          onBack={back}
        />
      ) : tournament ? (
        <>
          <div className="dashboard__section-heading">
            <div>
              <SectionLabel>
                {tournament.status === "finished"
                  ? "UN TORNEO PARA RECORDAR"
                  : "QUE NO PARE EL JUEGO"}
              </SectionLabel>
              <h2>{tournament.name}</h2>
            </div>
            <button className="dashboard__text-button" onClick={back}>
              ← Mis torneos
            </button>
          </div>
          <div className="americanos__stats">
            <span>
              <strong>{tournament.players.length}</strong> JUGADORES
            </span>
            <span>
              <strong>{tournament.pointsPerMatch}</strong> PTS / PARTIDO
            </span>
            <span>
              <strong>
                {completed}/{matches.length}
              </strong>{" "}
              RESULTADOS
            </span>
            <span className="americanos__status">
              {tournament.status === "finished" ? "FINALIZADO" : "EN JUEGO"}
            </span>
          </div>
          <div className="americanos__layout">
            <div className="americanos__rounds">
              <div className="americanos__round-heading">
                <h3>LAS RONDAS.</h3>
                <label>
                  Ver ronda
                  <select
                    value={roundIndex}
                    onChange={(e) => setRoundIndex(Number(e.target.value))}
                  >
                    {tournament.rounds.map((r, i) => (
                      <option key={r.number} value={i}>
                        Ronda {r.number} de {tournament.rounds.length}
                        {r.matches.every((m) => tournament.results[m.id])
                          ? " · Completa"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="americanos__round-nav">
                <button
                  disabled={roundIndex === 0}
                  onClick={() => setRoundIndex(roundIndex - 1)}
                >
                  ← Anterior
                </button>
                <span>RONDA {round.number}</span>
                <button
                  disabled={roundIndex === tournament.rounds.length - 1}
                  onClick={() => setRoundIndex(roundIndex + 1)}
                >
                  Siguiente →
                </button>
              </div>
              {round.resting.length > 0 && (
                <p className="americanos__resting">
                  <strong>Descansan esta tanda:</strong>{" "}
                  {round.resting
                    .map(
                      (id) => tournament.players.find((p) => p.id === id).name,
                    )
                    .join(", ")}
                </p>
              )}
              {round.matches.map((match) => (
                <AmericanoMatch
                  key={match.id}
                  match={match}
                  players={tournament.players}
                  result={tournament.results[match.id]}
                  target={tournament.pointsPerMatch}
                  editable={tournament.canEdit}
                  busy={busy}
                  userId={user.id}
                  onSave={(matchId, a, b) =>
                    save({ action: "score", matchId, a, b })
                  }
                />
              ))}
              {!tournament.canEdit && tournament.status === "active" && (
                <p className="americanos__help">
                  El organizador guarda los resultados.{" "}
                  <button
                    className="dashboard__text-button"
                    onClick={() => open(tournament.id)}
                  >
                    Actualizar clasificación
                  </button>
                </p>
              )}
            </div>
            <aside className="tournament-ranking">
              <SectionLabel light>CADA PUNTO CUENTA</SectionLabel>
              <h3>ASÍ VA EL TORNEO.</h3>
              <div className="tournament-ranking__table-wrap">
                <table>
                  <caption className="rankings__sr-only">
                    Clasificación del torneo
                  </caption>
                  <thead>
                    <tr>
                      <th>P.</th>
                      <th>JUGADOR</th>
                      <th>PJ</th>
                      <th>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.standings.map((p) => (
                      <tr
                        key={p.id}
                        className={
                          p.userId === user.id
                            ? "tournament-ranking__row--you"
                            : ""
                        }
                      >
                        <td>{p.position}</td>
                        <th scope="row">
                          {p.name}
                          {p.userId === user.id && (
                            <span className="rankings__you">TÚ</span>
                          )}
                          <small>
                            {p.userId
                              ? `${p.wins} victorias`
                              : "Invitado · solo torneo"}
                          </small>
                        </th>
                        <td>{p.played}</td>
                        <td>{p.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Orden: puntos, victorias y diferencia de puntos. Un empate
                completo comparte puesto.
              </p>
              <p>
                {tournament.status === "finished"
                  ? "Las cuentas vinculadas ya sumaron sus puntos al ranking semanal."
                  : "Los puntos de las cuentas vinculadas se suman al ranking semanal cuando el organizador finaliza el torneo."}
              </p>
              {tournament.canEdit && (
                <Button
                  disabled={completed !== matches.length || busy}
                  onClick={() => {
                    setError("");
                    setFinishing(true);
                  }}
                >
                  Finalizar y sumar puntos <Arrow />
                </Button>
              )}
              {tournament.status === "finished" && (
                <Button onClick={onRanking}>
                  Ver mi ranking semanal <Arrow />
                </Button>
              )}
            </aside>
          </div>
        </>
      ) : (
        <>
          <div className="dashboard__section-heading">
            <div>
              <SectionLabel>CAMBIAN LAS PAREJAS. SUBE LA ENERGÍA.</SectionLabel>
              <h2>MIS AMERICANOS.</h2>
            </div>
            <Button
              onClick={() => {
                setCreating(true);
                setError("");
              }}
            >
              Crear americano <Arrow diagonal />
            </Button>
          </div>
          {loading ? (
            <p role="status">Cargando tus torneos…</p>
          ) : items.length ? (
            <div className="americanos__list">
              {items.map((item) => (
                <button
                  className="americano-card"
                  key={item.id}
                  onClick={() => open(item.id)}
                >
                  <img
                    src={
                      item.sport === "padel"
                        ? "/images/club-02.webp"
                        : "/images/club-01.webp"
                    }
                    alt=""
                  />
                  <div>
                    <span>
                      {item.status === "finished" ? "FINALIZADO" : "EN JUEGO"} ·{" "}
                      {item.sport === "padel" ? "PÁDEL" : "PICKLEBALL"}
                    </span>
                    <h3>{item.name}</h3>
                    <p>
                      {item.playerCount} jugadores ·{" "}
                      {item.ownerId === user.id ? "Tú organizas" : "Participas"}
                    </p>
                    <strong>
                      {item.status === "finished"
                        ? "Ver resultados"
                        : "Entrar al torneo"}{" "}
                      ↗
                    </strong>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="americanos__empty">
              <div>
                <SectionLabel light>
                  TODOS CONTRA TODOS. TODOS CON TODOS.
                </SectionLabel>
                <h3>
                  LA MEJOR EXCUSA
                  <br />
                  PARA JUGAR MÁS.
                </h3>
                <p>
                  Crea tu grupo, rota las parejas y lleva cada resultado en
                  HEAT. Nosotros preparamos las rondas.
                </p>
                <Button onClick={() => setCreating(true)}>
                  Organizar mi primer americano <Arrow />
                </Button>
              </div>
              <img src="/images/player-academy.webp" alt="" />
            </div>
          )}
          <p className="americanos__help">
            Puedes organizar grupos de 4, 8, 12, 16 o 20 jugadores. Los torneos
            guardados permanecen en tu cuenta y las cuentas vinculadas pueden
            consultar sus resultados. Organizar un torneo no reserva canchas.
          </p>
        </>
      )}
      <ConfirmDialog
        action={
          finishing
            ? {
                title: "¿CERRAMOS ESTE GRAN TORNEO?",
                description:
                  "Se guardará la clasificación definitiva y los jugadores con cuenta vinculada sumarán sus puntos a la semana actual. Después de finalizar ya no se pueden editar los resultados.",
                label: "Finalizar y publicar puntos",
              }
            : null
        }
        busy={busy}
        error={error}
        onConfirm={() => save({ action: "finish" })}
        onClose={() => {
          if (!busy) setFinishing(false);
        }}
      />
    </section>
  );
}
