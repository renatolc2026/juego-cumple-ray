# ANCESTRAL · Showreel de lanzamiento en Utah — Decisiones

**Entregable:** `ANCESTRAL_Showreel_Utah_1080p60.mp4` (más `storyboard.jpg`, 8 cuadros clave) — 20,0 s · 1920×1080 · 60 fps (1200 cuadros) · H.264 High · AAC 320 kbps estéreo 48 kHz · en inglés.
**Versión 2 — ajustada al *Manual de Identidad de Marca* (Edición 01 · 2026).** La sección 2 lista cada regla del manual y qué cambió en el video.
**Todo es código:** ningún modelo de generación de imagen, video ni audio, y ningún sample. Cada píxel sale de `src/scene.js` (Canvas 2D) y cada sonido de `src/music.py` (osciladores, ruido y modelos físicos).

---

## 1. La idea: un solo hilo

El encargo era demostrar cómo se va haciendo el tejido andino. Decidí no hacer un catálogo de efectos, sino **contar el proceso real en su orden real con un solo hilo como protagonista**, sin cortes duros: cada transición es una acción del propio hilo. El oficio de motion design está en que el espectador nunca vea un corte, sino un hilo que se transforma.

| Tiempo | Capítulo | Qué pasa en pantalla | Texto (EN) |
|---|---|---|---|
| 0,0–2,5 s | Intro | Un hilo de oro se dibuja bajo el cielo andino y la cámara **entra en el hilo** | *Some threads carry centuries.* |
| 2,5–5,0 s | 01 · FIBER | El zoom revela que el hilo está hecho de fibras: 360 fibras de alpaca flotan como nube (ruido de Perlin) | *Sacred alpaca fiber* |
| 5,0–7,5 s | 02 · SPIN | La nube sube y las fibras se estiran y tuercen hacia una **pushka** (huso andino) que gira con su piruro | *Spun by hand, twist by twist* |
| 7,0–10,0 s | 03 · DYE | **Giro de cámara de 90° en 1,2 s**: el hilo vertical queda horizontal. Cae una gota de cochinilla y el rojo corre por el hilo, que vibra con física amortiguada | *Cochineal, the red of the Inca* |
| 10,0–12,5 s | 04 · WARP | El hilo sube y sale de cuadro mientras **48 hilos de urdimbre caen en cascada** desde el centro; la vara de lizos alterna la calada a cada corchea | *Strung on the backstrap loom* |
| 12,5–15,3 s | 05 · WEAVE | Zoom al inicio del tejido: lanzadera, trama y golpe del *wichuña*; el tejido acelera mientras la cámara se aleja y revela el diseño completo | *Woven in Cusco, closer to the sky* |
| 15,3–17,5 s | Apus | **La franja de montañas del textil se desprende como línea de oro y se convierte en la cordillera**; delante sube la silueta en Noche Andina | *From the Andes to Utah.* |
| 17,5–20,0 s | Firma | La cámara sube al cielo: se encienden la **Cruz del Sur** y las **Pléyades** en oro, la **Chakana** oficial se dibuja y entra la firma vertical con descriptor. Es la composición de la portada del manual | **A N C E S T R A L** · el hilo con rombo · *Legacy and mystique, woven by the Andes.* · NOW IN UTAH |

El textil tiene 48 × 52 puntadas y está diseñado celda por celda en código: franjas, el río (*mayu*) en zigzag, rombos escalonados con un rombo de cochinilla en el centro (eco del rombo del hilo del logotipo) y la franja de los *apus* arriba, que es la que se transforma en montaña.

## 2. Ajuste al manual de marca

La versión 1 se hizo con la ficha resumida de marca. Con el manual completo revisé cada regla contra el video; esto es lo que cambió:

| Regla del manual | Página | Antes (v1) | Ahora (v2) |
|---|---|---|---|
| Chakana en retícula 9×9, doble contorno, centro circular | 11, 18 | Cruz escalonada de otra proporción, sin punto central | Geometría oficial: contorno exterior escalonado de 8 módulos, interior a escala 0,6, círculo de 0,8 módulos y punto central. Trazo uniforme de 2,4 px |
| Firma: símbolo + versalitas + **el hilo** (línea fina con rombo central) | 11–12 | Sin el hilo | Firma vertical con descriptor: Chakana, A N C E S T R A L, el hilo con rombo y el descriptor en cursiva. Proporciones tomadas de la portada del manual |
| Versalitas Cormorant 500, tracking +420 | 22 | Tracking animado (de más abierto a más cerrado) | Tracking fijo de +420; las letras entran solo por fundido |
| No añadir sombras ni efectos | 16 | Resplandor (`shadowBlur`) y brillo que recorría la Chakana | Ningún efecto. La Chakana se dibuja con hilo de oro y queda quieta |
| La Chakana no se combina con otros iconos | 18 | Las estrellas de la Cruz del Sur quedaban dentro del símbolo | Las constelaciones van en el cielo, fuera del área de reserva |
| Una sola Chakana por pieza, nunca como patrón | 18 | Una Chakana en el textil y otra en el logo | El textil lleva un rombo escalonado de cochinilla; la Chakana aparece solo en la firma |
| Área de reserva de 2x (x = brazo de la Chakana) | 14 | Sin control | Con x = 40 px, nada entra a menos de 80 px del bloque de la firma. Moví las agujas de la cordillera hacia los bordes y llevé NOW IN UTAH al pie |
| El logotipo va en la zona de cielo | 17 | Cumplía | Igual, y ahora con la composición de la portada: cielo, constelaciones, cordillera de oro y silueta |
| Degradados: solo de Noche a Violeta; nunca con Oro, Cochinilla ni Crudo | 26 | Resplandores dorados (punta del hilo, lanzadera, urdimbre, golpe del *wichuña*), halo rojo en el teñido, barrido dorado sobre el textil y neblina crema | Eliminados todos. Los destellos ahora son puntos sólidos. Los únicos degradados son el cielo y el velo de legibilidad, ambos de Noche a Violeta |
| "Cielo andino": lineal vertical, Noche arriba y Violeta abajo | 26 | El violeta apenas llegaba a la base | El degradado llega al Violeta Crepúsculo en la base |
| Grano del 3–5 % y viñeteado suave | 26–27 | Viñeteado del 78 % y grano ≈2,8 % | Viñeteado del 50 % y grano ≈3,3 %, medido sobre el cuadro final |
| Constelaciones: estrellas sutiles unidas por líneas | 27 | Estrellas sueltas en oro y en crudo | Estrellas sueltas solo en Crudo; el Oro queda para las constelaciones (puntos y líneas) |
| Montañas: línea fina de oro y silueta en Noche | 1, 4, 35 | Línea con relleno violeta, neblina y cordillera trasera | Línea de oro de tramos rectos con la silueta sólida en Noche Andina delante |
| Cursiva mágica: una sola palabra o expresión por frase | 22–23 | En Crudo | En **Oro Inca** sobre fondo oscuro, como en la jerarquía tipográfica del manual (*Some threads carry centuries*) |
| Etiquetas: Jost 400, mayúsculas, tracking +300 | 23 | Jost 300 con tracking variable, debajo del titular | Jost 400 con tracking +300 en Oro, encima del titular, como "CAPÍTULO 01" |
| Voz "Serena": sin urgencias ni cuentas regresivas | 8 | Contador "PASS 017 / 052" | Eliminado; menos palabras y más aire |
| Motion: fundidos, hilos dorados que se dibujan, Chakana como cierre | 31 | Transiciones de latigazo (0,3 s) | Giro de 90° en 1,2 s con un ángulo continuo entre escenas y salida del hilo teñido en 0,55 s. Los textos y la firma entran por fundido |

**Lo que ya cumplía y se mantiene:**
- paleta cerrada de cinco colores;
- Cochinilla como único acento (el hilo teñido y lo que teje);
- Oro solo en líneas;
- Cormorant y Jost;
- titulares de 12 palabras o menos, sin exclamaciones ni palabras vetadas;
- la línea del manual *Some threads carry centuries* y el tagline oficial de EE. UU.;
- fibra visible;
- música de quena.

**Conflictos que quedan abiertos (decide la marca):**
- **Duración:** el manual pide 6–15 s para motion y el brief, 20 s. Mantuve 20 s porque lo pediste explícitamente. Si se necesita una versión para redes dentro del manual, el cierre de 17,5–20 s más el tejido de 10–15 s dan un corte natural de unos 10 s.
- **"Dinámico" frente a "ritmo lento":** mantuve un capítulo por compás porque es lo que cuenta el proceso, pero suavicé todas las transiciones.
- **Mercado:** el manual nombra Nueva York, Toronto, Vancouver y Montreal; Utah no figura. Seguí el brief (lanzamiento en Utah). En Utah no aplica la versión FR.
- **Proporción 50/28/14/5/3:** el video es más oscuro que la proporción del manual (casi no hay fondos crudos). El manual también dice "Predomina siempre Noche Andina o Alpaca Crudo", y la pieza vive del cielo nocturno.
- **Respeto cultural (2.8):** el manual pide que cualquier uso de la Chakana fuera de la firma lo valide dirección de marca y los colectivos de tejedoras. Aquí solo aparece la firma, pero recomiendo que la validen igual antes de publicar.

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
  - cada estrella de la Cruz del Sur y de las Pléyades suena al encenderse, paneada a su lado del cuadro;
  - el logo cae con el golpe grave en el tiempo 28 (17,5 s).
- **Máster:** −15,9 LUFS integrados y pico real de −1,0 dBFS (medido en el MP4 final). Limitador suave con `tanh` y fundido de 0,45 s al final.

## 4. Decisiones técnicas

- **Canvas 2D en Chromium headless (Playwright):** antialiasing de calidad, tipografía real con kerning, desenfoques y modos de fusión, y render determinista por tiempo. Cuatro procesos en paralelo: 1200 cuadros en unos 4,3 min.
- **Desenfoque de movimiento real** por acumulación de sub-cuadros (obturador de 360°, de 3 a 8 muestras) solo en los tramos de movimiento: zoom dentro del hilo, giro de 90°, salida del hilo teñido, acercamiento y alejamiento del telar.
- **Textil pre-renderizado a 3×** (2160×2340 px) y revelado por recortes: dos `drawImage` por cuadro, nítido incluso con la cámara a 2,5×.
- **Grano a 30 Hz** (cambia cada dos cuadros), como en película. Además de verse más analógico, reduce mucho la tasa de bits.
- **Codificación H.264 en dos pasadas a 18 Mbps** (por encima de los 12 Mbps que YouTube recomienda para 1080p60), BT.709 y `faststart`: 45,1 MB.

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
8. **Verificación factual:** eliminé "13,000 FT" del HUD y rendericé la versión 1.
9. **Versión 2: ajuste al manual de marca.** Leí las 35 páginas y apliqué los cambios de la sección 2. En la prueba de 15 cuadros:
   - apareció un hueco vacío de ≈0,2 s entre el teñido y la urdimbre; lo cerré solapando la salida del hilo con la caída de la urdimbre;
   - la aguja derecha de la cordillera invadía el área de reserva de la firma; moví las agujas hacia los bordes;
   - "NOW IN UTAH" quedaba fuera del margen seguro de título; lo subí y lo asenté sobre la silueta.
   Después medí el grano y lo llevé a ≈3,3 %, ajusté la música a los nuevos tiempos (una nota por estrella, giro más largo) y rendericé la versión final.

## 7. Tiempo total

- **Versión 1:** unos 50 minutos, de 12:43 a 13:33 UTC del 21-10-2026. Preparación del entorno y fuentes (≈5 min), código de imagen (≈15 min), cinco rondas de revisión visual (≈12 min), música (≈8 min), y renders y codificación (≈10 min, en parte en paralelo con la escritura).
- **Versión 2 (manual de marca):** unos 18 minutos, de 13:59 a ≈14:17 UTC. Lectura del manual (≈5 min), cambios de código (≈12 min), dos rondas de revisión (≈5 min) y render final.
- **Total:** unos 68 minutos de trabajo. Fueron tres renders completos de 1200 cuadros, uno más interrumpido, y unos 50 cuadros sueltos de prueba.

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
