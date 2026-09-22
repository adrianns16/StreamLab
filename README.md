# StreamLab

Sitio estático con páginas independientes: Inicio, Generador, Calculadora y Ayuda.

## Publicar en GitHub Pages

1. Sube **todos los archivos** de esta carpeta a la raíz de tu repositorio GitHub, incluido `spotify-config.js`.
2. Ve a **Settings → Pages → Build and deployment** y selecciona **Deploy from a branch**, rama `main`, carpeta `/(root)`.
3. Abre `https://TU_USUARIO.github.io/TU_REPOSITORIO/`. El proyecto contiene el Client ID público que compartiste. No incluye ningún Client Secret.
4. En tu aplicación de Spotify for Developers registra exactamente esa URL principal como **Redirect URI**: `https://TU_USUARIO.github.io/TU_REPOSITORIO/`, con la barra `/` al final. Esa es la URL a la que vuelve el botón «Conectar Spotify», incluso al pulsarlo desde `generator.html`.

Si aparece «Conecta Spotify» en el Generador, la configuración se ha cargado. Si persiste el mensaje anterior, comprueba que `spotify-config.js` nuevo está en el repositorio y recarga la página sin caché. Spotify puede limitar el acceso a una app en modo desarrollo a sus usuarios autorizados.

## Uso

- **Generador:** busca artista → álbum → canción; con Spotify conectado intenta completar la URI de la canción al añadirla. Solo acepta coincidencias únicas del mismo título, artista, álbum y duración. Si no hay coincidencia segura, pega la URL exacta mediante el botón «Enlace». También puedes pegar directamente una URL de canción o álbum en «Pegar enlace»; la canción muestra un formulario para revisar los datos antes de añadirla.
- **Calculadora:** analiza JSON o ZIP de historial musical localmente en tu dispositivo. Muestra reproducciones, canciones, artistas, álbumes, minutos, horas, días y promedios.
- Sin conexión el buscador utiliza iTunes; conectado consulta Spotify. Los archivos elegidos en la Calculadora se procesan localmente; las búsquedas sí consultan iTunes o Spotify.

Puedes elegir el nombre del JSON descargado en el campo «Nombre del archivo». El generador produce datos ficticios y no garantiza su aceptación en stats.fm. Para importar historial auténtico, solicita el historial extendido a Spotify y sigue la [guía oficial de stats.fm](https://support.stats.fm/es-ES/docs/import/spotify-import/). La calculadora puede diferir de stats.fm porque este filtra determinados registros.

## Si aparece error 403

Spotify permite iniciar sesión incluso a usuarios a los que no permite consultar la API. En Spotify for Developers comprueba que el usuario esté en **Settings → Users Management** y que el propietario de la aplicación tenga **Spotify Premium activo**. La página utiliza el catálogo alternativo de iTunes mientras tanto. Sin acceso a la API, no puede determinar automáticamente las URI exactas de canciones de iTunes; pega los enlaces en el botón «Enlace».
