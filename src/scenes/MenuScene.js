import Phaser from 'phaser';
import { S } from '../core/services.js';
import { audio } from '../core/audio.js';
import { controls } from '../core/input.js';
import { state, ITEMS, NOTES, NOTE_ORDER } from '../core/state.js';
import { txt, panel } from '../core/text.js';

// Menú de pausa: objetos, notas, pistas, mapa y opciones.
const TABS = ['Objetos', 'Notas', 'Pistas', 'Mapa', 'Opciones', 'Volver'];

const PLACES = [
  { id: 'home', name: 'Casa', x: 40, y: 150 },
  { id: 'park', name: 'Parque', x: 100, y: 110 },
  { id: 'garden', alt: 'church', name: 'Iglesia', x: 170, y: 140 },
  { id: 'salsa', name: 'Salón del Sabor', x: 240, y: 80 },
  { id: 'cave', name: 'Cueva del Código', x: 200, y: 40 },
  { id: 'tower', name: 'Torre', x: 290, y: 30 },
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(data) {
    this.from = data.from || 'World';
    this.tab = 0;
    this.optMode = false;
    this.optIdx = 0;
    S.ui?.setMode('menuOnly');
    this.add.rectangle(0, 0, 480, 270, 0x05030c, 0.7).setOrigin(0);
    panel(this, 10, 10, 116, 250, 'panelGold');
    panel(this, 132, 10, 338, 250, 'panel');
    txt(this, 68, 24, 'Menú', { origin: [0.5, 0], color: '#ffd166', size: 8 });
    this.tabTexts = TABS.map((t, i) => {
      const tt = txt(this, 36, 50 + i * 22, t);
      const z = this.add.zone(14, 44 + i * 22, 108, 20).setOrigin(0).setInteractive();
      z.on('pointerdown', () => {
        this.tab = i;
        this.optMode = false;
        audio.sfx('cursor');
        if (TABS[i] === 'Volver') this.close();
        else this.refresh();
      });
      return tt;
    });
    this.cursor = this.add.image(24, 54, 'cursor');
    // Notas mini en el menú lateral
    NOTE_ORDER.forEach((id, i) => {
      this.add.image(28 + i * 24, 230, state.hasNote(id) ? NOTES[id].icon : 'nota_vacia').setScale(0.9);
    });
    txt(this, 68, 246, controls.isTouch ? 'Menú: cerrar' : 'Esc: cerrar', { origin: [0.5, 0], color: '#b9a8d6' });
    this.content = this.add.container(0, 0);
    this.refresh();
  }

  refresh() {
    this.tabTexts.forEach((t, i) => t.setColor(i === this.tab ? '#ffd166' : '#fff8ec'));
    this.cursor.y = 54 + this.tab * 22;
    this.content.removeAll(true);
    const name = TABS[this.tab];
    if (name === 'Objetos') this.drawItems();
    if (name === 'Notas') this.drawNotes();
    if (name === 'Pistas') this.drawClues();
    if (name === 'Mapa') this.drawMap();
    if (name === 'Opciones') this.drawOptions();
    if (name === 'Volver') this.content.add(txt(this, 300, 130, 'Volver al juego', { origin: 0.5, color: '#b9a8d6' }));
  }

  drawItems() {
    const owned = Object.keys(ITEMS).filter((k) => state.item(k) > 0);
    if (!owned.length) {
      this.content.add(txt(this, 150, 30, 'Todavía no tienes objetos.', { color: '#b9a8d6' }));
      return;
    }
    owned.forEach((k, i) => {
      const it = ITEMS[k];
      const y = 26 + i * 38;
      this.content.add(this.add.image(156, y + 8, it.icon));
      this.content.add(txt(this, 172, y, `${it.name}${state.item(k) > 1 ? `  x${state.item(k)}` : ''}`, { color: '#ffd166' }));
      this.content.add(txt(this, 172, y + 12, it.desc, { wrap: 286, color: '#e8dcff', lineSpacing: 3 }));
    });
  }

  drawNotes() {
    this.content.add(txt(this, 300, 26, `Notas Legendarias: ${state.noteCount()} de 4`, { origin: [0.5, 0], color: '#ffd166' }));
    NOTE_ORDER.forEach((id, i) => {
      const has = state.hasNote(id);
      const x = 172 + i * 76;
      const img = this.add.image(x, 100, has ? NOTES[id].icon : 'nota_vacia').setScale(2);
      this.content.add(img);
      if (has) this.tweens.add({ targets: img, y: 94, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.content.add(txt(this, x, 138, has ? NOTES[id].name.replace('Nota ', '') : '???', { origin: [0.5, 0], color: has ? '#fff8ec' : '#6a5e7c', wrap: 70, align: 'center' }));
    });
    const msg = state.noteCount() >= 4 ? '¡Todas las notas! La Torre del Silencio te espera.' : 'Cada nota devuelve un poco de música y de color al mundo.';
    this.content.add(txt(this, 300, 200, msg, { origin: [0.5, 0], wrap: 300, align: 'center', color: '#b9a8d6' }));
  }

  drawClues() {
    const clues = ['bufanda', 'llavero', 'postit'].filter((k) => state.item(k) > 0);
    this.content.add(txt(this, 300, 26, '¿Quién es el Maestro del Silencio?', { origin: [0.5, 0], color: '#ffd166' }));
    if (!clues.length) {
      this.content.add(txt(this, 150, 56, 'Aún no hay pistas. El enmascarado parece muy misterioso... ¿o no?', { wrap: 300, color: '#b9a8d6' }));
    }
    clues.forEach((k, i) => {
      const it = ITEMS[k];
      const y = 50 + i * 44;
      this.content.add(this.add.image(156, y + 8, it.icon));
      this.content.add(txt(this, 172, y, it.name, { color: '#8fd3ff' }));
      this.content.add(txt(this, 172, y + 12, it.desc, { wrap: 286, color: '#e8dcff', lineSpacing: 3 }));
    });
    if (state.flag('boss_beaten')) {
      this.content.add(txt(this, 300, 222, '¡Era Tato!', { origin: [0.5, 0], color: '#ffd166', size: 8 }));
    } else if (state.flag('letter_read')) {
      this.content.add(txt(this, 150, 206, 'La carta decía: "Ta... digo, el Maestro del Silencio".', { wrap: 300, color: '#b9a8d6' }));
    }
  }

  drawMap() {
    const ox = 150;
    const oy = 40;
    const g = this.add.graphics();
    this.content.add(g);
    g.fillStyle(0xf2d49b, 1);
    g.fillRoundedRect(ox - 6, oy - 14, 316, 196, 6);
    g.lineStyle(2, 0xb98c55);
    g.strokeRoundedRect(ox - 6, oy - 14, 316, 196, 6);
    // Río Chira
    g.lineStyle(4, 0x5fb2ea, 0.8);
    g.beginPath();
    g.moveTo(ox, oy + 176);
    g.lineTo(ox + 80, oy + 160);
    g.lineTo(ox + 160, oy + 175);
    g.lineTo(ox + 300, oy + 165);
    g.strokePath();
    const zone = this.scene.get('World')?.zoneId;
    const cur = zone === 'church' ? 'garden' : zone === 'party' ? 'home' : zone;
    const idx = PLACES.findIndex((p) => p.id === cur);
    g.lineStyle(2, 0xe8505b, 0.9);
    for (let i = 1; i < PLACES.length; i++) {
      const a = PLACES[i - 1];
      const b = PLACES[i];
      const dashed = i > Math.max(idx, 0);
      g.lineStyle(2, dashed ? 0xb98c55 : 0xe8505b, dashed ? 0.6 : 0.9);
      g.lineBetween(ox + a.x, oy + a.y, ox + b.x, oy + b.y);
    }
    PLACES.forEach((p, i) => {
      const visited = i <= idx;
      const c = this.add.circle(ox + p.x, oy + p.y, 6, visited ? 0xe8505b : 0xdcb676).setStrokeStyle(2, 0x43281d);
      this.content.add(c);
      if (p.id === cur) this.tweens.add({ targets: c, scale: 1.5, duration: 400, yoyo: true, repeat: -1 });
      this.content.add(txt(this, ox + p.x, oy + p.y + 10, p.name, { origin: [0.5, 0], color: '#43281d', wrap: 90, align: 'center' }));
    });
    this.content.add(txt(this, ox + 150, oy - 8, state.item('mapa') ? 'Mapa de Sullana (y alrededores)' : 'No tienes mapa todavía', { origin: [0.5, 0], color: '#43281d' }));
  }

  drawOptions() {
    const rows = [
      { label: 'Música', get: () => state.settings.music, set: (v) => { state.settings.music = v; audio.setMusicVolume(v); } },
      { label: 'Efectos', get: () => state.settings.sfx, set: (v) => { state.settings.sfx = v; audio.setSfxVolume(v); audio.sfx('cursor'); } },
    ];
    this.optRows = rows;
    rows.forEach((r, i) => {
      const y = 40 + i * 30;
      const sel = this.optMode && this.optIdx === i;
      this.content.add(txt(this, 150, y, r.label, { color: sel ? '#ffd166' : '#fff8ec' }));
      const v = Math.round(r.get() * 10);
      for (let k = 0; k < 10; k++) this.content.add(this.add.rectangle(252 + k * 9, y + 4, 7, 8, k < v ? 0x8fd3ff : 0x3a2f4a).setStrokeStyle(1, 0x8fd3ff));
      const minus = txt(this, 232, y, '-', { color: '#ffd166' }).setInteractive();
      const plus = txt(this, 344, y, '+', { color: '#ffd166' }).setInteractive();
      minus.on('pointerdown', () => this.adjust(i, -1));
      plus.on('pointerdown', () => this.adjust(i, 1));
      this.content.add([minus, plus]);
    });
    const fsY = 100;
    const fsSel = this.optMode && this.optIdx === 2;
    const fs = txt(this, 150, fsY, `Pantalla completa: ${this.scale.isFullscreen ? 'Sí' : 'No'}`, { color: fsSel ? '#ffd166' : '#fff8ec' }).setInteractive();
    fs.on('pointerdown', () => this.toggleFs());
    this.content.add(fs);
    const ctrl = controls.isTouch
      ? 'Controles: cruceta para moverte, A para hablar, B para lanzar la pelota, y el botón de arriba a la derecha para el menú.'
      : 'Controles: flechas o WASD para moverte, ESPACIO o Enter para hablar, X para lanzar la pelota, Esc para el menú.';
    this.content.add(txt(this, 150, 134, ctrl, { wrap: 300, color: '#b9a8d6', lineSpacing: 4 }));
    if (!this.optMode && !controls.isTouch) this.content.add(txt(this, 150, 226, 'ESPACIO para editar', { color: '#6a5e7c' }));
  }

  adjust(i, d) {
    const r = this.optRows[i];
    r.set(Phaser.Math.Clamp(Math.round((r.get() + d * 0.1) * 10) / 10, 0, 1));
    state.saveSettings();
    this.refresh();
  }

  toggleFs() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
    this.time.delayedCall(300, () => this.refresh());
  }

  close() {
    audio.sfx('cancel');
    this.scene.stop();
    this.scene.resume(this.from);
  }

  update() {
    if (controls.consume('menu')) {
      this.close();
      return;
    }
    if (this.optMode) {
      if (controls.consume('b')) {
        this.optMode = false;
        this.refresh();
        return;
      }
      if (controls.consume('up')) this.optIdx = (this.optIdx + 2) % 3;
      else if (controls.consume('down')) this.optIdx = (this.optIdx + 1) % 3;
      else if (controls.consume('left') && this.optIdx < 2) this.adjust(this.optIdx, -1);
      else if (controls.consume('right') && this.optIdx < 2) this.adjust(this.optIdx, 1);
      else if (controls.consume('a') && this.optIdx === 2) this.toggleFs();
      else return;
      audio.sfx('cursor');
      this.refresh();
      return;
    }
    if (controls.consume('b')) {
      this.close();
      return;
    }
    if (controls.consume('up')) {
      this.tab = (this.tab + TABS.length - 1) % TABS.length;
      audio.sfx('cursor');
      this.refresh();
    }
    if (controls.consume('down')) {
      this.tab = (this.tab + 1) % TABS.length;
      audio.sfx('cursor');
      this.refresh();
    }
    if (controls.consume('a') || controls.consume('right')) {
      if (TABS[this.tab] === 'Volver') this.close();
      else if (TABS[this.tab] === 'Opciones') {
        this.optMode = true;
        this.optIdx = 0;
        audio.sfx('select');
        this.refresh();
      }
    }
  }
}
