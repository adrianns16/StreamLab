# StreamLab

Web estática en español: busca artista → álbum → canciones, añade varias canciones, calcula reproducciones y minutos, descarga un JSON simulado y analiza JSON/ZIP locales con ocho indicadores y promedios diarios.

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub y sube todos estos archivos a la raíz: `index.html`, `styles.css`, `app.js`, `spotify-config.js` y `spotify-auth.js`.
2. Ve a **Settings → Pages → Build and deployment**; selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)**. Guarda.
3. La dirección quedará como `https://TU_USUARIO.github.io/NOMBRE_DEL_REPOSITORIO/`.

## Conectar la búsqueda automática de Spotify

Esta función necesita una aplicación registrada en [Spotify for Developers](https://developer.spotify.com/dashboard). En ella, registra como **Redirect URI** la dirección exacta del paso 3, incluida la barra final `/`. Copia su **Client ID** (es un identificador público, nunca el Client Secret) entre las comillas de `spotify-config.js` y vuelve a subir el archivo al repositorio. El botón «Conectar Spotify» solicitará autorización mediante el sitio oficial de Spotify. Una vez conectado, el generador busca cada canción elegida y añade automáticamente su URI **solo si hay una coincidencia única de título, artista y duración**, dando prioridad al álbum. Si hay varias versiones o la búsqueda no encuentra una coincidencia clara, usa «Enlace» junto a la canción para pegar su enlace exacto. Un álbum entero puede tardar mientras se buscan las URI de sus canciones.

La búsqueda inicial de artistas y álbumes utiliza el catálogo público de iTunes. Ese catálogo no tiene los identificadores de Spotify. Sin configurar Spotify, la búsqueda y calculadora siguen funcionando, y los enlaces se introducen manualmente.

## Datos y límites

El generador produce datos ficticios. No garantiza que stats.fm acepte el archivo o muestre la misma cifra. Para importar datos reales, solicita el historial extendido a Spotify y sigue la [guía oficial de stats.fm](https://support.stats.fm/es-ES/docs/import/spotify-import/), que requiere stats.fm Plus. El historial JSON/ZIP se calcula en tu navegador sin subir el archivo a un servidor; las búsquedas de música sí consultan iTunes o Spotify. Por seguridad, el analizador limita cada archivo a 50 MB. El promedio diario divide por todos los días entre el primer y último registro válido.
