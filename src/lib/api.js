const authErrors = {
  INVALID_EMAIL_OR_PASSWORD: "El email o la contraseña no son correctos.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese email. Inicia sesión.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Ya existe una cuenta con ese email. Inicia sesión.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 10 caracteres.",
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera un minuto y vuelve a probar.",
};
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.error ||
        authErrors[data.code] ||
        (response.status === 429
          ? "Demasiados intentos. Espera un minuto."
          : "No pudimos completar la solicitud. Revisa tus datos e inténtalo de nuevo."),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export function dashboardDestination() {
  const sport = new URLSearchParams(window.location.search).get("sport");
  return sport === "pickleball" ? "/dashboard?sport=pickleball" : "/dashboard";
}
