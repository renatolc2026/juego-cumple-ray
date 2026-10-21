# ANCESTRAL · Showreel de lanzamiento en Utah — Decisiones

**Entregable:** `ANCESTRAL_Showreel_Utah_1080p60.mp4` (más `storyboard.jpg`, 8 cuadros clave) — 20,0 s · 1920×1080 · 60 fps (1200 cuadros) · H.264 High · AAC 320 kbps estéreo 48 kHz · en inglés.
**Todo es código:** ningún modelo de generación de imagen, video ni audio, y ningún sample. Cada píxel sale de `src/scene.js` (Canvas 2D) y cada sonido de `src/music.py` (osciladores, ruido y modelos físicos).

---

## 1. La idea: un solo hilo

El encargo era demostrar cómo se va haciendo el tejido andino. Decidí no hacer un catálogo de efectos, sino **contar el proceso real en su orden real con un solo hilo como protagonista**, sin cortes duros: cada transición es una acción del propio hilo. El oficio de motion design está en que el espectador nunca vea un corte, sino un hilo que se transforma.

| Tiempo | Capítulo | Qué pasa en pantalla | Texto (EN) |
|---|---|---|---|
| 0,0–2,5 s | Intro | Un hilo de oro se dibuja bajo el cielo andino y la cámara **entra en el hilo** | *Some threads carry centuries.* |
| 2,5–5,0 s | 01 · FIBER | El zoom revela que el hilo está hecho de fibras: 360 fibras de alpaca flotan como nube (ruido de Perlin) | *Sacred alpaca fiber* |
| 5,0–7,5 s | 02 · SPIN | La nube sube y las fibras se estiran y tuercen hacia una **pushka** (huso andino) que gira con su piruro | *Spun by hand, twist by twist* |
| 7,5–10,0 s | 03 · DYE | **Giro de cámara de 90°**: el hilo vertical queda horizontal. Cae una gota de cochinilla y el rojo corre por el hilo, que vibra con física amortiguada | *Cochineal, the red of the Inca* |
| 10,0–12,5 s | 04 · WARP | El hilo sale de cuadro de un latigazo y **48 hilos de urdimbre caen en cascada** desde el centro; la vara de lizos alterna la calada a cada corchea | *Strung on the backstrap loom* |
| 12,5–15,3 s | 05 · WEAVE | Zoom al inicio del tejido: lanzadera, trama y golpe del *wichuña*; el tejido acelera mientras la cámara se aleja y revela el diseño completo | *Woven in Cusco, closer to the sky* |
| 15,3–17,5 s | Apus | **La franja de montañas del textil se desprende como línea de oro y se convierte en la cordillera** | *From the Andes to Utah.* |
| 17,5–20,0 s | Cierre | Se encienden las estrellas de la **Cruz del Sur** y la **Chakana** se dibuja a su alrededor; logotipo y tagline | **A N C E S T R A L** · *Legacy and mystique, woven by the Andes.* · NOW IN UTAH |

El textil tiene 48 × 52 puntadas y está diseñado celda por celda en código: franjas, el río (*mayu*) en zigzag, rombos escalonados, la Chakana en cochinilla en el centro y la franja de los *apus* arriba, que es la que se transforma en montaña.

## 2. Decisiones de marca (skill `ancestral-brand`)

- **Paleta:** solo los cinco HEX de marca, declarados como constantes en `scene.js`. Los únicos tonos intermedios son mezclas entre esos cinco (sombreado de puntadas, antialiasing).
- **Un solo acento de Cochinilla:** el rojo aparece únicamente como el hilo teñido y lo que ese hilo teje: la gota, el hilo y la Chakana del textil. Por eso el fondo del textil es Violeta Crepúsculo y no rojo, como sería lo tradicional.
- **Oro Inca solo en líneas finas:** hilos, urdimbre, vigas, cordillera, Chakana y filetes. Nunca en bloques.
- **Fondo:** degradado de Noche Andina a Violeta Crepúsculo (cielo al anochecer), con viñeteado y grano analógico.
- **Tipografía:** Cormorant Garamond para titulares (cursiva en la palabra mágica de cada frase: *centuries, Sacred, twist by twist, Cochineal, backstrap loom, sky, Utah*) y Jost con tracking amplio para etiquetas. Logotipo en mayúsculas con tracking que se cierra lentamente.
- **Copy:** todos los titulares tienen 12 palabras o menos, sin signos de exclamación ni superlativos. Voz de susurro. Tagline oficial de EE. UU. sin cambios.
- **Localización para EE. UU. / Utah:** inglés nativo, foco en artesanía y origen, y "NOW IN UTAH" como único mensaje de lanzamiento. Utah también es tierra de montañas, así que el puente narrativo es la cordillera: *From the Andes to Utah.*
- **Textura de fibra siempre visible:** fibras sueltas, pelusa en el hilo teñido, puntadas con fibras dibujadas.
- **Cierre con la Chakana,** como pide la sección de motion. Relacioné la Chakana con la Cruz del Sur, la constelación de la que proviene según la cosmovisión andina; así el cielo de la marca deja de ser decorativo.

## 3. Música (sintetizada desde cero)

- **Tempo 96 BPM:** 8 compases de 4/4 duran exactamente 20,0 s, así que cada capítulo dura un compás (2,5 s) y los cortes caen en tiempos fuertes. `scene.js` y `music.py` comparten el mismo reloj.
- **Quena:** síntesis aditiva (fundamental y armónicos 2–4), ruido de soplo filtrado en banda alrededor de la nota, "chiff" de ataque, entrada ligeramente baja de afinación, vibrato que aparece tarde y apoyaturas. Melodía en La menor pentatónica, con un **eco de montaña** a ¾ de pulso en tres rebotes paneados.
- **Charango:** Karplus-Strong en cuerdas dobles levemente desafinadas (los órdenes del charango), con resonancia de caja y voicings agudos. Rasgueo en ritmo de **huayno** (corchea + dos semicorcheas) durante el tejido.
- **Bombo legüero** (seno con caída de tono, baqueta y cuero), **aro** de madera y **chajchas** (nubes de micro-clics, como las pezuñas).
- **Ambiente:** viento estéreo decorrelacionado, dron La–Mi, pad por compás, campanas inarmónicas para los destellos dorados y reverb por convolución con una respuesta impulsiva sintética.
- **Sincronía cuadro a cuadro:**
  - los destellos del hilo del intro se panean siguiendo la punta del hilo, de izquierda a derecha;
  - la gota suena con un *plop* y una campana justo en el impacto (8,125 s);
  - **cada hilo de urdimbre que toca la viga dispara una nota del glissando de charango;**
  - la vara de lizos marca las corcheas;
  - el textil se completa en el tiempo fuerte del compás 7;
  - las cinco estrellas de la Cruz del Sur suenan una por una;
  - el logo cae con el golpe grave en el tiempo 28 (17,5 s).
- **Máster:** −15,5 LUFS integrados y pico real de −1,1 dBFS (medido en el MP4 final). Limitador suave con `tanh` y fundido de 0,45 s al final.

## 4. Decisiones técnicas

- **Canvas 2D en Chromium headless (Playwright):** antialiasing de calidad, tipografía real con kerning, desenfoques y modos de fusión, y render determinista por tiempo. Cuatro procesos en paralelo: 1200 cuadros en unos 4,3 min.
- **Desenfoque de movimiento real** por acumulación de sub-cuadros (obturador de 360°, de 3 a 8 muestras) solo en los tramos rápidos: zoom dentro del hilo, giro de 90°, latigazo, acercamiento y alejamiento del telar.
- **Textil pre-renderizado a 3×** (2160×2340 px) y revelado por recortes: dos `drawImage` por cuadro, nítido incluso con la cámara a 2,5×.
- **Grano a 30 Hz** (cambia cada dos cuadros), como en película. Además de verse más analógico, reduce mucho la tasa de bits.
- **Codificación H.264 en dos pasadas a 18 Mbps** (por encima de los 12 Mbps que YouTube recomienda para 1080p60), BT.709 y `faststart`: 45,6 MB.

## 5. Qué descarté y por qué

- **Python + PIL / numpy para la imagen:** el antialiasing de líneas finas es pobre, y esta pieza vive de hilos de 1 px.
- **WebGL / 3D:** más espectacular en teoría, pero el lujo silencioso de la marca pide línea fina y aire, no partículas 3D. El riesgo técnico no compensaba.
- **Voz en off:** exigiría TTS, que es audio generativo y está fuera del encargo. La historia se cuenta con imagen y rótulos.
- **Fondo rojo para el textil** (lo más tradicional): rompía la regla de un solo acento de Cochinilla.
- **Mencionar Nueva York, Toronto, etc.** (ciudades de la ficha de marca): el lanzamiento es en Utah.
- **Morph de la cordillera de los Andes a la de Wasatch:** a la velocidad de la pieza no se lee. El texto *From the Andes to Utah* cumple mejor esa función.
- **Contador de "horas de trabajo" y "13,000 FT" en el HUD:** no puedo verificar las horas, y la ciudad de Cusco está a unos 3 400 m (≈11 150 ft), no a 13 000 ft. En un anuncio para EE. UU. no publico datos dudosos. Quedaron las coordenadas reales de Cusco y la altura solo como poesía (*closer to the sky*).
- **Duración de 6–15 s de la guía de motion:** el brief pedía 20 s y prevaleció el brief. Compensé con ritmo: un capítulo por compás.
- **CRF 16 con `-tune grain`:** daba 262 MB para 20 s. Lo reemplacé por dos pasadas con tasa objetivo.

## 6. Iteraciones

1. **Guion y reloj:** storyboard de 8 capítulos sobre 96 BPM; cada evento visual tiene un tiempo musical.
2. **Prueba 1 (22 cuadros sueltos):** todo renderizaba, pero el textil parecía de **cuentas** (puntadas redondas con huecos grises), la cordillera era plana, el rótulo de la urdimbre chocaba con los hilos y el logo quedaba pequeño. Cambié la puntada a dos flotes en "V", levanté la cordillera, desplacé la cámara del telar y agrandé el cierre.
3. **Prueba 2:** cada fila nueva tapaba la de abajo y las puntadas quedaban como **arcos**. La cordillera parecía un **gráfico bursátil** y el rótulo 05 seguía encima del textil.
4. **Prueba 3:** recorté cada puntada a su celda y rehíce la cordillera como **máximo de picos triangulares** (apus afilados, con un pico principal). Llevé los rótulos 04 y 05 arriba, sobre la urdimbre vacía, y el HUD abajo. La Chakana del textil se veía redonda, así que la pasé a cruz escalonada pura.
5. **Render completo v1 y música v1:** revisé el movimiento con tiras de cuadros consecutivos en cada transición. El audio no lo puedo escuchar, así que lo validé con espectrograma, forma de onda, sonoridad por compás y pico real. Un supuesto tono parásito a 1,2 kHz resultó ser el parcial ×2,76 de la campana de la gota. Subí un poco la intro, que quedaba baja para altavoces de móvil.
6. **Peso del archivo:** 262 MB con CRF 16, y 76 MB con CRF 18. Pasé el grano a 30 Hz y la codificación a dos pasadas a 18 Mbps: 45,6 MB sin pérdida visible.
7. **Primer plano del tejido a 2,5×:** los flotes formaban "Λ" en vez de "V" porque la rotación de la elipse estaba invertida respecto a las fibras. Lo corregí.
8. **Verificación factual:** eliminé "13,000 FT" del HUD y rendericé la versión final.

## 7. Tiempo total

Unos **50 minutos** de reloj, de 12:43 a 13:33 UTC del 21-10-2026: preparación del entorno y fuentes (≈5 min), código de imagen (≈15 min), cinco rondas de revisión visual con correcciones (≈12 min), música (≈8 min), y renders y codificación (≈10 min, en parte en paralelo con la escritura). Fueron dos renders completos de 1200 cuadros, uno más interrumpido para corregir el HUD, y unos 30 cuadros sueltos de prueba.

## 8. Cómo reconstruirlo

```bash
cd ancestral-showreel/src
./build.sh /tmp/ancestral ../ANCESTRAL_Showreel_Utah_1080p60.mp4
# requiere: Node + Playwright con Chromium, Python 3 con numpy y scipy, ffmpeg
```

- `src/scene.js`: toda la animación; `renderFrame(t)` es determinista.
- `src/scene.html`: lienzo y carga de fuentes.
- `src/render.cjs`: renderiza los cuadros en paralelo con Chromium headless. Con `--times 1.5,8.2` saca cuadros sueltos para revisar.
- `src/music.py`: síntesis y mezcla de la banda sonora.
- `src/fonts/`: Cormorant Garamond y Jost (licencia SIL OFL, incluida).

**Pendiente de criterio humano:** no pude escuchar la mezcla. Conviene oírla con auriculares y en un parlante de móvil antes de publicar. Si algo no convence (nivel de la quena, peso del bombo), cada instrumento tiene su ganancia en `music.py` y el audio se regenera en unos 8 s, sin volver a renderizar la imagen.
