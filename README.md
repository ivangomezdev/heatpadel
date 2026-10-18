# HEAT Pádel & Pickleball

Web del club y reservas en Next.js App Router, JavaScript/JSX y CSS con BEM. Sin TypeScript ni Tailwind. Autenticación con Better Auth y persistencia compartida con Cloudflare D1, provisionada por Sites.

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

Incluye registro con nombre, apellido, nacimiento, nacionalidad, email y contraseña; inicio y cierre de sesión; dashboard, disponibilidad, reservas por hora, reprogramación y cancelación. Las páginas de Next.js son shells estáticas: toda lectura o escritura de datos privados exige sesión en el Worker.

Los horarios son de 07:00 a 23:00 de Playa del Carmen (`America/Cancun`), con turnos de una hora y último inicio a las 22:00. Las modificaciones y cancelaciones se permiten hasta exactamente 24 horas antes del inicio. Reservar con menos anticipación es posible, pero el turno queda sin posibilidad de modificación o cancelación por el usuario.

La disponibilidad solo incluye reservas creadas en esta aplicación. **No sincroniza Playtomic ni reservas tomadas por teléfono/WhatsApp**. Antes de utilizar ambas agendas para reservas reales, debe incorporarse una integración o un mecanismo de bloqueo administrativo. No incluye pagos, recuperación de contraseña por correo, verificación de email ni gestión administrativa. El ranking de la landing conserva los datos ficticios autorizados; no se suman puntos desde reservas todavía.

## Backend y publicación

- `server/auth.mjs`: Better Auth, hash de contraseña, cookies HttpOnly, sesiones de 7 días y límite persistente de intentos de autenticación.
- `server/worker.mjs`: API autenticada y comprobación de origen en escrituras; las respuestas de cuenta y reservas nunca se cachean.
- `server/schema.mjs` y `drizzle/`: esquema y migraciones. El índice único parcial de reservas activas impide duplicados incluso con solicitudes simultáneas. Reprogramar hace un único UPDATE atómico: un conflicto conserva el turno anterior. La versión de la reserva evita sobrescribir cambios desde otra pestaña.
- `src/components/account/`: formularios, dashboard, selector de fecha y confirmación accesible.
- `src/lib/booking.js`: canchas, horarios y reglas compartidas; el servidor es la autoridad final.
- `src/app/account.css`: estilo BEM responsive de cuentas y reservas.

Sites provisiona `DB` a partir de `.openai/hosting.json` y aplica las migraciones empaquetadas en `dist/.openai/drizzle`. En producción, establecer `BETTER_AUTH_SECRET` como secreto de runtime y `BETTER_AUTH_URL` con el origen HTTPS de la web mediante las variables de entorno de Sites. No guardar secretos en Git ni en variables `NEXT_PUBLIC_*`. Cambiar de dominio requiere actualizar `BETTER_AUTH_URL` y publicar de nuevo.

El `wrangler.json` del repositorio usa un ID de base ficticio exclusivamente para desarrollo local. Para un despliegue propio en Cloudflare hay que sustituirlo por un D1 real y configurar los mismos secretos. La audiencia privada del alojamiento Sites se conserva y es independiente de las cuentas del club; no se abre el acceso público automáticamente.

## Verificación

`npm run build` y `npm test`. Las pruebas usan una base D1 efímera y cubren registro, hash de contraseña, sesión, autorización, conflictos simultáneos, reprogramación atómica, cancelación y liberación de cupos, límite de 24 horas, validación, CSRF y cierre de sesión. Los datos de prueba no se escriben en producción. `docs/account-qa.html` permite revisar escritorio y móviles al copiarlo temporalmente a `out/`; nunca se incluye en el despliegue final.

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
