# Ranking semanal de HEAT

## Landing

La sección pública conserva los cinco jugadores ficticios por deporte autorizados, con podio, fotografías ilustrativas y enlaces de contacto. Los datos están en `src/data/rankings.js`; la aclaración se muestra fuera de la tabla.

## Dashboard conectado

`DashboardRanking` consulta `/api/rankings` con sesión. Comparte el componente `Leaderboard`, pero utiliza exclusivamente resultados persistidos. Muestra posición, puntos, partidos y victorias del usuario, incluso fuera del top 100. Una cuenta sin torneos finalizados en la semana figura sin clasificar.

Los torneos americanos generan parejas rotativas y permiten registrar marcadores al organizador. Cada integrante recibe los puntos de su pareja. Los participantes se vinculan por email a una cuenta estable; los invitados sin cuenta solo puntúan dentro del torneo. Finalizar exige todos los partidos, bloquea cambios y registra el resultado una sola vez mediante actualización atómica por versión.

El ranking semanal suma torneos finalizados de lunes a domingo, en la zona `America/Cancun`, usando la semana en que se cierran. Se separan pádel y pickleball. Desempate semanal por victorias; si persiste se comparte puesto. La tabla del torneo utiliza también diferencia de puntos. No se incorporan invitados al ranking semanal por coincidencia de nombre.

## Siguiente etapa: resultados desde reservas

Sigue pendiente la carga de resultados de partidos normales desde una reserva: el titular identifica participantes y registra el marcador; los resultados se vincularán a la reserva para no duplicarlos. También quedan pendientes la validación por rivales o por el club, límites de competición y revisión administrativa. Actualmente el organizador del americano declara los resultados; crear un torneo no bloquea horarios ni reserva canchas.
