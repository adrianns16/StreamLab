# StreamLab

Web estática en español: busca artista → álbum → canciones, añade varias canciones, pega enlaces de Spotify, calcula reproducciones y minutos de ejemplo, descarga un JSON simulado y analiza archivos originales JSON o ZIP de Spotify sin enviarlos a un servidor.

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub.
2. Sube `index.html`, `styles.css` y `app.js` a la raíz, conservando los nombres.
3. Abre **Settings → Pages → Build and deployment**; selecciona **Deploy from a branch**, rama **main** y carpeta **/(root)**. Guarda.
4. La dirección será `https://TU_USUARIO.github.io/NOMBRE_DEL_REPOSITORIO/`.

No hace falta compilar. Abre `index.html` en el navegador para probar la interfaz. La búsqueda utiliza la API pública de iTunes; necesita internet y su catálogo puede diferir del de Spotify. Los enlaces de Spotify usan los metadatos oEmbed cuando el navegador permite consultarlos. Si el navegador o Spotify bloquean una consulta, se pueden introducir los datos manualmente. El catálogo no proporciona las URI de Spotify para canciones buscadas: pega el enlace de cada canción para asociarlo. Los enlaces de álbum de Spotify no proporcionan automáticamente todas las URI de sus canciones.

El generador produce datos ficticios. Una estimación no garantiza aceptación o cifras idénticas en stats.fm. Para importar datos reales, solicita el historial extendido a Spotify y sigue la [guía oficial de stats.fm](https://support.stats.fm/es-ES/docs/import/spotify-import/), que requiere stats.fm Plus.

La calculadora lee JSON o ZIP localmente y cuenta registros de canciones con `ms_played`; stats.fm puede filtrar algunos registros. Por seguridad, limita cada archivo a 50 MB.
