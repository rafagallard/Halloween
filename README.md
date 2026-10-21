# Entre dos mundos · Halloween

Panel familiar para el 25 de octubre de 2026.

## Publicación

GitHub Settings → Pages → Deploy from a branch → main → / (root).

## Cocina

Ingredientes compartidos con marcas bloqueadas; progreso de ingredientes hasta 50%, En preparación 75% y Listo 100%. Los avances se guardan en localStorage del mismo navegador, no se sincronizan entre dispositivos. Borrar el almacenamiento elimina este registro local. Las cantidades son las de compra total compartida, no cantidades individuales por receta.

## Votación compartida

Implementación preparada en `apps-script/Code.gs` y `apps-script/Vote.html`. **No está activa hasta publicar Apps Script y establecer su URL /exec en voting-config.js.** Consulta [los pasos de activación](apps-script/ACTIVAR.md).

- Nombre de usuario y código de recuperación para el acceso desde otro dispositivo.
- Un voto por nombre normalizado y ronda; guardado compartido en Google Sheets.
- Suma de votos por película; rechazo de votos duplicados y de rondas antiguas.
- Cierre con clave de organizador; una ganadora única y al menos un voto.
- Histórico permanente con fecha, ganadora y resultados completos.
- La ganadora se bloquea y se excluye; la siguiente ronda empieza en cero para las restantes.
- Sin desempate arbitrario: los empates impiden el cierre.

La hoja aún espera los títulos en Peliculas!A2:A. No se cargaron películas ni votos ficticios. Se mantienen las pestañas Peliculas, Seleccionados y Usuario, y se añadió Votos.

## Validación

Ejecutar `node tests/voting.test.cjs`. Pruebas en memoria: acceso, normalización de nombre, duplicados, suma en Sheets, empates, clave administrativa, comprobación de líder, cierre idempotente, exclusión de ganadoras, rondas nuevas, bloqueo concurrente e histórico.

Pruebas de integración real pendientes de la activación de Apps Script. No se verificó el render en navegador: el entorno no dispone de Chromium.

El contador termina a las 00:00 del 25 de octubre de 2026 en Ciudad de México; la hora concreta del evento no fue indicada.
