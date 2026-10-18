import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateRounds,
  tournamentStandings,
  weekStart,
  PLAYER_COUNTS,
} from "../src/lib/americano.js";

for (const count of PLAYER_COUNTS)
  test(`${count} jugadores: cada pareja una vez, descanso equilibrado y sin choques de cancha`, () => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: String(i),
      name: `Jugador ${i}`,
    }));
    for (let courts = 1; courts <= Math.min(5, count / 4); courts++) {
      const rounds = generateRounds(players, courts);
      const partners = new Set(),
        played = new Map(players.map((p) => [p.id, 0]));
      const matchIds = new Set();
      for (const round of rounds) {
        assert.ok(round.matches.length <= courts);
        const active = round.matches.flatMap((m) => [...m.teamA, ...m.teamB]);
        assert.equal(new Set(active).size, active.length);
        assert.equal(new Set([...active, ...round.resting]).size, count);
        assert.equal(active.length + round.resting.length, count);
        assert.equal(
          new Set(round.matches.map((m) => m.court)).size,
          round.matches.length,
        );
        for (const match of round.matches) {
          assert.ok(!matchIds.has(match.id));
          matchIds.add(match.id);
          for (const team of [match.teamA, match.teamB]) {
            const key = [...team].sort().join("-");
            assert.ok(!partners.has(key));
            partners.add(key);
            team.forEach((id) => played.set(id, played.get(id) + 1));
          }
        }
      }
      assert.equal(partners.size, (count * (count - 1)) / 2);
      assert.ok([...played.values()].every((n) => n === count - 1));
    }
  });
test("puntos de pareja, empates y cambios de marcador sin acumulación duplicada", () => {
  const players = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    name: `Jugador ${i}`,
  }));
  const rounds = generateRounds(players, 1);
  const results = Object.fromEntries(
    rounds.flatMap((r) => r.matches).map((m) => [m.id, { a: 12, b: 12 }]),
  );
  const standings = tournamentStandings(players, rounds, results);
  assert.ok(
    standings.every(
      (p) =>
        p.position === 1 && p.points === 36 && p.played === 3 && p.wins === 0,
    ),
  );
  results[rounds[0].matches[0].id] = { a: 24, b: 0 };
  const updated = tournamentStandings(players, rounds, results);
  assert.deepEqual(
    updated.map((p) => p.position),
    [1, 1, 3, 3],
  );
  assert.equal(
    updated.reduce((sum, p) => sum + p.points, 0),
    144,
  );
});
test("semana del club cambia el lunes a medianoche de Cancún", () => {
  assert.equal(weekStart(Date.parse("2026-10-19T04:59:59Z")), "2026-10-12");
  assert.equal(weekStart(Date.parse("2026-10-19T05:00:00Z")), "2026-10-19");
  assert.throws(() => generateRounds([1, 2, 3], 1));
});
