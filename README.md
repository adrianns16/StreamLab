# StreamLab

Sitio estático en español con páginas independientes para Inicio, Generador, Calculadora y Ayuda.

## Publicar en GitHub Pages

1. Sube `index.html`, `generator.html`, `calculator.html`, `help.html`, `styles.css`, `app.js` y `calculator.js` a la raíz del repositorio. Reemplaza las versiones anteriores.
2. Elimina del repositorio los archivos antiguos `spotify-config.js`, `spotify-auth.js` y `auth-callback.js`; esta versión ya no los utiliza.
3. Ve a **Settings → Pages → Build and deployment** y selecciona **Deploy from a branch**, rama `main`, carpeta `/(root)`.
4. Abre `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

## Uso

El Generador busca artistas, álbumes y canciones en el catálogo público de iTunes. Tras elegir canciones, pega el enlace exacto de Spotify para cada una mediante «Enlace». También puedes pegar directamente un enlace de canción en «Pegar enlace». En Ayuda encontrarás los pasos para copiarlo en celular y computadora. Elige reproducciones y fechas, escribe el nombre del archivo y descarga el JSON.

La Calculadora analiza JSON/ZIP localmente en el navegador. El generador produce datos simulados y la importación o la cifra mostrada en stats.fm pueden variar. Para estadísticas auténticas, solicita a Spotify tu historial extendido y sigue la [guía oficial](https://support.stats.fm/es-ES/docs/import/spotify-import/).
