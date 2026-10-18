import {
  generateRounds,
  tournamentStandings,
  PLAYER_COUNTS,
  POINT_TARGETS,
  weekStart,
} from "../src/lib/americano.js";
const columns =
  "id, owner_id AS ownerId, name, sport, points_per_match AS pointsPerMatch, court_count AS courtCount, players_json AS playersJson, rounds_json AS roundsJson, results_json AS resultsJson, status, version, created_at AS createdAt, completed_at AS completedAt";
const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error, status = 400) => json({ error }, status);
function unpack(row, userId) {
  const { playersJson, roundsJson, resultsJson, ...tournament } = row;
  const players = JSON.parse(playersJson),
    rounds = JSON.parse(roundsJson),
    results = JSON.parse(resultsJson);
  return {
    ...tournament,
    players,
    rounds,
    results,
    canEdit: tournament.ownerId === userId && tournament.status === "active",
    standings: tournamentStandings(players, rounds, results),
  };
}

export async function tournamentApi(request, env, session, bodyOf) {
  const { pathname, searchParams } = new URL(request.url);
  const userId = session.user.id;
  if (pathname === "/api/rankings" && request.method === "GET") {
    const sport = searchParams.get("sport") || "padel";
    if (!["padel", "pickleball"].includes(sport))
      return fail("Deporte inválido.");
    const week = weekStart();
    const cte = `WITH totals AS (
      SELECT u.id, u.name, SUM(CAST(json_extract(p.value,'$.points') AS INTEGER)) AS points,
      SUM(CAST(json_extract(p.value,'$.played') AS INTEGER)) AS played,
      SUM(CAST(json_extract(p.value,'$.wins') AS INTEGER)) AS wins
      FROM tournaments t, json_each(t.standings_json) p JOIN user u ON u.id=json_extract(p.value,'$.userId')
      WHERE t.status='finished' AND t.week_start=? AND t.sport=? GROUP BY u.id
    ), ranked AS (SELECT *, RANK() OVER (ORDER BY points DESC,wins DESC) AS position FROM totals)`;
    const [leaders, personal, total] = await env.DB.batch([
      env.DB.prepare(
        `${cte} SELECT * FROM ranked ORDER BY position,name,id LIMIT 100`,
      ).bind(week, sport),
      env.DB.prepare(`${cte} SELECT * FROM ranked WHERE id=?`).bind(
        week,
        sport,
        userId,
      ),
      env.DB.prepare(`${cte} SELECT COUNT(*) AS count FROM ranked`).bind(
        week,
        sport,
      ),
    ]);
    return json({
      sport,
      week,
      players: leaders.results,
      total: total.results[0].count,
      me: personal.results[0] || {
        id: userId,
        name: session.user.name,
        position: null,
        points: 0,
        played: 0,
        wins: 0,
      },
    });
  }
  if (pathname === "/api/tournaments" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT id,name,sport,status,version,created_at AS createdAt,completed_at AS completedAt,json_array_length(players_json) AS playerCount,owner_id AS ownerId FROM tournaments WHERE owner_id=? OR EXISTS(SELECT 1 FROM json_each(players_json) WHERE json_extract(value,'$.userId')=?) ORDER BY created_at DESC LIMIT 100`,
    )
      .bind(userId, userId)
      .all();
    return json({ tournaments: results });
  }
  if (pathname === "/api/tournaments" && request.method === "POST") {
    const body = await bodyOf(request);
    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 80
    )
      return fail("Dale un nombre al torneo (máximo 80 caracteres).");
    if (
      !["padel", "pickleball"].includes(body.sport) ||
      !POINT_TARGETS.includes(body.pointsPerMatch)
    )
      return fail("Revisa el deporte y los puntos por partido.");
    if (
      !Array.isArray(body.players) ||
      !PLAYER_COUNTS.includes(body.players.length)
    )
      return fail(
        "Añade 4, 8, 12, 16 o 20 jugadores para una rotación completa.",
      );
    const maxCourts = Math.min(
      body.players.length / 4,
      body.sport === "padel" ? 5 : 4,
    );
    if (
      !Number.isInteger(body.courtCount) ||
      body.courtCount < 1 ||
      body.courtCount > maxCourts
    )
      return fail("Elige un número de canchas válido.");
    const players = [];
    for (const [index, player] of body.players.entries()) {
      if (!player || typeof player !== "object")
        return fail("Jugador inválido.");
      let registered = null;
      if (typeof player.email === "string" && player.email.trim()) {
        if (player.email.length > 254) return fail("Email inválido.");
        registered = await env.DB.prepare(
          "SELECT id,name FROM user WHERE email=? COLLATE NOCASE",
        )
          .bind(player.email.trim().toLowerCase())
          .first();
        if (!registered)
          return fail(
            `Jugador ${index + 1}: ese email no tiene una cuenta en HEAT. Regístralo primero o añádelo como invitado.`,
          );
        if (players.some((p) => p.userId === registered.id))
          return fail(
            "Una cuenta no puede jugar dos veces en el mismo torneo.",
          );
      } else if (
        typeof player.name !== "string" ||
        !player.name.trim() ||
        player.name.trim().length > 80
      )
        return fail(`Escribe el nombre del jugador ${index + 1}.`);
      players.push({
        id: crypto.randomUUID(),
        name: registered?.name || player.name.trim(),
        userId: registered?.id || null,
      });
    }
    if (
      new Set(players.map((p) => p.name.toLocaleLowerCase("es").trim()))
        .size !== players.length
    )
      return fail(
        "Usa nombres distintos para identificar a todos los jugadores (añade un apellido si hace falta).",
      );
    const id = crypto.randomUUID(),
      now = Date.now();
    // Shuffle once on the server; the persisted schedule never changes after scoring starts.
    for (let i = players.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      [players[i], players[j]] = [players[j], players[i]];
    }
    const rounds = generateRounds(players, body.courtCount);
    await env.DB.prepare(
      "INSERT INTO tournaments(id,owner_id,name,sport,points_per_match,court_count,players_json,rounds_json,results_json,standings_json,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,'active',1,?,?)",
    )
      .bind(
        id,
        userId,
        body.name.trim(),
        body.sport,
        body.pointsPerMatch,
        body.courtCount,
        JSON.stringify(players),
        JSON.stringify(rounds),
        "{}",
        "[]",
        now,
        now,
      )
      .run();
    return json({ id }, 201);
  }
  const match = pathname.match(/^\/api\/tournaments\/([a-zA-Z0-9-]+)$/);
  if (!match || !["GET", "PATCH"].includes(request.method)) return null;
  const row = await env.DB.prepare(
    `SELECT ${columns} FROM tournaments WHERE id=?`,
  )
    .bind(match[1])
    .first();
  if (!row) return fail("Torneo no encontrado.", 404);
  const tournament = unpack(row, userId);
  if (
    tournament.ownerId !== userId &&
    !tournament.players.some((p) => p.userId === userId)
  )
    return fail("Torneo no encontrado.", 404);
  if (request.method === "GET") return json({ tournament });
  if (tournament.ownerId !== userId)
    return fail("Solo el organizador puede guardar resultados.", 403);
  if (tournament.status === "finished")
    return fail(
      "Este torneo ya finalizó. Sus puntos ya están en el ranking.",
      409,
    );
  const body = await bodyOf(request);
  if (body.version !== tournament.version)
    return fail(
      "El torneo cambió en otra pestaña. Recarga sus resultados antes de guardar.",
      409,
    );
  const now = Date.now();
  let change;
  if (body.action === "score") {
    if (
      !tournament.rounds.some((r) =>
        r.matches.some((m) => m.id === body.matchId),
      )
    )
      return fail("Partido no encontrado.", 404);
    if (
      ![body.a, body.b].every((n) => Number.isInteger(n) && n >= 0) ||
      body.a + body.b !== tournament.pointsPerMatch
    )
      return fail(
        `Los dos marcadores deben sumar ${tournament.pointsPerMatch} puntos.`,
      );
    const results = {
      ...tournament.results,
      [body.matchId]: { a: body.a, b: body.b },
    };
    change = await env.DB.prepare(
      "UPDATE tournaments SET results_json=?,version=version+1,updated_at=? WHERE id=? AND owner_id=? AND version=? AND status='active'",
    )
      .bind(JSON.stringify(results), now, tournament.id, userId, body.version)
      .run();
  } else if (body.action === "finish") {
    if (
      !tournament.rounds.every((r) =>
        r.matches.every((m) => tournament.results[m.id]),
      )
    )
      return fail("Guarda todos los resultados antes de finalizar.");
    const standings = tournamentStandings(
      tournament.players,
      tournament.rounds,
      tournament.results,
    );
    change = await env.DB.prepare(
      "UPDATE tournaments SET status='finished',standings_json=?,week_start=?,completed_at=?,updated_at=?,version=version+1 WHERE id=? AND owner_id=? AND version=? AND status='active'",
    )
      .bind(
        JSON.stringify(standings),
        weekStart(now),
        now,
        now,
        tournament.id,
        userId,
        body.version,
      )
      .run();
  } else return fail("Acción inválida.");
  if (!change.meta.changes)
    return fail("El torneo acaba de cambiar. Recarga para continuar.", 409);
  const updated = await env.DB.prepare(
    `SELECT ${columns} FROM tournaments WHERE id=?`,
  )
    .bind(tournament.id)
    .first();
  return json({ tournament: unpack(updated, userId) });
}
