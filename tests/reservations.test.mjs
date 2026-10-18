import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
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
  for (const statement of (
    await readFile("drizzle/0000_romantic_viper.sql", "utf8")
  ).split("--> statement-breakpoint"))
    if (statement.trim()) await db.prepare(statement).run();
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
