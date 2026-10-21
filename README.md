# Entre dos mundos · Halloween

Panel de preparativos para el 25 de octubre de 2026, basado en el diseño aprobado.

## Uso

Abre `index.html` en un navegador o publica el repositorio con GitHub Pages:

1. Settings → Pages.
2. Source: Deploy from a branch.
3. Branch: main; carpeta: / (root).
4. Guarda y espera a que GitHub indique la URL publicada.

## Funciones

- Portada con contador de días y horas, banner de cocina y avance por platillo.
- Ingredientes compartidos con marcas definitivas en la interfaz.
- Estados En preparación y Listo con avance de 75% y 100%.
- Fondo oscuro, tipografía gótica, letras marfil y barras doradas.
- Guardado automático en localStorage del navegador.
- Sección del maratón pendiente de la lista de películas del propietario.

## Alcance del guardado

Los registros permanecen al recargar en el mismo navegador y origen. No se sincronizan entre dispositivos. Borrar los datos del navegador elimina los registros. Los bloqueos son de interfaz, no un control de seguridad del servidor.

La votación de producción está pendiente de la cartelera y de conectar almacenamiento compartido con identificación de votantes. No se presentan películas ni votos ficticios como reales.

La cuenta regresiva termina al comenzar el 25 de octubre de 2026, en Ciudad de México; la hora concreta del evento no fue indicada.

Las cantidades mostradas son las de compra total compartida, no las cantidades de una receta individual. Los ingredientes opcionales no impiden avanzar.

## Validación

Se verificó la sintaxis JavaScript con Node. La inspección automatizada en navegador quedó pendiente porque este entorno no dispone del ejecutable de Chromium.
