import { audio } from './audio.js';
import { controls } from './input.js';

export const LANE_DIRS = ['left', 'down', 'up', 'right'];
export const LANE_X = [60, 180, 300, 420];
export const LANE_COLORS = [0xff8fb1, 0x8fd3ff, 0xb6e36a, 0xffd166];

// Ventanas de acierto (segundos). Generosas: el objetivo es que nadie se frustre.
export const WINDOWS = { perfect: 0.075, good: 0.14, ok: 0.22 };

// Carril de ritmo genérico: notas que viajan hacia una línea de golpe.
export class RhythmTrack {
  constructor(scene, opts) {
    this.scene = scene;
    this.notes = opts.notes.map((n, i) => ({ ...n, i, judged: false, obj: null }));
    this.hitY = opts.hitY;
    this.spawnY = opts.spawnY;
    this.travel = opts.travel || 1.6;
    this.makeNote = opts.makeNote;
    this.onJudge = opts.onJudge || (() => {});
    this.laneX = opts.laneX || LANE_X;
    this.autoWindow = null; // [t0, t1] donde las notas se aciertan solas (ataque especial)
    this.done = false;
    this.stats = { perfect: 0, good: 0, ok: 0, miss: 0 };
    this.onPress = (btn, t) => {
      const lane = LANE_DIRS.indexOf(btn);
      if (lane >= 0) this.press(lane, t);
    };
    controls.on('press', this.onPress);
    scene.events.once('shutdown', () => this.destroy());
  }

  destroy() {
    controls.off('press', this.onPress);
    for (const n of this.notes) n.obj?.destroy();
  }

  get total() {
    return this.notes.length;
  }

  get hits() {
    return this.stats.perfect + this.stats.good + this.stats.ok;
  }

  get endTime() {
    return this.notes.length ? this.notes[this.notes.length - 1].time : 0;
  }

  update() {
    const now = audio.heardTime();
    for (const n of this.notes) {
      if (n.judged && !n.obj) continue;
      const dt = n.time - now;
      if (!n.obj && !n.judged && dt <= this.travel) {
        n.obj = this.makeNote(n);
      }
      if (n.obj && !n.judged) {
        const k = dt / this.travel;
        n.obj.y = this.hitY + k * (this.spawnY - this.hitY);
        n.obj.x = this.laneX[n.lane];
      }
      if (!n.judged) {
        if (this.autoWindow && n.time >= this.autoWindow[0] && n.time <= this.autoWindow[1] && dt <= 0) {
          this.judge(n, 'perfect', 0);
        } else if (dt < -WINDOWS.ok) {
          this.judge(n, 'miss', dt);
        }
      }
    }
    if (!this.done && this.notes.every((n) => n.judged)) this.done = true;
  }

  press(lane, t) {
    if (this.done) return;
    let best = null;
    for (const n of this.notes) {
      if (n.judged || n.lane !== lane) continue;
      const d = Math.abs(n.time - t);
      if (d <= WINDOWS.ok && (!best || d < Math.abs(best.time - t))) best = n;
      if (n.time - t > WINDOWS.ok) break;
    }
    if (!best) {
      this.onJudge(null, 'empty', 0, lane);
      return;
    }
    const d = Math.abs(best.time - t);
    const j = d <= WINDOWS.perfect ? 'perfect' : d <= WINDOWS.good ? 'good' : 'ok';
    this.judge(best, j, best.time - t);
  }

  judge(n, j, offset) {
    n.judged = true;
    n.result = j;
    this.stats[j]++;
    const obj = n.obj;
    this.onJudge(n, j, offset, n.lane);
    if (obj) {
      if (j === 'miss') {
        this.scene.tweens.add({ targets: obj, alpha: 0, duration: 250, onComplete: () => obj.destroy() });
      } else {
        obj.y = this.hitY;
        this.scene.tweens.add({ targets: obj, scale: 1.8, alpha: 0, duration: 180, onComplete: () => obj.destroy() });
      }
      n.obj = null;
    }
  }
}

// Crea notas a partir de eventos [paso, midi, largo] de una melodía, asignando carriles por altura
export function chartFromMelody(events, { startTime, spStep, offsetSteps = 0, minLen = 0, loops = 1, loopSteps = 0 }) {
  const evs = events.filter((e) => e[2] >= minLen);
  const pitches = [...new Set(evs.map((e) => (Array.isArray(e[1]) ? e[1][0] : e[1])))].sort((a, b) => a - b);
  const laneOf = (p) => Math.min(3, Math.floor((pitches.indexOf(p) * 4) / pitches.length));
  const notes = [];
  for (let l = 0; l < loops; l++) {
    for (const e of evs) {
      const midi = Array.isArray(e[1]) ? e[1][0] : e[1];
      notes.push({ time: startTime + (e[0] + offsetSteps + l * loopSteps) * spStep, lane: laneOf(midi), midi, len: e[2] * spStep });
    }
  }
  // Evitar dos notas en el mismo carril demasiado juntas
  notes.sort((a, b) => a.time - b.time);
  return notes;
}
