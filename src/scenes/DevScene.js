import Phaser from 'phaser';
import { state } from '../core/state.js';
import { audio } from '../core/audio.js';

// Atajos de prueba: ?dev=zone:park, ?dev=piano, etc.
export class DevScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Dev' });
  }

  create({ cmd }) {
    audio.unlock();
    const [kind, arg, spawn] = cmd.split(':');
    const flags = new URLSearchParams(location.search).get('flags');
    if (flags) flags.split(',').forEach((f) => state.setFlag(f));
    const notes = new URLSearchParams(location.search).get('notes');
    if (notes) notes.split(',').forEach((n) => state.addNote(n));
    if (kind === 'zone') {
      this.scene.start('World', { zone: arg, spawn: spawn || 'default' });
      return;
    }
    const map = { piano: 'Piano', salsa: 'Salsa', code: 'Code', simon: 'Simon', final: 'FinalBattle', ending: 'Ending', title: 'Title' };
    const q = new URLSearchParams(location.search);
    this.scene.start(map[kind] || 'Title', { dev: true, phase: +(q.get('phase') || 1), mode: q.get('mode') || undefined, length: 3, onDone: () => this.scene.start('Title') });
  }
}
