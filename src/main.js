import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin-400.css';
import { controls } from './core/input.js';
import { audio } from './core/audio.js';
import { state } from './core/state.js';
import { S } from './core/services.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PianoScene } from './scenes/PianoScene.js';
import { SalsaScene } from './scenes/SalsaScene.js';
import { CodeScene } from './scenes/CodeScene.js';
import { SimonScene } from './scenes/SimonScene.js';
import { FinalBattleScene } from './scenes/FinalBattleScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { DevScene } from './scenes/DevScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { UIScene } from './scenes/UIScene.js';

async function start() {
  // Esperamos la fuente pixelada para que el texto se vea nítido desde el inicio
  try {
    await Promise.race([
      document.fonts.load('8px "Press Start 2P"'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* seguimos con la fuente de respaldo */
  }

  controls.attach();
  audio.musicVol = state.settings.music;
  audio.sfxVol = state.settings.sfx;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 480,
    height: 270,
    backgroundColor: '#120c1f',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { activePointers: 4 },
    audio: { noAudio: true },
    fps: { target: 60 },
    scene: [
      BootScene, TitleScene, WorldScene, PianoScene, SalsaScene, CodeScene, SimonScene,
      FinalBattleScene, EndingScene, DevScene, MenuScene, DialogScene, UIScene,
    ],
  });
  S.game = game;
  game.events.on('prestep', () => controls.update());

  // El audio del navegador solo arranca tras una interacción del usuario
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  // Pausar música si se oculta la pestaña
  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx) return;
    if (document.hidden) audio.ctx.suspend();
    else audio.ctx.resume();
  });
  window.__game = game;
}

start();
