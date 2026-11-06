# EDU32 · La ruleta del cumple

Una web estática para los 32 de Edu: 15 versiones del cumpleañero, títulos personalizados y 73 pruebas. Sin backend, instalaciones, fuentes remotas, analítica ni dependencias.

## Jugar

Sirve esta carpeta con cualquier servidor estático. Por ejemplo, con Python 3:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000`. Para jugar desde el móvil, conecta ambos dispositivos a la misma wifi y abre `http://IP-LOCAL-DEL-ORDENADOR:8000`. El cortafuegos debe permitir ese puerto; algunas redes de invitados aíslan los dispositivos. Para detener el servidor, pulsa Ctrl+C.

También puedes publicar la carpeta en un alojamiento estático HTTPS. No se ha publicado automáticamente. Las fotos serán accesibles para quien tenga acceso al alojamiento: pide permiso antes de hacerlas públicas.

**No abras `index.html` con doble clic:** el navegador bloquea la lectura de `pruebas.txt` mediante `fetch` bajo `file://`.

## Cómo funciona

- Portada con «Empezar la fiesta», encabezado y dedicatoria para Edu. Vuelve el diseño morado, rosa y lima con tarjetas y botones redondeados.
- El juego mantiene dos fases: ruleta y «Girar»; al terminar, foto, frase graciosa, prueba y «Pasa el móvil».
- «Pasa el móvil» vuelve a la ruleta sin girarla: la siguiente persona pulsa «Girar».
- «Volver al inicio» lleva a la portada sin reiniciar las bolsas. Si había un giro pendiente, su resultado se descarta.
- Los 15 sectores numerados corresponden a las 15 fotos de `game.js`. El puntero termina en el sector de la foto mostrada.
- Fotos y pruebas salen de bolsas barajadas independientes: no se repiten hasta agotar cada bolsa, ni se repite el último elemento al empezar la siguiente.
- Recargar empieza una partida nueva. No se guardan datos personales ni partidas.
- Beber siempre es opcional, también con agua o refresco. Se puede pasar cualquier reto sin penalización. Se conservan las cinco pruebas originales.
- Respeta la preferencia del dispositivo de reducir movimiento. Controles nativos accesibles con teclado y avisos de estado para lectores de pantalla.

## Personalizar

Edita **`pruebas.txt`**, una prueba por línea. Las líneas vacías y duplicadas se ignoran. Recarga la página para recoger los cambios.

Las fotos y sus títulos están en **`game.js`**; los originales de **`img/`** no se modifican. Si cambia el número de fotos, adapta también los sectores del degradado de `.wheel` en **`styles.css`**. La aplicación está diseñada para las 15 fotos actuales.

- `index.html`: estructura y textos de la página.
- `styles.css`: diseño adaptable, ruleta y animaciones.
- `game.js`: catálogo, bolsas aleatorias y cálculo de giro.
- `app.js`: carga de pruebas, controles y presentación.

## Comprobaciones

Con Node.js 18 o superior, sin instalar paquetes:

```sh
node --check game.js
node --check app.js
node --test game.test.cjs
```

Los tests verifican rutas de las 15 fotos, ampliación de pruebas, bolsas sin repeticiones, correspondencia del puntero, estados de la interfaz y errores de carga con un DOM simulado. No sustituyen una prueba visual en navegador real.

Comprobación manual recomendada antes de la fiesta: abrir en Safari/Chrome móvil, girar, pasar el móvil y volver a girar; comprobar una foto vertical y otra horizontal, teclado y reducción de movimiento. Solo se muestra una pantalla cada vez; las fotos se muestran completas sin recortarlas.
