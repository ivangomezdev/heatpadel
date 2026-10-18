# HEAT Pádel & Pickleball

Landing en Next.js App Router, JavaScript/JSX y CSS con BEM. Sin TypeScript ni Tailwind.

## Desarrollo

```sh
npm ci
npm run dev
```

Abre http://localhost:3000. `npm run build` genera la versión estática en `out/`. Para verla, sirve esa carpeta con un servidor HTTP estático. `next start` no se usa con `output: 'export'`.

## Organización

- `src/data/club.js`: información del negocio, enlaces, navegación y escenas.
- `src/components/ScrollHero.jsx`: portada sticky y transiciones mediante scroll nativo y requestAnimationFrame; sin librerías de animación.
- `src/components/Header.jsx`: navegación y menú móvil.
- `src/components/BookingDialog.jsx`: diálogo accesible con foco, Escape y canales de reserva.
- `src/components/ui.jsx`: botones, flechas y etiquetas reutilizables.
- `src/components/Landing.jsx`: secciones de la landing.
- `src/components/Rankings.jsx` y `Rankings.css`: podio semanal con selector de deporte y fotografías ilustrativas.
- `src/data/rankings.js`: jugadores y puntos ficticios de la vista previa.
- `src/app/globals.css`: estilos BEM, variables y breakpoints.
- `public/images`: logo original y variante para fondos claros, fotografías del club, fotografías de stock y jugadores generados optimizados en WebP.

El orden de las secciones es: portada, club, canchas, academia, experiencia («Quédate un set más»), ranking y contacto. Los créditos de las fotografías del podio están en `docs/ranking-photos.md`; el flujo previsto para el ranking conectado a reservas, en `docs/weekly-ranking.md`.

## Alcance

Esta entrega implementa la landing. Las reservas y la consulta de disponibilidad se realizan en Playtomic; también se ofrece el contacto oficial de WhatsApp. Todavía no hay autenticación propia, base de datos, pagos ni calendario conectado. Para incorporar esas funciones habrá que retirar la exportación estática si se usan rutas de servidor de Next.js y conectar los servicios correspondientes.

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
