import { createAuth } from "./auth.mjs";
import { tournamentApi } from "./tournaments.mjs";
import {
  COURTS,
  HOURS,
  CHANGE_NOTICE_MS,
  startsAt,
  validDate,
  clubToday,
} from "../src/lib/booking.js";

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (message, status = 400) => json({ error: message }, status);
const reservationColumns =
  "id, court_id AS courtId, date, hour, starts_at AS startsAt, status, version";
async function bodyOf(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("INVALID_BODY");
  const text = await request.text();
  if (text.length > 8192) throw new Error("INVALID_BODY");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new Error("INVALID_BODY");
  }
}
function validateSlot(body, now) {
  if (
    !COURTS.some((c) => c.id === body.courtId) ||
    !validDate(body.date) ||
    !HOURS.includes(body.hour)
  )
    return "Selecciona una cancha, fecha y horario válidos.";
  if (startsAt(body.date, body.hour) <= now)
    return "Ese turno ya comenzó. Elige otro horario.";
  return null;
}
async function handleApi(request, env) {
  const url = new URL(request.url);
  const origin = env.BETTER_AUTH_URL || url.origin;
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.headers.get("origin") !== origin
  )
    return fail("Solicitud no permitida.", 403);
  const auth = createAuth(env, origin);
  if (url.pathname.startsWith("/api/auth/")) {
    // Profile changes are not exposed until a validated profile editor is available.
    const route = url.pathname.slice("/api/auth".length);
    if (
      ![
        "/sign-up/email",
        "/sign-in/email",
        "/sign-out",
        "/get-session",
      ].includes(route)
    )
      return fail("Ruta no disponible.", 404);
    if (route === "/sign-up/email" && request.method === "POST") {
      const body = await bodyOf(request.clone());
      for (const key of ["firstName", "lastName", "nationality"]) {
        if (
          typeof body[key] !== "string" ||
          !body[key].trim() ||
          body[key].trim().length > 80
        )
          return fail("Completa tu nombre, apellido y nacionalidad.");
      }
      if (
        !validDate(body.birthDate) ||
        body.birthDate >= clubToday() ||
        body.birthDate < "1900-01-01"
      )
        return fail("Revisa tu fecha de nacimiento.");
      const clean = {
        name: `${body.firstName.trim()} ${body.lastName.trim()}`,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        nationality: body.nationality.trim(),
        birthDate: body.birthDate,
        email: body.email,
        password: body.password,
      };
      request = new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(clean),
      });
    }
    const response = await auth.handler(request);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return fail("Inicia sesión para continuar.", 401);
  const userId = session.user.id;
  if (
    url.pathname === "/api/rankings" ||
    url.pathname.startsWith("/api/tournaments")
  ) {
    const response = await tournamentApi(request, env, session, bodyOf);
    return response || fail("Ruta no encontrada.", 404);
  }
  if (url.pathname === "/api/availability" && request.method === "GET") {
    const date = url.searchParams.get("date");
    if (!validDate(date)) return fail("Fecha inválida.");
    const { results } = await env.DB.prepare(
      "SELECT court_id AS courtId, hour FROM reservations WHERE date = ? AND status = 'confirmed'",
    )
      .bind(date)
      .all();
    return json({ occupied: results, serverNow: Date.now() });
  }
  if (url.pathname === "/api/reservations" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT ${reservationColumns} FROM reservations WHERE user_id = ? ORDER BY starts_at DESC`,
    )
      .bind(userId)
      .all();
    return json({ reservations: results, serverNow: Date.now() });
  }
  if (url.pathname === "/api/reservations" && request.method === "POST") {
    const body = await bodyOf(request);
    const now = Date.now();
    const error = validateSlot(body, now);
    if (error) return fail(error);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO reservations (id,user_id,court_id,date,hour,starts_at,status,version,created_at,updated_at) VALUES (?,?,?,?,?,?,'confirmed',1,?,?)",
    )
      .bind(
        id,
        userId,
        body.courtId,
        body.date,
        body.hour,
        startsAt(body.date, body.hour),
        now,
        now,
      )
      .run();
    return json({ id }, 201);
  }
  const match = url.pathname.match(/^\/api\/reservations\/([a-zA-Z0-9-]+)$/);
  if (match && ["PATCH", "DELETE"].includes(request.method)) {
    const body = await bodyOf(request);
    const now = Date.now();
    const existing = await env.DB.prepare(
      `SELECT ${reservationColumns} FROM reservations WHERE id = ? AND user_id = ?`,
    )
      .bind(match[1], userId)
      .first();
    if (!existing) return fail("Reserva no encontrada.", 404);
    if (existing.status !== "confirmed")
      return fail("Esta reserva ya fue cancelada.", 409);
    if (existing.startsAt - now < CHANGE_NOTICE_MS)
      return fail(
        "Solo puedes cambiar o cancelar hasta 24 horas antes del inicio.",
        409,
      );
    if (body.version !== existing.version)
      return fail(
        "Esta reserva cambió. Actualiza la página e inténtalo de nuevo.",
        409,
      );
    let result;
    if (request.method === "PATCH") {
      const error = validateSlot(body, now);
      if (error) return fail(error);
      result = await env.DB.prepare(
        "UPDATE reservations SET court_id=?,date=?,hour=?,starts_at=?,updated_at=?,version=version+1 WHERE id=? AND user_id=? AND status='confirmed' AND starts_at>=? AND version=?",
      )
        .bind(
          body.courtId,
          body.date,
          body.hour,
          startsAt(body.date, body.hour),
          now,
          existing.id,
          userId,
          now + CHANGE_NOTICE_MS,
          body.version,
        )
        .run();
    } else {
      result = await env.DB.prepare(
        "UPDATE reservations SET status='cancelled',updated_at=?,version=version+1 WHERE id=? AND user_id=? AND status='confirmed' AND starts_at>=? AND version=?",
      )
        .bind(now, existing.id, userId, now + CHANGE_NOTICE_MS, body.version)
        .run();
    }
    if (!result.meta.changes)
      return fail(
        "La reserva cambió o ya está dentro del plazo de 24 horas. Actualiza la página.",
        409,
      );
    return json({ ok: true });
  }
  return fail("Ruta no encontrada.", 404);
}
export default {
  async fetch(request, env) {
    try {
      if (new URL(request.url).pathname.startsWith("/api/"))
        return await handleApi(request, env);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (error.message === "INVALID_BODY") return fail("Solicitud inválida.");
      if (/UNIQUE constraint failed: reservations/.test(error.message))
        return fail(
          "Ese turno acaba de ser reservado. Elige otro horario.",
          409,
        );
      console.error("HEAT request failed", {
        path: new URL(request.url).pathname,
        type: error.name,
        message: error.message?.replace(/https?:\/\/\S+/g, "[url]"),
      });
      return fail(
        "No pudimos completar la solicitud. Inténtalo de nuevo.",
        500,
      );
    }
  },
};
