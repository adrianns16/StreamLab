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

## Enlaces con títulos repetidos

Spotify puede devolver solo el título mediante sus metadatos públicos. Al pegar un enlace, el formulario deja vacíos artista, álbum y duración y presenta posibles coincidencias del catálogo de iTunes. El usuario debe elegir la versión correcta o completar los datos mirando Spotify. No se asigna automáticamente la primera canción que comparta el título.

## Logo y favicon

El logo y los iconos están incrustados en los cuatro HTML; se muestran sin depender de la carpeta `assets`. Esta carpeta conserva las imágenes originales para reutilizarlas. Si la pestaña sigue mostrando el icono anterior, cierra y vuelve a abrir la pestaña o recarga sin caché.
