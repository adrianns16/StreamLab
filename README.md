# StreamLab

Herramientas musicales en español para GitHub Pages: generador de datos simulados y calculadora local de historiales JSON/ZIP. El generador funciona sin iniciar sesión; la calculadora procesa archivos localmente.

## Generador sin cuenta

1. Busca artista y álbum en un catálogo musical de referencia (iTunes), o pega el enlace de una canción de Spotify en «Tengo un enlace». No se requiere Spotify Premium ni autorización.
2. Añade las canciones a «Tu selección». Si proceden del buscador, pega en cada fila el enlace de la grabación exacta desde Spotify. Las coincidencias de iTunes **no son equivalencias verificadas** y nunca se inventa una URI de Spotify.
3. Indica reproducciones por canción o activa «Repartir un total»; por ejemplo, 100 entre tres canciones produce 34, 33 y 33. Elige fechas u horas diarias y usa el plazo recomendado. Revisa los avisos, previsualiza y descarga un JSON de ejemplo.

Un enlace de álbum solo permite buscar posibles coincidencias por título: sin la API de Spotify no se pueden obtener con seguridad las URI de sus canciones ni agregar automáticamente el álbum exacto. Los enlaces individuales permiten recuperar el título público con Spotify oEmbed, y el usuario verifica los demás datos. Si oEmbed falla, se pueden completar manualmente. El generador admite 500 canciones y 30.000 registros; valida enlaces, duraciones y el espacio en el período. La lista se guarda solo mientras esta pestaña permanezca abierta; al recargar, empieza vacía.

## Calculadora

Carga o arrastra uno o varios JSON/ZIP. Cuenta registros de canciones con título, artista y duración numérica no negativa. Muestra minutos, horas, canciones, artistas, álbumes y días activos UTC. Excluye opcionalmente duplicados identificados por canción, instante y duración; informa de registros omitidos, fechas/URI ausentes y duración cero. Los promedios usan días calendario UTC, incluidos los días sin registros, y no se muestran si hay fechas ausentes. Permite descargar un resumen JSON sin alterar el original.

Límites: 50 MB por archivo de entrada, 100 MB descomprimidos en total, 100 archivos seleccionados y un millón de registros por análisis. ZIP sin contraseña con métodos Store/Deflate; se comprueban tamaño y CRC y se limita la descompresión mientras ocurre. Si el navegador no admite Deflate, extrae los JSON primero.

**Los registros del archivo no equivalen a reproducciones aceptadas por stats.fm.** StreamLab no garantiza importación ni evita validaciones del servicio. El generador identifica sus datos como simulación; no altera el historial real de Spotify.

## Publicación

La raíz contiene `index.html`, `generator.html`, `calculator.html` y `help.html`. Configura GitHub Pages para publicar desde `main`, carpeta raíz. Logo y favicon están incrustados en los HTML. No se requiere compilación ni instalar paquetes.

## Desarrollo y verificación

- Servir localmente: `python3 -m http.server 8000`.
- Pruebas de datos/ZIP: `node --test tests/core.test.js` (Node.js 22 o posterior).
- `core.js`: distribución, validación, generación y agregación.
- `zip.js`: lectura local de ZIP con límites y CRC.
- `app.js`, `calculator.js`, `ui.js`: interacción y navegación accesible.

El generador usa búsquedas iTunes y metadatos públicos oEmbed de enlaces Spotify; la calculadora procesa los archivos en el dispositivo. La aplicación es independiente de Spotify y stats.fm.
