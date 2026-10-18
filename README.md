# HEAT Pádel & Pickleball

Web del club y reservas en Next.js App Router, JavaScript/JSX y CSS con BEM. Sin TypeScript ni Tailwind. Autenticación con Better Auth y persistencia en Neon/PostgreSQL para Vercel o Cloudflare D1 para Sites.

## Vercel + Neon

En Vercel se compila Next.js con una función dinámica `/api/[...path]`. Fuera de Vercel, el build por defecto conserva la exportación y el Worker de Sites. `vercel.json` fija Next.js, salida `.next` y región `iad1`, junto a Neon US East.

Configura estas variables **solo de servidor** en Vercel → heatpadel → Settings → Environment Variables → Production:

- `DATABASE_URL`: conexión pooled de Neon (la integración la añade automáticamente).
- `BETTER_AUTH_SECRET`: secreto aleatorio de al menos 32 caracteres, estable entre despliegues.
- `BETTER_AUTH_URL`: `https://heatpadel.vercel.app`, o el origen HTTPS definitivo del club cuando se cambie el dominio.

No hacen falta todas las variantes `PG*`/`POSTGRES*`, Firebase ni Neon Auth. No uses `NEXT_PUBLIC_`. Cambiar variables requiere un nuevo despliegue. Usa el dominio configurado para registrarte; las URLs temporales de deployment no son orígenes admitidos.

El build de Vercel Production ejecuta `scripts/migrate-postgres.mjs` antes de compilar. Las migraciones versionadas de `drizzle-postgres/` se aplican en una transacción con bloqueo y checksum. Una migración ya aplicada no se repite ni se modifica. Si falla la conexión, el build falla sin publicar una aplicación incompleta. Para generar futuras migraciones: `npx drizzle-kit generate --config drizzle.postgres.config.mjs`.

Para desarrollo con Neon, copia `.env.example` a `.env.local`, completa los valores privados y deja `BETTER_AUTH_URL=http://localhost:3000`. Ejecuta `npm run db:migrate:postgres` y `npm run dev:node`. Usa una base o rama separada para desarrollo/Preview y aplícale las migraciones explícitamente. Production y Preview no deben compartir la agenda real. `npm run test:postgres` prueba registro, sesiones, reservas y torneos con PostgreSQL efímero en PGlite, sin conectarse a Neon.

**Los datos de Sites/D1 y Neon son independientes.** Instalar esta versión no copia cuentas, reservas ni torneos existentes de D1. Para conservarlos al cambiar de alojamiento se necesita una migración de datos específica. La nueva base de Neon comienza vacía.

## Desarrollo

```sh
npm ci
npm run build
npm run db:migrate:local
npm run preview
```

Antes de `preview`, crea un `.dev.vars` ignorado por Git con `BETTER_AUTH_SECRET` (al menos 32 caracteres aleatorios). Abre http://127.0.0.1:8787. Wrangler sirve el Worker y los archivos exportados de Next.js juntos, con una base local independiente de producción.

`npm run dev` sirve solo la interfaz de Next.js en el puerto 3000; para probar cuentas y reservas usa `preview`. `npm run build` genera `out/` y empaqueta el Worker, cliente y migraciones en `dist/`. No se usa `next start` con `output: 'export'`.

## Organización

- `src/data/club.js`: información del negocio, enlaces, navegación y escenas.
- `src/components/ScrollHero.jsx`: portada sticky y transiciones mediante scroll nativo y requestAnimationFrame; sin librerías de animación.
- `src/components/Header.jsx`: navegación y menú móvil.
- `src/components/BookingDialog.jsx`: diálogo accesible con foco, Escape y canales de reserva.
- `src/components/ui.jsx`: botones, flechas y etiquetas reutilizables.
- `src/components/Reveal.jsx`: revelado de títulos y cifras al entrar en pantalla una sola vez por carga, con IntersectionObserver y movimiento reducido. El contenido permanece visible si JavaScript o el observador no están disponibles.
- `src/components/Landing.jsx`: secciones de la landing.
- `src/components/Rankings.jsx` y `Rankings.css`: podio semanal con selector de deporte y fotografías ilustrativas.
- `src/data/rankings.js`: jugadores y puntos ficticios de la vista previa.
- `src/app/globals.css`: estilos BEM, variables y breakpoints.
- `public/images`: logo original y variante para fondos claros, fotografías del club, fotografías de stock y jugadores generados optimizados en WebP.

El orden de las secciones es: portada, club, canchas, academia, experiencia («Quédate un set más»), ranking y contacto. Los créditos de las fotografías del podio están en `docs/ranking-photos.md`; el flujo previsto para el ranking conectado a reservas, en `docs/weekly-ranking.md`.

## Alcance

Incluye registro con nombre, apellido, nacimiento, nacionalidad, email y contraseña; inicio y cierre de sesión; dashboard, disponibilidad, reservas por hora, reprogramación, cancelación, ranking semanal personal y organización de torneos americanos. Las páginas de Next.js son shells estáticas: toda lectura o escritura de datos privados exige sesión en el servidor (Next.js en Vercel o Worker en Sites).

Los horarios son de 07:00 a 23:00 de Playa del Carmen (`America/Cancun`), con turnos de una hora y último inicio a las 22:00. Las modificaciones y cancelaciones se permiten hasta exactamente 24 horas antes del inicio. Reservar con menos anticipación es posible, pero el turno queda sin posibilidad de modificación o cancelación por el usuario.

La disponibilidad solo incluye reservas creadas en esta aplicación. **No sincroniza Playtomic ni reservas tomadas por teléfono/WhatsApp**. Antes de utilizar ambas agendas para reservas reales, debe incorporarse una integración o un mecanismo de bloqueo administrativo. No incluye pagos, recuperación de contraseña por correo, verificación de email ni gestión administrativa. El ranking de la landing conserva los datos ficticios autorizados; no se suman puntos desde reservas todavía.

## Backend y publicación

### Americanos y ranking

El dashboard reutiliza el podio de la landing con datos reales, resalta al usuario y muestra su posición aunque esté fuera del top 100. El ranking separa pádel y pickleball. Quien aún no haya terminado un torneo aparece «Sin clasificar aún».

Los americanos admiten 4, 8, 12, 16 o 20 jugadores y 16, 24, 32 o 40 puntos totales por partido. Cada participante forma pareja una vez con cada uno de los demás. Si faltan canchas simultáneas, se generan tandas con descansos. Crear el torneo **no reserva las canchas**.

Los participantes con email de una cuenta HEAT se vinculan a su ID; sus nombres se consultan en el servidor y sus emails no se exponen en el torneo. Los invitados sin email solo tienen clasificación dentro del torneo. El organizador edita resultados; los participantes vinculados pueden consultarlos y actualizarlos con el botón de recarga. La clasificación se recalcula al guardar: puntos de la pareja, victorias y diferencia de puntos; empate completo comparte posición.

Finalizar requiere todos los marcadores y bloquea futuras modificaciones. Los puntos pasan una sola vez a la semana del cierre (lunes a domingo en `America/Cancun`). El ranking semanal suma los puntos de los torneos finalizados y desempata por victorias, compartiendo puesto si persiste el empate. No se exige todavía validación del club ni confirmación de los rivales. Los resultados de partidos reservados fuera de un americano siguen pendientes de desarrollo.

- `src/lib/americano.js`: rotación de parejas, tandas, clasificación y semana del club.
- `server/tournaments.mjs`: API con autorización por organizador/participante y actualización atómica por versión.
- `src/components/account/Americanos.jsx`, `AmericanoSetup.jsx`, `AmericanoMatch.jsx`: organización, marcadores y clasificación.
- `src/components/account/DashboardRanking.jsx`: posición personal y ranking real.
- `src/components/account/CourtIllustration.jsx`: cancha isométrica SVG con red, paredes y trazado según el deporte.
- `src/app/competition.css`: estilos BEM responsive de competición.

### Infraestructura

- `server/auth.mjs`: Better Auth, hash de contraseña, cookies HttpOnly, sesiones de 7 días y límite persistente de intentos de autenticación.
- `server/worker.mjs`: API autenticada y comprobación de origen en escrituras; las respuestas de cuenta y reservas nunca se cachean.
- `server/schema.mjs` y `drizzle/`: esquema y migraciones. El índice único parcial de reservas activas impide duplicados incluso con solicitudes simultáneas. Reprogramar hace un único UPDATE atómico: un conflicto conserva el turno anterior. La versión de la reserva evita sobrescribir cambios desde otra pestaña.
- `src/components/account/`: formularios, dashboard, selector de fecha y confirmación accesible.
- `src/lib/booking.js`: canchas, horarios y reglas compartidas; el servidor es la autoridad final.
- `src/app/account.css`: estilo BEM responsive de cuentas y reservas.

Sites provisiona `DB` a partir de `.openai/hosting.json` y aplica las migraciones empaquetadas en `dist/.openai/drizzle`. En producción, establecer `BETTER_AUTH_SECRET` como secreto de runtime y `BETTER_AUTH_URL` con el origen HTTPS de la web mediante las variables de entorno de Sites. No guardar secretos en Git ni en variables `NEXT_PUBLIC_*`. Cambiar de dominio requiere actualizar `BETTER_AUTH_URL` y publicar de nuevo.

El `wrangler.json` del repositorio usa un ID de base ficticio exclusivamente para desarrollo local. Para un despliegue propio en Cloudflare hay que sustituirlo por un D1 real y configurar los mismos secretos. La audiencia privada del alojamiento Sites se conserva y es independiente de las cuentas del club; no se abre el acceso público automáticamente.

## Verificación

`npm run build` y `npm test`. Las 14 pruebas usan una base D1 efímera y cubren registro, hash de contraseña, sesión, autorización, conflictos simultáneos, reprogramación atómica, cancelación y liberación de cupos, límite de 24 horas, validación, CSRF y cierre de sesión. También verifican las rotaciones de 4 a 20 jugadores, descanso equilibrado, marcadores, empates, permisos del torneo, guardado concurrente, cierre único, separación por deporte y semana. Los datos de prueba no se escriben en producción. `docs/account-qa.html` permite revisar escritorio y móviles al copiarlo temporalmente a `out/`; nunca se incluye en el despliegue final.

## Contenido y recursos

Información y fotografías verificadas en https://heatpadelclub.com el 18 de octubre de 2026. Logo original: `/wp-content/uploads/2025/03/logo-HEAT.svg`. Fotografías: `carrusel01.jpg`, `carrusel02.jpg`, `heatpadelclub01.jpg` y `paquito-navarro-1024x1024.png` en la web del club. Las afirmaciones sobre instalaciones y academia provienen de esa fuente. Los jugadores de la portada son figuras publicitarias generadas, no miembros ni entrenadores identificados del club.

Tipografías Anton y DM Sans servidas localmente, distribuidas bajo SIL Open Font License. Las fuentes de marca e imágenes pueden sustituirse desde `public/` sin cambiar la estructura.

## Recursos generados

Herramienta integrada ImageGen, fondo transparente. Archivos finales:

- `public/images/player-padel.webp`: jugador adulto ficticio de pádel de cuerpo completo, camiseta negra y shorts claros, salto de remate con pala negra perforada, fotografía editorial, sin logos ni fondo.
- `public/images/player-pickleball.webp`: jugadora adulta ficticia, camiseta blanca y falda azul, golpe de derecha con pala de pickleball, cuerpo completo, fotografía editorial, sin logos ni fondo.
- `public/images/player-academy.webp`: jugador adulto ficticio de pádel, camiseta verde lima y shorts negros, preparación de revés, cuerpo completo, fotografía editorial, sin logos ni fondo.

Los PNG originales se conservan en la carpeta de imágenes generadas de Codex; el proyecto sirve WebP para reducir la descarga.

## Accesibilidad

Navegación por teclado, enlace para saltar al contenido, foco visible, diálogo nativo, nombres accesibles, imágenes decorativas ocultas a lectores de pantalla y soporte de `prefers-reduced-motion`. La portada también permite seleccionar las escenas con botones.
