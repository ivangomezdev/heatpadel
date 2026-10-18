# Ranking semanal — landing y siguiente etapa

## Implementado en la landing

Sección `#rankings` con selectores Pádel/Pickleball y cinco jugadores ficticios por deporte. Un podio destaca los tres primeros puestos, con el líder en verde HEAT; una tabla compacta muestra el resto. La clasificación se ordena por puntos de mayor a menor. Los enlaces «Tu nombre aquí» y «Quiero competir» abren una consulta por WhatsApp para el deporte seleccionado.

La aclaración de jugadores y puntos ficticios aparece como una nota discreta debajo de la sección, fuera de la tabla. Los registros están en `src/data/rankings.js` y conservan `isDemo: true`. No se reciben resultados de partidos ni se actualiza un ranking real todavía.

La imagen de la jugadora es decorativa y no corresponde a ninguna persona de la clasificación. El fondo es una fotografía existente de HEAT. El círculo de las etiquetas se reemplazó por un SVG de pelota de tenis de 7 × 7 px, manteniendo su tamaño.

## Flujo solicitado para la aplicación

1. Un usuario con sesión iniciada reserva una cancha, fecha y hora.
2. Al llegar al partido, el titular abre esa reserva en su cuenta.
3. Registra los nombres de todos los jugadores, el puntaje individual y el resultado final del partido.
4. Los puntos de cada jugador se acumulan en la clasificación semanal correspondiente.

Ejemplo del usuario: Pedro Ruiz reserva una cancha y luego carga los jugadores, puntajes y resultado de ese partido desde su reserva.

## Decisiones para la implementación del servidor

- Definir la regla exacta de puntos: relación entre tanteo del partido, resultados por pareja y puntos individuales del ranking.
- Definir el inicio y cierre de semana en la zona horaria del club (America/Cancun).
- Asociar participantes a identificadores estables, incluso si hay invitados, para no sumar por nombres que pueden repetirse.
- Vincular cada resultado a una reserva y comprobar que quien lo registra sea su titular.
- Evitar sumar el mismo resultado dos veces; al corregir un partido, recalcular sus aportes.
- Definir si los resultados requieren confirmación de otros participantes o del club, y cómo se resuelven empates.

Estas reglas están pendientes de definición y desarrollo; la entrega actual se limita a la landing.
