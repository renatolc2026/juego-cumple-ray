# Ray y la Melodía Perdida 🎹🐶

RPG de aventura en pixel art, hecho como regalo de cumpleaños de Tato para Ray (1 de octubre).
Se juega en el navegador, en laptop (teclado) o en celular (táctil). Dura unos 15 a 20 minutos.

El diseño completo está en [`DISENO.md`](DISENO.md).

## Cómo se juega

| Acción | Laptop | Celular |
| --- | --- | --- |
| Moverse | Flechas o WASD | Cruceta en pantalla |
| Hablar / avanzar texto | Espacio o Enter | Botón A (o tocar la pantalla en los diálogos) |
| Lanzar la pelota a Hachi | X | Botón B |
| Menú (objetos, notas, pistas, mapa, volumen) | Esc | Botón ≡ arriba a la derecha |
| Minijuegos de ritmo | ← ↓ ↑ → | Tocar la columna de cada flecha |

- No se puede perder: si algo sale mal, se reintenta al instante.
- El juego se guarda solo al entrar a cada escena. En el título aparece **Continuar**.
- En celular, el sonido empieza al primer toque. Conviene jugar en horizontal.

## Recorrido

1. **Prólogo, casa de Sullana**: 5:00 a. m., la canción de papá y mamá se corta y la música desaparece. Micha, Shiro, Hachi, los tallarines, el mapa y la **Nota del Hogar**.
2. **El parque**: Hachi encuentra notas sueltas con la pelota. Primera aparición del Maestro del Silencio (y su bufanda del Barça).
3. **La iglesia**: el coro, minijuego de piano y la **Nota de la Fe**. En el jardín, la banca "HCJ" y la Bendición del Abuelo.
4. **El Salón del Sabor**: batalla de salsa contra Sharon, con paso especial estilo anime, y la **Nota del Sabor**.
5. **La Cueva del Código**: puzzle para ordenar el código del portal. Llegan César, Elbers y Martín con la **Nota de la Amistad**.
6. **La Torre del Silencio**: siete pisos con ascensor. Cada piso recupera su color. En el séptimo, batalla final en tres fases: piano, salsa y la pelota de Hachi.
7. **Final**: la revelación, la fiesta en casa con videollamada de Tato y Aurora, la canción completa, el mensaje final y los créditos.

## Probarlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (por ejemplo `http://localhost:5173`).

### Probarlo en tu celular

Con `npm run dev` la consola también muestra una dirección de red, por ejemplo `http://192.168.1.20:5173`.
Si el celular está en el mismo wifi que la computadora, ábrela en el navegador del celular.

## Publicarlo con un enlace para Ray

### Opción A: GitHub Pages (automático)

1. En GitHub, entra al repositorio y ve a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Ve a la pestaña **Actions**, abre "Publicar en GitHub Pages" y pulsa **Run workflow**, o sube cualquier cambio.
4. En un par de minutos el juego queda en `https://renatolc2026.github.io/juego-cumple-ray/`.

### Opción B: Netlify Drop (sin configurar nada)

1. Ejecuta `npm run build`. Se crea la carpeta `dist`.
2. Entra a <https://app.netlify.com/drop> y arrastra la carpeta `dist`.
3. Netlify te da un enlace para compartir.

## Personalizar

- **Personajes** (colores, peinado, lentes, nombres): `src/gfx/characters.js`.
  - Aurora tiene un aspecto provisional (cabello castaño largo, vestido lila) porque el documento lo deja pendiente.
  - Los otros tres programadores se llaman "Programador" y "Programadora" hasta tener sus nombres (`dev1`, `dev2`, `dev3`).
- **Frase del abuelito Humberto** (pendiente de aprobación): `src/world/zones/church.js`, función `benchHCJ`.
- **Mensaje final**: `src/scenes/EndingScene.js`, constante `FINAL_MESSAGE`.
- **Fotos en los créditos**: lee `public/fotos/LEEME.txt`. El juego convierte las fotos en postales de pixel art.
- **Música**: toda es original y se genera en el navegador. Las partituras están en `src/core/songs.js`.

## Estructura

```
src/
  main.js              arranque de Phaser
  core/                audio, música, controles, guardado, diálogos, efectos, ritmo
  gfx/                 pixel art generado por código (personajes, retratos, tiles, objetos)
  world/zones/         cada escena del juego con su mapa e historia
  scenes/              título, mundo, minijuegos, batalla final, menú y final
dev/                   herramientas de prueba (capturas con Playwright)
```

### Atajos de prueba

- `?dev=zone:park` abre una zona directamente. También funciona con `church`, `garden`, `salsa`, `cave`, `tower` y `party`.
- `&flags=hachi_joined&notes=hogar,fe` activa banderas y notas.
- `&floor=7` elige el piso de la torre.
- `&autowin=1` gana los minijuegos al instante.
- `?dev=piano`, `salsa`, `code`, `simon`, `final` (con `&phase=2` o `3`) y `ending` abren un minijuego suelto.

Hecho con [Phaser 3](https://phaser.io) y [Vite](https://vitejs.dev). Fuente: Press Start 2P.
