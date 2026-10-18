import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createConfiguredAuth } from "../server/auth-options.mjs";
import { createPostgresDatabase } from "../server/postgres-db.mjs";
import { migrationStatements } from "../server/postgres-migrations.mjs";
import * as pgSchema from "../server/schema-postgres.mjs";
import worker from "../server/worker.mjs";
const postgres = process.env.HEAT_TEST_DATABASE === "postgres";
import { canChange, CHANGE_NOTICE_MS } from "../src/lib/booking.js";

let mf, db, alice, bob;
const origin = "http://localhost";
const password = "Heat-test-only-48!";
const date = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
async function request(
  path,
  {
    method = "GET",
    body,
    cookie,
    ip = "127.0.0.1",
    requestOrigin = origin,
  } = {},
) {
  const response = await mf.dispatchFetch(`${origin}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      origin: requestOrigin,
      "cf-connecting-ip": ip,
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; "),
    headers: response.headers,
  };
}
async function signup(email, ip) {
  return request("/api/auth/sign-up/email", {
    method: "POST",
    ip,
    body: {
      email,
      password,
      name: "Jugador QA",
      firstName: "Jugador",
      lastName: "QA",
      birthDate: "1994-05-20",
      nationality: "Mexicana",
    },
  });
}
before(async () => {
  if (postgres) {
    const pg = new PGlite();
    const statements = await migrationStatements();
    for (let pass = 0; pass < 2; pass++) {
      await pg.transaction(async (tx) => {
        for (const statement of statements) await tx.query(statement);
      });
    }
    db = createPostgresDatabase(
      (sql, values) => pg.query(sql, values),
      (queries) =>
        pg.transaction(async (tx) => {
          const results = [];
          for (const q of queries)
            results.push(await tx.query(q.sql, q.params));
          return results;
        }),
    );
    const env = {
      DB: db,
      BETTER_AUTH_SECRET: randomBytes(48).toString("base64"),
    };
    env.AUTH = createConfiguredAuth(
      env,
      origin,
      drizzleAdapter(drizzle(pg), {
        provider: "pg",
        schema: pgSchema,
        transaction: false,
      }),
    );
    mf = {
      dispatchFetch: (url, init) => worker.fetch(new Request(url, init), env),
      dispose: () => pg.close(),
    };
  } else {
    mf = new Miniflare(
      convertV4MiniflareOptions({
        name: "heat-test",
        modules: true,
        scriptPath: "dist/server/index.js",
        compatibilityDate: "2026-10-01",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        bindings: { BETTER_AUTH_SECRET: randomBytes(48).toString("base64") },
      }),
    );
    db = await mf.getD1Database("DB");
    for (const file of (await readdir("drizzle"))
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      for (const statement of (await readFile(`drizzle/${file}`, "utf8")).split(
        "--> statement-breakpoint",
      ))
        if (statement.trim()) await db.prepare(statement).run();
    }
  }
  alice = await signup("alice@example.test", "127.0.0.2");
  assert.equal(alice.status, 200, JSON.stringify(alice.body));
  bob = await signup("bob@example.test", "127.0.0.3");
  assert.equal(bob.status, 200, JSON.stringify(bob.body));
});
after(async () => {
  await mf?.dispose();
});

test("registro guarda perfil y contraseña cifrada; sesión HttpOnly", async () => {
  assert.equal(alice.body.user.firstName, "Jugador");
  assert.match(alice.headers.get("set-cookie"), /HttpOnly/i);
  const row = await db
    .prepare("SELECT password FROM account WHERE user_id = ?")
    .bind(alice.body.user.id)
    .first();
  assert.notEqual(row.password, password);
  assert.ok(row.password.length > 80);
  const session = await request("/api/auth/get-session", {
    cookie: alice.cookie,
  });
  assert.equal(session.body.user.birthDate, "1994-05-20");
  assert.equal((await request("/api/reservations")).status, 401);
});
test("dos usuarios compiten por el mismo turno: solo uno lo obtiene", async () => {
  const slot = { courtId: "padel-1", date, hour: 10 };
  const results = await Promise.all(
    [alice, bob].map((u) =>
      request("/api/reservations", {
        method: "POST",
        cookie: u.cookie,
        body: slot,
      }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const availability = await request(`/api/availability?date=${date}`, {
    cookie: alice.cookie,
  });
  assert.deepEqual(availability.body.occupied, [
    { courtId: "padel-1", hour: 10 },
  ]);
  assert.equal(JSON.stringify(availability.body).includes("userId"), false);
});
test("reprogramación atómica, propiedad, versiones y cancelación liberan el turno", async () => {
  const first = await request("/api/reservations", {
    method: "POST",
    cookie: alice.cookie,
    body: { courtId: "padel-2", date, hour: 12 },
  });
  const blocked = await request("/api/reservations", {
    method: "POST",
    cookie: bob.cookie,
    body: { courtId: "padel-3", date, hour: 13 },
  });
  assert.equal(first.status, 201);
  assert.equal(blocked.status, 201);
  assert.equal(
    (
      await request(`/api/reservations/${first.body.id}`, {
        method: "DELETE",
        cookie: bob.cookie,
        body: { version: 1 },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await request(`/api/reservations/${first.body.id}`, {
        method: "PATCH",
        cookie: alice.cookie,
        body: { courtId: "padel-3", date, hour: 13, version: 1 },
      })
    ).status,
    409,
  );
  let stored = await db
    .prepare("SELECT * FROM reservations WHERE id=?")
    .bind(first.body.id)
    .first();
  assert.equal(stored.court_id, "padel-2");
  assert.equal(stored.hour, 12);
  assert.equal(
    (
      await request(`/api/reservations/${first.body.id}`, {
        method: "PATCH",
        cookie: alice.cookie,
        body: { courtId: "padel-2", date, hour: 14, version: 1 },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/api/reservations/${first.body.id}`, {
        method: "DELETE",
        cookie: alice.cookie,
        body: { version: 1 },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/api/reservations/${first.body.id}`, {
        method: "DELETE",
        cookie: alice.cookie,
        body: { version: 2 },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/reservations", {
        method: "POST",
        cookie: bob.cookie,
        body: { courtId: "padel-2", date, hour: 14 },
      })
    ).status,
    201,
  );
});
test("24 horas: límite exacto permitido, menos de 24h bloquea cambio y cancelación en servidor", async () => {
  const now = Date.now();
  assert.equal(
    canChange({ status: "confirmed", startsAt: now + CHANGE_NOTICE_MS }, now),
    true,
  );
  assert.equal(
    canChange(
      { status: "confirmed", startsAt: now + CHANGE_NOTICE_MS - 1 },
      now,
    ),
    false,
  );
  const result = await request("/api/reservations", {
    method: "POST",
    cookie: alice.cookie,
    body: { courtId: "pickleball-1", date, hour: 10 },
  });
  await db
    .prepare("UPDATE reservations SET starts_at = ? WHERE id=?")
    .bind(now + 3600000, result.body.id)
    .run();
  for (const method of ["DELETE", "PATCH"])
    assert.equal(
      (
        await request(`/api/reservations/${result.body.id}`, {
          method,
          cookie: alice.cookie,
          body: { version: 1, courtId: "pickleball-2", date, hour: 11 },
        })
      ).status,
      409,
    );
});
test("valida fecha, cancha, horario, origen y nacimiento; no expone reservas ajenas", async () => {
  for (const slot of [
    { courtId: "other", date, hour: 8 },
    { courtId: "padel-1", date: "2026-02-30", hour: 8 },
    { courtId: "padel-1", date, hour: 23 },
    { courtId: "padel-1", date: "2020-01-01", hour: 8 },
  ])
    assert.equal(
      (
        await request("/api/reservations", {
          method: "POST",
          cookie: alice.cookie,
          body: slot,
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await request("/api/reservations", {
        method: "POST",
        cookie: alice.cookie,
        requestOrigin: "https://other.test",
        body: { courtId: "padel-1", date, hour: 8 },
      })
    ).status,
    403,
  );
  const invalid = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: {
      email: "invalid@example.test",
      password,
      firstName: "Juan",
      lastName: "QA",
      nationality: "Mexicana",
      birthDate: "2030-01-01",
    },
  });
  assert.equal(invalid.status, 400);
  const mine = await request("/api/reservations", { cookie: alice.cookie });
  const bobs = await db
    .prepare("SELECT id FROM reservations WHERE user_id=?")
    .bind(bob.body.user.id)
    .all();
  assert.ok(
    mine.body.reservations.every(
      (r) => !bobs.results.some((b) => b.id === r.id),
    ),
  );
});
test("inicio de sesión rechaza contraseña incorrecta; logout revoca sesión", async () => {
  const invalid = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: "alice@example.test", password: "incorrect-password" },
  });
  assert.equal(invalid.status, 401);
  const login = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: "alice@example.test", password },
  });
  assert.equal(login.status, 200);
  assert.equal(
    (
      await request("/api/auth/sign-out", {
        method: "POST",
        cookie: login.cookie,
        body: {},
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/api/reservations", { cookie: login.cookie })).status,
    401,
  );
});

test("americano: acceso, validación, concurrencia y publicación única al ranking semanal", async () => {
  await db
    .prepare(`UPDATE "user" SET name='Alice QA' WHERE id=?`)
    .bind(alice.body.user.id)
    .run();
  await db
    .prepare(`UPDATE "user" SET name='Bob QA' WHERE id=?`)
    .bind(bob.body.user.id)
    .run();
  const payload = {
    name: "Americano QA",
    sport: "padel",
    courtCount: 1,
    pointsPerMatch: 24,
    players: [
      { email: "alice@example.test" },
      { email: "bob@example.test" },
      { name: "Invitada Uno" },
      { name: "Invitado Dos" },
    ],
  };
  const create = (body) =>
    request("/api/tournaments", { method: "POST", cookie: alice.cookie, body });
  assert.equal((await request("/api/tournaments")).status, 401);
  for (const body of [
    { ...payload, players: payload.players.slice(0, 3) },
    { ...payload, courtCount: 2 },
    {
      ...payload,
      players: [{ email: "missing@example.test" }, ...payload.players.slice(1)],
    },
    {
      ...payload,
      players: [{ email: "bob@example.test" }, ...payload.players.slice(1)],
    },
  ])
    assert.equal((await create(body)).status, 400);
  const created = await create(payload);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const path = `/api/tournaments/${created.body.id}`;
  let state = (await request(path, { cookie: alice.cookie })).body.tournament;
  assert.equal(state.canEdit, true);
  assert.equal(JSON.stringify(state).includes("@"), false);
  const participant = await request(path, { cookie: bob.cookie });
  assert.equal(participant.status, 200);
  assert.equal(participant.body.tournament.canEdit, false);
  assert.ok(
    (
      await request("/api/tournaments", { cookie: bob.cookie })
    ).body.tournaments.some((t) => t.id === state.id),
  );
  const outsider = await signup("outsider@example.test", "127.0.0.4");
  assert.equal((await request(path, { cookie: outsider.cookie })).status, 404);
  assert.equal(
    (
      await request(path, {
        method: "PATCH",
        cookie: bob.cookie,
        body: { action: "finish", version: 1 },
      })
    ).status,
    403,
  );
  const change = (body) =>
    request(path, { method: "PATCH", cookie: alice.cookie, body });
  assert.equal((await change({ action: "finish", version: 1 })).status, 400);
  const matches = state.rounds.flatMap((r) => r.matches);
  assert.equal(
    (
      await change({
        action: "score",
        matchId: matches[0].id,
        a: 24,
        b: 24,
        version: 1,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await change({
        action: "score",
        matchId: "missing",
        a: 12,
        b: 12,
        version: 1,
      })
    ).status,
    404,
  );
  const race = await Promise.all(
    [0, 1].map(() =>
      change({
        action: "score",
        matchId: matches[0].id,
        a: 12,
        b: 12,
        version: 1,
      }),
    ),
  );
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
  state = race.find((r) => r.status === 200).body.tournament;
  for (const match of matches.slice(1)) {
    const saved = await change({
      action: "score",
      matchId: match.id,
      a: 12,
      b: 12,
      version: state.version,
    });
    assert.equal(saved.status, 200);
    state = saved.body.tournament;
  }
  assert.equal(
    (await request("/api/rankings", { cookie: alice.cookie })).body.total,
    0,
  );
  const finished = await Promise.all(
    [0, 1].map(() => change({ action: "finish", version: state.version })),
  );
  assert.deepEqual(finished.map((r) => r.status).sort(), [200, 409]);
  const board = await request("/api/rankings", { cookie: alice.cookie });
  assert.equal(board.status, 200, JSON.stringify(board.body));
  assert.equal(board.body.total, 2);
  assert.equal(board.body.me.points, 36);
  assert.equal(board.body.me.position, 1);
  assert.ok(
    board.body.players.every(
      (p) => p.position === 1 && p.played === 3 && p.points === 36,
    ),
  );
  assert.equal(
    (await request("/api/rankings?sport=pickleball", { cookie: alice.cookie }))
      .body.total,
    0,
  );
  assert.equal(
    (await request("/api/rankings", { cookie: outsider.cookie })).body.me
      .position,
    null,
  );
  assert.equal(
    (
      await change({
        action: "score",
        matchId: matches[0].id,
        a: 24,
        b: 0,
        version: state.version + 1,
      })
    ).status,
    409,
  );
  await db
    .prepare("UPDATE tournaments SET week_start='2026-01-05' WHERE id=?")
    .bind(state.id)
    .run();
  assert.equal(
    (await request("/api/rankings", { cookie: alice.cookie })).body.total,
    0,
  );
});
