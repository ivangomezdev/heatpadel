import { clubToday } from "./booking.js";

export const PLAYER_COUNTS = [4, 8, 12, 16, 20];
export const POINT_TARGETS = [16, 24, 32, 40];
export function weekStart(now = Date.now()) {
  const date = new Date(`${clubToday(new Date(now))}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

// Circle rotation: every player partners with every other exactly once.
// Split a rotation into waves when fewer courts are available; no court is booked here.
export function generateRounds(players, courtCount) {
  if (
    !PLAYER_COUNTS.includes(players.length) ||
    !Number.isInteger(courtCount) ||
    courtCount < 1 ||
    courtCount > players.length / 4
  )
    throw new Error("Configuración de torneo inválida.");
  const rotation = players.map((p) => p.id);
  const rounds = [];
  const encounters = new Map();
  const key = (a, b) => [a, b].sort().join("|");
  for (let cycle = 0; cycle < players.length - 1; cycle++) {
    const pairs = Array.from({ length: players.length / 2 }, (_, i) => [
      rotation[i],
      rotation[rotation.length - 1 - i],
    ]);
    const matches = [];
    while (pairs.length) {
      const teamA = pairs.shift();
      let best = 0,
        cost = Infinity;
      pairs.forEach((team, index) => {
        const score = teamA.reduce(
          (sum, a) =>
            sum +
            team.reduce((s, b) => s + (encounters.get(key(a, b)) || 0), 0),
          0,
        );
        if (score < cost) {
          best = index;
          cost = score;
        }
      });
      const teamB = pairs.splice(best, 1)[0];
      teamA.forEach((a) =>
        teamB.forEach((b) =>
          encounters.set(key(a, b), (encounters.get(key(a, b)) || 0) + 1),
        ),
      );
      matches.push({
        id: `match-${cycle + 1}-${matches.length + 1}`,
        teamA,
        teamB,
      });
    }
    for (let offset = 0; offset < matches.length; offset += courtCount) {
      const wave = matches
        .slice(offset, offset + courtCount)
        .map((match, i) => ({ ...match, court: i + 1 }));
      const playing = new Set(wave.flatMap((m) => [...m.teamA, ...m.teamB]));
      rounds.push({
        number: rounds.length + 1,
        matches: wave,
        resting: players.filter((p) => !playing.has(p.id)).map((p) => p.id),
      });
    }
    rotation.splice(1, 0, rotation.pop());
  }
  return rounds;
}
export function tournamentStandings(players, rounds, results) {
  const entries = new Map(
    players.map((p) => [
      p.id,
      { ...p, points: 0, played: 0, wins: 0, difference: 0 },
    ]),
  );
  for (const match of rounds.flatMap((r) => r.matches)) {
    const result = results[match.id];
    if (!result) continue;
    for (const [team, own, other] of [
      [match.teamA, result.a, result.b],
      [match.teamB, result.b, result.a],
    ]) {
      team.forEach((id) => {
        const p = entries.get(id);
        p.points += own;
        p.played++;
        p.wins += own > other ? 1 : 0;
        p.difference += own - other;
      });
    }
  }
  let previous, position;
  return [...entries.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        b.difference - a.difference ||
        a.name.localeCompare(b.name, "es"),
    )
    .map((p, i) => {
      const tie = `${p.points}/${p.wins}/${p.difference}`;
      if (tie !== previous) position = i + 1;
      previous = tie;
      return { ...p, position };
    });
}
