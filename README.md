# StreamLab

Herramientas musicales en español para GitHub Pages: generador de datos simulados y calculadora local de historiales JSON/ZIP. El generador usa autorización de Spotify para buscar su catálogo; la calculadora procesa archivos localmente.

## Generador

1. Conecta Spotify, busca un artista y elige un álbum, o pega un enlace de canción o álbum. Las canciones llegan con URI y duración exactas de Spotify.
2. Elige las canciones concretas o **Agregar todo el álbum**. El enlace individual se puede revisar o corregir en cada fila. Si falla el acceso al catálogo, solo los enlaces de canción admiten datos manuales.
3. Indica una cantidad por canción o activa **Repartir un total entre todas**. Por ejemplo, 100 registros entre tres canciones produce 34, 33 y 33.
4. Selecciona el período, revisa los avisos y escribe el nombre del archivo. Puedes ver los primeros tres registros antes de descargar.

Se admiten hasta 30.000 registros y 500 canciones por selección. La validación exige identificadores de canciones, cantidades y duraciones enteras, fechas pasadas y espacio suficiente en el período para evitar superposiciones. El formulario usa la zona horaria del dispositivo; la salida usa UTC. El tamaño estimado corresponde a un JSON compacto.

El planificador muestra los días mínimos de escucha continua y recomienda los días necesarios según las horas diarias elegidas (8 por defecto). El botón **Usar plazo recomendado** coloca el final ahora y ajusta el inicio hacia atrás. Es una estimación matemática, no una garantía de aceptación. Las canciones se intercalan en el JSON para distribuir sus repeticiones a lo largo del período.

La selección solo existe durante la visita actual. Recargar o volver a entrar inicia el generador vacío y elimina los borradores guardados por versiones anteriores. **Vaciar** borra la selección en pantalla y **Deshacer** recupera la última selección quitada mientras sigas en la misma página. No se almacenan los historiales de la calculadora.

## Configuración de Spotify

Esta aplicación usa Authorization Code con PKCE en el navegador. `spotify-config.js` contiene solo el Client ID público `bfd5b6a4d343471ab0efad773249466f`; nunca incluyas el Client Secret. El token queda en `sessionStorage` (por pestaña) y la selección de canciones solo en memoria.

1. En [Spotify for Developers](https://developer.spotify.com/dashboard), abre la aplicación correspondiente a ese Client ID. En **Settings → Redirect URIs** agrega exactamente `https://adrianns16.github.io/StreamLab/generator.html` y guarda. Si usas otro dominio o una ruta de Pages diferente, registra también esa URL exacta. Para pruebas locales, Spotify admite `http://127.0.0.1:8000/generator.html`, siempre que se registre exactamente; `localhost` no es válido.
2. Mientras la app esté en modo de desarrollo, la cuenta propietaria debe tener Spotify Premium y en **Settings → Users Management** debes agregar el correo de la cuenta con la que te conectarás (hasta cinco usuarios). Si autorizar funciona pero la API devuelve 403, confirma que esa misma cuenta está agregada y que la propietaria mantiene Premium. Pulsa **Desconectar** y **Conectar / cambiar cuenta** para repetir el inicio de sesión.
3. El Generador muestra «Conectado» solo después de consultar perfil y búsqueda del catálogo. Selecciona un artista y álbum o pega un enlace directo de álbum. Carga las pistas paginadas, conservando el `spotify:track:…` y la duración del álbum exacto. Si Spotify no concede acceso, la introducción manual de un enlace individual sigue disponible.

El modo de desarrollo no sirve un catálogo público abierto a cuentas arbitrarias: para eso necesitas la aprobación correspondiente de Spotify. El código del navegador no puede sortear las restricciones de una app ni guardar de forma segura un Client Secret.

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

El generador hace solicitudes a Spotify Web API y la calculadora procesa los archivos en el dispositivo. La aplicación es independiente de Spotify y stats.fm.
