# Activar la votación compartida

La API está preparada, pero no está desplegada. El conector de esta sesión no permite crear ni publicar proyectos de Apps Script. No hay una URL de API hasta completar esta activación.

1. Abre la hoja Peliculas Halloween y selecciona **Extensiones → Apps Script**.
2. Sustituye el contenido de `Código.gs` por el archivo `Code.gs` de esta carpeta.
3. Crea un archivo **HTML** llamado `Vote` y pega el contenido de `Vote.html`.
4. Guarda y ejecuta **configurar** desde el editor. Autoriza el acceso a la hoja. La ventana de Sheets mostrará la clave privada del organizador: guárdala; nunca la pegues en GitHub ni en el chat.
5. En **Implementar → Nueva implementación → Aplicación web**, elige **Ejecutar como: tú** y **Quién tiene acceso: cualquier persona**. La hoja no necesita hacerse pública. Si tu organización no permite esta opción, el despliegue requiere adaptar el acceso.
6. Copia la URL que termina en `/exec` y colócala en `voting-config.js`, en `webAppUrl`, o compártela en el chat para que se configure el sitio.
7. Añade las películas en **Peliculas, columna A, desde A2**. Solo añade títulos; la API asigna IDs, cuenta votos y actualiza estados. No borres ni reutilices los IDs asignados.
8. Los nombres se registran automáticamente en **Usuario** al entrar por primera vez. También puedes precargar nombres en A2:A. No edites las columnas de acceso.

## Reglas

- Cada nombre normalizado tiene un voto por ronda: mayúsculas y espacios extra no generan otro usuario.
- En el primer acceso basta el nombre. Se genera un código privado para recuperar ese mismo usuario en otro dispositivo. Un nombre por sí solo no verifica la identidad de una persona; este esquema está pensado para el grupo familiar.
- Los votos se guardan en **Votos**. Se suman por película y ronda en el servidor, no en el navegador.
- **Peliculas B** muestra votos de la ronda actual para las candidatas y votos ganadores para las seleccionadas. D muestra su estado.
- El liderazgo es provisional hasta cerrar. Con cero votos o empate no se puede cerrar.
- El organizador introduce su clave y pulsa **Guardar ganadora y abrir siguiente ronda**. Se archiva película, total, fecha y resultados de toda la ronda en **Seleccionados**. La ganadora queda excluida permanentemente de las siguientes rondas; las demás comienzan con cero votos en una ronda nueva.
- Los votos anteriores nunca se borran. La ronda se deriva del histórico, y el servidor usa un bloqueo para serializar los votos y cierres concurrentes. Los reintentos de un voto no lo duplican y un cierre repetido no crea otra selección.
- Si todos ya votaron y hay empate, la ronda permanece abierta. Hay que acordar una regla de desempate antes de añadir una acción adicional; no se elige arbitrariamente una ganadora.
- El iframe se comunica con Apps Script mediante `google.script.run`, sin exponer claves del servidor ni depender de CORS de GitHub Pages. Existe también `doPost` para clientes de servidor; las operaciones requieren el código de usuario y el cierre además la clave del organizador.

## Comprobación después de desplegar

Usa dos nombres de prueba y dos películas temporales antes de la votación real. Comprueba duplicados, recarga, otro dispositivo con el mismo código, empate y rechazo del cierre sin clave. Para evitar contaminar la hoja real, esta prueba debe realizarse en una copia del libro y un proyecto de Apps Script separado con su BOOK_ID cambiado. Los tests automatizados del repositorio usan solo datos en memoria.

Documentación oficial: https://developers.google.com/apps-script/guides/web y https://developers.google.com/apps-script/guides/html/communication
