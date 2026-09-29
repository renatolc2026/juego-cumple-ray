import Phaser from 'phaser';
import { buildAllCharacters } from '../gfx/characters.js';
import { buildPortraits } from '../gfx/portraits.js';
import { buildTileset } from '../gfx/tiles.js';
import { buildObjects } from '../gfx/objects.js';
import { buildUiTextures } from '../core/text.js';

// Genera todos los gráficos por código y pasa a la pantalla de título
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    buildUiTextures(this);
    buildTileset(this);
    buildObjects(this);
    buildAllCharacters(this);
    buildPortraits(this);
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    this.scene.launch('Dialog');
    this.scene.launch('UI');
    const dev = new URLSearchParams(location.search).get('dev');
    if (dev) {
      this.scene.start('Dev', { cmd: dev });
      return;
    }
    this.scene.start('Title');
  }
}
