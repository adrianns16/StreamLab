# StreamLab

Herramientas musicales en español para GitHub Pages: generador de datos simulados y calculadora local de historiales JSON/ZIP. No requiere cuenta, servidor ni claves de Spotify.

## Generador

1. Busca un artista, elige un álbum y añade canciones, o pega un enlace de Spotify.
2. En cada canción, pulsa **Añadir enlace** o **Revisar / enlace**. Pega el enlace de la canción exacta y revisa título, artista, álbum y duración. Las coincidencias de iTunes requieren confirmación; no prueban que sea la misma grabación.
3. Indica una cantidad por canción o activa **Repartir un total entre todas**. Por ejemplo, 100 registros entre tres canciones produce 34, 33 y 33.
4. Selecciona el período, revisa los avisos y escribe el nombre del archivo. Puedes ver los primeros tres registros antes de descargar.

Se admiten hasta 30.000 registros y 500 canciones por selección. La validación exige identificadores de canciones, cantidades y duraciones enteras, fechas pasadas y espacio suficiente en el período para evitar superposiciones. El formulario usa la zona horaria del dispositivo; la salida usa UTC. El tamaño estimado corresponde a un JSON compacto.

El planificador muestra los días mínimos de escucha continua y recomienda los días necesarios según las horas diarias elegidas (8 por defecto). El botón **Usar plazo recomendado** coloca el final ahora y ajusta el inicio hacia atrás. Es una estimación matemática, no una garantía de aceptación. Las canciones se intercalan en el JSON para distribuir sus repeticiones a lo largo del período.

La selección solo existe durante la visita actual. Recargar o volver a entrar inicia el generador vacío y elimina los borradores guardados por versiones anteriores. **Vaciar** borra la selección en pantalla y **Deshacer** recupera la última selección quitada mientras sigas en la misma página. No se almacenan los historiales de la calculadora.

## Enlaces desde tu historial

En «Mi historial» carga JSON o ZIP del historial extendido de Spotify. StreamLab agrupa las reproducciones por canción, álbum y artista con su `spotify_track_uri` exacto. Puedes elegir un álbum y añadir sus canciones con esas URI, o pegar su enlace para buscar coincidencias exactas de título y artista dentro del historial. No se elige automáticamente una versión diferente del mismo tema: cada URI distinta se muestra por separado. Las duraciones se estiman con la duración reproducida más frecuente (se ignoran fragmentos de menos de 30 segundos); revisa y corrige cada duración antes de exportar. El archivo se procesa en el navegador y no se conserva después de cerrar o recargar. Los álbumes no incluidos en el historial requieren enlaces de canciones o acceso autorizado al catálogo de Spotify.

Límites: 50 MB por archivo, 100 MB totales descomprimidos, 100 archivos, un millón de reproducciones y 100.000 canciones diferentes.

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

Las búsquedas hacen solicitudes a iTunes y Spotify oEmbed. Los archivos cargados se procesan en el dispositivo. La aplicación es independiente de Spotify, Apple y stats.fm.
