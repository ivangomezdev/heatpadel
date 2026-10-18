"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui";

export default function AmericanoMatch({
  match,
  players,
  result,
  target,
  editable,
  busy,
  onSave,
  userId,
}) {
  const [a, setA] = useState(result?.a ?? ""),
    [b, setB] = useState(result?.b ?? "");
  useEffect(() => {
    setA(result?.a ?? "");
    setB(result?.b ?? "");
  }, [result?.a, result?.b]);
  function update(side, value) {
    if (value === "") {
      setA("");
      setB("");
      return;
    }
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > target) return;
    setA(side === "a" ? number : target - number);
    setB(side === "b" ? number : target - number);
  }
  const changed = a !== "" && (a !== result?.a || b !== result?.b);
  const names = (team) =>
    team.map((id) => {
      const p = players.find((player) => player.id === id);
      return (
        <span key={id}>
          {p.name}
          {p.userId === userId && <small>TÚ</small>}
        </span>
      );
    });
  return (
    <form
      className={`americano-match${result ? " americano-match--saved" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(match.id, a, b);
      }}
    >
      <div className="americano-match__heading">
        <span>CANCHA DE JUEGO {String(match.court).padStart(2, "0")}</span>
        <small>{result ? "✓ Guardado" : "Por jugar"}</small>
      </div>
      <div className="americano-match__teams">
        <div>{names(match.teamA)}</div>
        <span>VS</span>
        <div>{names(match.teamB)}</div>
      </div>
      <div className="americano-match__score">
        <label>
          Pareja A
          <input
            aria-label={`Puntos pareja A ${match.id}`}
            type="number"
            inputMode="numeric"
            min="0"
            max={target}
            step="1"
            required
            value={a}
            disabled={!editable || busy}
            onChange={(e) => update("a", e.target.value)}
          />
        </label>
        <span>—</span>
        <label>
          Pareja B
          <input
            aria-label={`Puntos pareja B ${match.id}`}
            type="number"
            inputMode="numeric"
            min="0"
            max={target}
            step="1"
            required
            value={b}
            disabled={!editable || busy}
            onChange={(e) => update("b", e.target.value)}
          />
        </label>
      </div>
      {editable && (
        <Button type="submit" disabled={busy || !changed} variant="dark">
          {busy
            ? "Guardando…"
            : result
              ? "Actualizar resultado"
              : "Guardar resultado"}
        </Button>
      )}
    </form>
  );
}
