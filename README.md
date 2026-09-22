# StreamLab

Web estática en español: busca artista → álbum → canciones, añade varias canciones, calcula reproducciones y minutos, descarga un JSON simulado y analiza JSON/ZIP locales con ocho indicadores y promedios diarios.

La búsqueda inicial de artistas y álbumes utiliza el catálogo público de iTunes. Ese catálogo no tiene los identificadores de Spotify. Sin configurar Spotify, la búsqueda y calculadora siguen funcionando, y los enlaces se introducen manualmente.

## Datos y límites

El generador produce datos ficticios. No garantiza que stats.fm acepte el archivo o muestre la misma cifra. Para importar datos reales, solicita el historial extendido a Spotify y sigue la [guía oficial de stats.fm](https://support.stats.fm/es-ES/docs/import/spotify-import/), que requiere stats.fm Plus. El historial JSON/ZIP se calcula en tu navegador sin subir el archivo a un servidor; las búsquedas de música sí consultan iTunes o Spotify. Por seguridad, el analizador limita cada archivo a 50 MB. El promedio diario divide por todos los días entre el primer y último registro válido.
