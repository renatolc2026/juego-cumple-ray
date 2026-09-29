import Phaser from 'phaser';
import { S } from '../core/services.js';
import { controls } from '../core/input.js';
import { audio } from '../core/audio.js';
import { state, ITEMS, NOTES } from '../core/state.js';
import * as SONGS from '../core/songs.js';
import { TILE, SOLID_TILES } from '../gfx/tiles.js';
import { OBJECTS } from '../gfx/objects.js';
import { Actor, DXY, OPP, dirFromDelta } from '../world/actor.js';
import { ZONES } from '../world/zones/index.js';
import * as fx from '../core/fx.js';
import { txt } from '../core/text.js';

const SAT_BY_NOTES = [0.22, 0.45, 0.65, 0.84, 1];
const CLARITY_BY_NOTES = [0.05, 0.35, 0.6, 0.8, 1];

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'World' });
  }

  init(data) {
    this.zoneId = data.zone || 'home';
    this.spawnKey = data.spawn || 'default';
    this.loaded = !!data.loaded;
  }

  create() {
    this.zone = ZONES[this.zoneId];
    if (!this.zone) throw new Error(`Zona desconocida: ${this.zoneId}`);
    this.locked = 0;
    this.actors = new Map();
    this.objects = [];
    this.transitioning = false;
    this.hachi = null;
    this.stepCount = 0;
    S.ui?.setMode('world');
    controls.releaseAll();

    this.buildMap();
    this.buildObjects();
    this.buildActors();

    const cam = this.cameras.main;
    cam.setBackgroundColor(this.zone.bg || '#120c1f');
    const mw = this.mapW * 16;
    const mh = this.mapH * 16;
    const bw = Math.max(mw, 480);
    const bh = Math.max(mh, 270);
    cam.setBounds(-(bw - mw) / 2, -(bh - mh) / 2, bw, bh);
    cam.startFollow(this.player.sprite, true, 0.18, 0.18, 0, 8);
    cam.roundPixels = true;
    this.grade = fx.colorGrade(cam);
    const n = state.noteCount();
    const sat = this.zone.saturation ? this.zone.saturation(this) : SAT_BY_NOTES[n];
    this.grade?.set(sat, this.zone.cold || 0);

    this.zone.setup?.(this);
    this.startZoneMusic();

    // Brillitos en los objetos escondidos
    this.time.addEvent({ delay: 2200, loop: true, callback: () => this.twinkleHidden() });

    // Autoguardado al entrar a cada escena
    if (!this.zone.noSave) state.save(this.zoneId, this.spawnKey);

    cam.fadeIn(600, 0, 0, 0);
    const intro = this.zone.onEnter?.(this, this.spawnKey, this.loaded);
    if (intro) this.run(() => intro);
    else if (this.zone.title) fx.titleCard(this, this.zone.title, this.zone.sub);

    this.events.on('resume', () => {
      controls.releaseAll();
      S.ui?.setMode('world');
    });
  }

  // ------------------------------------------------------------------ Mapa
  buildMap() {
    const z = this.zone;
    const rows = z.map;
    this.mapH = rows.length;
    this.mapW = rows[0].length;
    rows.forEach((r, i) => {
      if (r.length !== this.mapW) throw new Error(`Fila ${i} de ${this.zoneId} mide ${r.length} (esperado ${this.mapW})`);
    });
    const legend = { ...DEFAULT_LEGEND, ...(z.legend || {}) };
    const data = [];
    this.solid = [];
    for (let y = 0; y < this.mapH; y++) {
      const row = [];
      const srow = [];
      for (let x = 0; x < this.mapW; x++) {
        const name = legend[rows[y][x]] || 'void';
        row.push(TILE[name] ?? 0);
        srow.push(SOLID_TILES.has(name));
      }
      data.push(row);
      this.solid.push(srow);
    }
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const ts = map.addTilesetImage('tileset', 'tileset', 16, 16, 0, 0);
    this.layer = map.createLayer(0, ts, 0, 0).setDepth(-10);
    this.tilemap = map;
  }

  buildObjects() {
    for (const o of this.zone.objects || []) this.addObject(o);
  }

  addObject(o) {
    if (o.when && !o.when(this)) return null;
    const def = OBJECTS[o.type];
    if (!def) throw new Error(`Objeto desconocido: ${o.type}`);
    const fw = o.fw ?? def.fw;
    const fh = o.fh ?? def.fh;
    const x = o.x * 16 + (fw * 16) / 2 + (o.ox || 0);
    const y = (o.y + fh) * 16 + (o.oy || 0);
    const spr = this.add.sprite(x, y, `obj_${o.type}`, 0).setOrigin(0.5, 1);
    if (def.frames > 1) spr.play({ key: `obj_${o.type}_anim`, startFrame: Math.floor(Math.random() * def.frames) });
    const flat = o.flat ?? def.flat;
    spr.setDepth(flat ? -5 + (o.depth || 0) : y + (o.depth || 0));
    const rec = { ...o, def, fw, fh, sprite: spr, solid: (o.solid ?? def.solid) && !flat };
    if (o.alpha != null) spr.setAlpha(o.alpha);
    if (o.flip) spr.setFlipX(true);
    this.objects.push(rec);
    return rec;
  }

  removeObject(id) {
    const i = this.objects.findIndex((o) => o.id === id);
    if (i >= 0) {
      this.objects[i].sprite.destroy();
      this.objects.splice(i, 1);
    }
  }

  obj(id) {
    return this.objects.find((o) => o.id === id);
  }

  objectAt(x, y) {
    return this.objects.find((o) => x >= o.x && x < o.x + o.fw && y >= o.y && y < o.y + o.fh);
  }

  buildActors() {
    const sp = (this.zone.spawns || {})[this.spawnKey] || this.zone.spawns.default;
    this.player = new Actor(this, { id: 'ray', char: 'ray', x: sp.x, y: sp.y, dir: sp.dir || 'down' });
    this.actors.set('ray', this.player);
    if (state.flag('hachi_joined') && !this.zone.noHachi) this.addHachi();
    const list = this.zone.actors ? this.zone.actors(this) : [];
    for (const def of list) this.spawn(def);
  }

  addHachi(x, y) {
    if (this.hachi) return this.hachi;
    const back = DXY[OPP[this.player.dir]];
    let hx = x ?? this.player.x + back[0];
    let hy = y ?? this.player.y + back[1];
    if (x == null && this.blocked(hx, hy, true)) {
      hx = this.player.x;
      hy = this.player.y;
    }
    this.hachi = new Actor(this, { id: 'hachi', char: 'hachi', x: hx, y: hy, dir: this.player.dir });
    this.actors.set('hachi', this.hachi);
    return this.hachi;
  }

  spawn(def) {
    if (def.when && !def.when(this)) return null;
    const a = new Actor(this, def);
    this.actors.set(def.id, a);
    if (def.emote) a.persistentEmote = fx.emote(this, a.sprite, def.emote, 0);
    if (def.idle === 'look') {
      this.time.addEvent({
        delay: 2500 + Math.random() * 2500,
        loop: true,
        callback: () => {
          if (!a.moving && !this.locked && a.sprite.active) a.face(['down', 'left', 'right', 'down'][Math.floor(Math.random() * 4)]);
        },
      });
    }
    if (def.idle === 'bob') {
      this.tweens.add({ targets: a.sprite, scaleY: 0.94, duration: 400 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return a;
  }

  actor(id) {
    return this.actors.get(id);
  }

  removeActor(id) {
    const a = this.actors.get(id);
    if (!a) return;
    a.persistentEmote?.stop?.();
    a.destroy();
    this.actors.delete(id);
    if (id === 'hachi') this.hachi = null;
  }

  blocked(x, y, forPlayer = false, ignore = null) {
    if (x < 0 || y < 0 || x >= this.mapW || y >= this.mapH) return true;
    if (this.solid[y][x]) return true;
    for (const o of this.objects) {
      if (o.solid && x >= o.x && x < o.x + o.fw && y >= o.y && y < o.y + o.fh) return true;
    }
    for (const a of this.actors.values()) {
      if (a === ignore || !a.visible && a.visible !== undefined) continue;
      if (forPlayer && (a === this.hachi || a === this.player)) continue;
      if (a.def?.ghost) continue;
      if (a.x === x && a.y === y) return true;
    }
    if (this.zone.blocked?.(this, x, y)) return true;
    return false;
  }

  // ------------------------------------------------------------------ Bucle
  update(time, delta) {
    for (const a of this.actors.values()) if (!a.moving) a.sync();
    this.zone.update?.(this, time, delta);
    if (this.locked > 0 || this.transitioning || S.dialog?.active) return;

    if (controls.consume('menu')) {
      this.openMenu();
      return;
    }
    const p = this.player;
    if (p.moving) return;
    if (controls.consume('a')) {
      this.interact();
      return;
    }
    if (controls.consume('b')) {
      if (this.hachi) this.run(() => this.throwBall());
      else if (!this.zone.noHachi) this.run(() => this.say(null, 'Todavía no tienes la pelota de Hachi.'));
      return;
    }
    const dir = controls.dir();
    if (dir) {
      const [dx, dy] = DXY[dir];
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (p.dir !== dir && !p.lastMoveDir) p.face(dir);
      if (!this.blocked(nx, ny, true)) {
        this.stepPlayer(nx, ny, dir);
      } else {
        p.face(dir);
        p.lastMoveDir = null;
      }
    } else {
      p.lastMoveDir = null;
      p.idle();
    }
  }

  async stepPlayer(nx, ny, dir) {
    const p = this.player;
    const from = { x: p.x, y: p.y };
    p.lastMoveDir = dir;
    const dur = 150;
    if (this.hachi && !this.hachi.busy) {
      if (this.hachi.x !== from.x || this.hachi.y !== from.y) this.hachi.moveTo(from.x, from.y, dur).then(() => this.hachi && !this.hachi.moving && this.hachiIdle());
    }
    this.stepCount++;
    if (this.stepCount % 2 === 0) audio.sfx('step');
    await p.moveTo(nx, ny, dur);
    this.checkTriggers();
  }

  hachiIdle() {
    if (!this.player.moving && this.hachi) this.hachi.idle();
  }

  checkTriggers() {
    const p = this.player;
    for (const t of this.zone.triggers || []) {
      const w = t.w || 1;
      const h = t.h || 1;
      if (p.x >= t.x && p.x < t.x + w && p.y >= t.y && p.y < t.y + h) {
        if (t.once && state.flag(t.once)) continue;
        if (t.when && !t.when(this)) continue;
        if (t.once) state.setFlag(t.once);
        p.idle();
        this.run(() => t.run(this));
        return;
      }
    }
  }

  interact() {
    const p = this.player;
    const [dx, dy] = DXY[p.dir];
    const fx0 = p.x + dx;
    const fy0 = p.y + dy;
    // Personajes
    for (const a of this.actors.values()) {
      if (a === p || a.visible === false) continue;
      if (a.x === fx0 && a.y === fy0) {
        if (a === this.hachi) {
          this.run(() => this.petHachi());
          return;
        }
        const talk = a.def.talk;
        if (talk) {
          this.run(async () => {
            if (a.def.turn !== false && !a.animal) a.face(OPP[p.dir]);
            await talk(this, a);
          });
          return;
        }
      }
    }
    // Objetos (se puede hablar a través de mostradores: dos casillas)
    const o = this.objectAt(fx0, fy0) || this.objectAt(fx0 + dx, fy0 + dy);
    if (o && o.talk) {
      this.run(() => o.talk(this, o));
      return;
    }
    const zi = this.zone.interact?.(this, fx0, fy0);
    if (zi) this.run(() => zi);
  }

  // Ejecuta una escena guionada bloqueando los controles
  async run(fn) {
    this.locked++;
    this.player.idle();
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      this.locked = Math.max(0, this.locked - 1);
      controls.releaseAll();
    }
  }

  // ------------------------------------------------------------------ Hachi
  async petHachi() {
    const h = this.hachi;
    h.faceTo(this.player);
    h.setFrame(16);
    audio.sfx('bark1');
    fx.hearts(this, h.sprite.x, h.sprite.y - 12, 6);
    fx.emote(this, h.sprite, 'heart', 1000);
    if (!state.flag('pet_first')) {
      state.setFlag('pet_first');
      await this.wait(500);
      await this.say(null, 'Le rascas la pancita a Hachi. ¡Está felicísimo!');
    } else {
      await this.wait(900);
    }
    h.face(h.dir);
  }

  twinkleHidden() {
    for (const hdn of this.zone.hidden || []) {
      if (state.flag(`found_${hdn.id}`)) continue;
      if (hdn.when && !hdn.when(this)) continue;
      const s = this.add.image(hdn.x * 16 + 8 + Phaser.Math.Between(-4, 4), hdn.y * 16 + 8 + Phaser.Math.Between(-4, 2), 'sparkle').setDepth(5000).setScale(0.3);
      this.tweens.add({ targets: s, scale: 1, alpha: 0, duration: 700, onComplete: () => s.destroy() });
    }
  }

  ballBlocked(x, y) {
    if (x < 0 || y < 0 || x >= this.mapW || y >= this.mapH) return true;
    if (this.solid[y][x]) return true;
    for (const o of this.objects) if (o.solid && x >= o.x && x < o.x + o.fw && y >= o.y && y < o.y + o.fh) return true;
    for (const a of this.actors.values()) if (a !== this.hachi && a !== this.player && a.visible !== false && a.x === x && a.y === y) return true;
    return false;
  }

  async throwBall() {
    const p = this.player;
    const h = this.hachi;
    const [dx, dy] = DXY[p.dir];
    let tx = p.x;
    let ty = p.y;
    let dist = 0;
    for (let i = 1; i <= 4; i++) {
      const nx = p.x + dx * i;
      const ny = p.y + dy * i;
      if (this.ballBlocked(nx, ny)) break;
      tx = nx;
      ty = ny;
      dist = i;
    }
    if (dist === 0) {
      fx.emote(this, p.sprite, 'dots', 800);
      await this.wait(600);
      return;
    }
    h.busy = true;
    audio.sfx('throw');
    p.setFrame(16);
    const ball = this.add.image(p.sprite.x, p.sprite.y - 14, 'ball').setDepth(6000);
    const sx = ball.x;
    const sy = ball.y;
    const ex = tx * 16 + 8;
    const ey = ty * 16 + 12;
    const dur = 110 * dist + 120;
    await fx.tween(this, {
      targets: ball,
      x: ex,
      duration: dur,
      onUpdate: (tw) => {
        const k = tw.progress;
        ball.y = sy + (ey - sy) * k - Math.sin(k * Math.PI) * (14 + dist * 4);
        ball.angle += 12;
      },
    });
    audio.sfx('pop');
    p.face(p.dir);
    this.tweens.add({ targets: ball, y: ey - 4, duration: 90, yoyo: true, repeat: 1 });
    audio.sfx('bark1');
    // Hachi corre hacia la pelota
    await this.runDog(h, tx, ty, 70);
    ball.destroy();
    // ¿Hay algo escondido cerca?
    const found = (this.zone.hidden || []).find((hd) => !state.flag(`found_${hd.id}`) && (!hd.when || hd.when(this)) && Math.abs(hd.x - tx) + Math.abs(hd.y - ty) <= 1);
    if (found) {
      h.face('down');
      fx.emote(this, h.sprite, '!', 900);
      audio.sfx('bark');
      await this.wait(500);
      this.tweens.add({ targets: h.sprite, x: h.sprite.x + 2, duration: 50, yoyo: true, repeat: 5 });
      await this.wait(400);
      fx.sparkles(this, found.x * 16 + 8, found.y * 16 + 8, 12);
      state.setFlag(`found_${found.id}`);
      await found.run(this, found);
    } else {
      fx.hearts(this, h.sprite.x, h.sprite.y - 12, 3);
    }
    // Vuelve con la pelota
    const back = DXY[OPP[p.dir]];
    let bx = p.x + back[0];
    let by = p.y + back[1];
    if (this.blocked(bx, by, true)) {
      const opts = Object.values(DXY).map(([ox, oy]) => [p.x + ox, p.y + oy]).filter(([x, y]) => !this.blocked(x, y, true));
      [bx, by] = opts[0] || [p.x, p.y];
    }
    await this.runDog(h, bx, by, 70, true);
    h.faceTo(p);
    h.setFrame(17);
    await this.wait(300);
    h.face(p.dir);
    h.busy = false;
  }

  // Hachi corre en línea recta (visual), actualizando su casilla al final
  async runDog(h, tx, ty, msPerTile = 70, carrying = false) {
    const dist = Math.abs(tx - h.x) + Math.abs(ty - h.y);
    if (dist === 0) return;
    const dir = dirFromDelta(tx - h.x, ty - h.y);
    h.dir = dir;
    h.moving = true;
    h.playWalk(dir);
    h.x = tx;
    h.y = ty;
    await fx.tween(this, {
      targets: h.sprite,
      x: tx * 16 + 8,
      y: ty * 16 + 15,
      duration: dist * msPerTile + 60,
      onUpdate: () => h.sync(),
    });
    h.moving = false;
    h.sync();
    h.idle();
    if (carrying) h.setFrame(17);
  }

  // ------------------------------------------------------------------ API para guiones
  say(who, text, expr = 'normal', opts = {}) {
    return S.dialog.say(who, text, expr, opts);
  }

  ask(who, text, choices, expr = 'normal') {
    return S.dialog.choice(who, text, choices, expr);
  }

  wait(ms) {
    return fx.wait(this, ms);
  }

  emote(target, type, dur = 1300) {
    const a = typeof target === 'string' ? this.actor(target) : target;
    if (type === '!') audio.sfx('pop');
    return fx.emote(this, a.sprite || a, type, dur);
  }

  async fadeOut(ms = 500, color = [0, 0, 0]) {
    this.cameras.main.fadeOut(ms, ...color);
    await this.wait(ms + 30);
  }

  async fadeIn(ms = 500) {
    this.cameras.main.fadeIn(ms, 0, 0, 0);
    await this.wait(ms);
  }

  flash(ms = 300, color = [255, 255, 255]) {
    this.cameras.main.flash(ms, ...color);
  }

  shake(ms = 300, intensity = 0.006) {
    this.cameras.main.shake(ms, intensity);
  }

  async pan(x, y, ms = 800) {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(x * 16 + 8, y * 16 + 8, ms, 'Sine.InOut');
    await this.wait(ms);
  }

  follow() {
    this.cameras.main.startFollow(this.player.sprite, true, 0.18, 0.18, 0, 8);
  }

  async give(key, n = 1, sub = '') {
    state.addItem(key, n);
    const it = ITEMS[key];
    await fx.banner(this, { icon: it.icon, title: `¡Obtuviste: ${it.name}${n > 1 ? ` x${n}` : ''}!`, sub });
  }

  async getNote(id) {
    state.addNote(id);
    const nt = NOTES[id];
    const n = state.noteCount();
    audio.stopSong(0.3);
    this.flash(400, [255, 240, 200]);
    fx.notesBurst(this, this.player.sprite.x, this.player.sprite.y - 20, 20);
    await fx.banner(this, { icon: nt.icon, title: `¡${nt.name}!`, sub: `Notas Legendarias: ${n} de 4`, sound: 'note', color: nt.color });
    // La música y el color regresan un poco
    audio.setClarity(CLARITY_BY_NOTES[n], 2.5);
    this.grade?.to(this, this.zone.saturation ? this.zone.saturation(this) : SAT_BY_NOTES[n], 2200);
    this.startZoneMusic(true);
    fx.notesBurst(this, this.player.sprite.x, this.player.sprite.y - 10, 14);
    await this.wait(1200);
  }

  async clue(key) {
    state.addItem(key, 1);
    if (!state.data.clues.includes(key)) state.data.clues.push(key);
    const it = ITEMS[key];
    await fx.banner(this, { icon: it.icon, title: `Pista: ${it.name}`, sub: 'Se guardó en el menú (Esc)', color: '#8fd3ff' });
  }

  music(song, opts = {}) {
    audio.playSong(typeof song === 'string' ? SONGS[song] : song, opts);
  }

  startZoneMusic(force = false) {
    const z = this.zone;
    const m = z.music ? z.music(this) : null;
    if (m === null) return;
    const song = typeof m.song === 'string' ? SONGS[m.song] : m.song;
    const clarity = m.clarity ?? CLARITY_BY_NOTES[state.noteCount()];
    audio.setClarity(clarity, force ? 2.5 : 0.1);
    audio.setAmbience(clarity < 0.99);
    if (song) audio.playSong(song, { level: m.level ?? 99, fadeIn: 1.2, restart: force && m.restart });
    else audio.stopSong(1);
  }

  sfx(name, opt) {
    audio.sfx(name, opt);
  }

  async setSat(sat, ms = 1500, cold) {
    if (!this.grade) return;
    await this.grade.to(this, sat, ms, cold);
  }

  // Lanza un minijuego y espera su resultado
  async minigame(key, data = {}, transition = 'shatter') {
    this.transitioning = true;
    let cover = null;
    if (transition === 'shatter') cover = await fx.shatter(this);
    else {
      await this.fadeOut(400);
    }
    const result = await new Promise((resolve) => {
      this.scene.launch(key, { ...data, onDone: resolve });
      this.scene.pause();
    });
    this.scene.stop(key);
    this.scene.resume();
    cover?.destroy();
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(500, 0, 0, 0);
    S.ui?.setMode('world');
    this.startZoneMusic();
    this.transitioning = false;
    await this.wait(500);
    return result;
  }

  async goto(zone, spawn = 'default', opts = {}) {
    this.transitioning = true;
    if (opts.portal) {
      audio.sfx('flash');
      this.flash(300, [255, 230, 255]);
      this.cameras.main.zoomTo(3, 700, 'Cubic.In');
      await this.wait(500);
    }
    if (!opts.keepMusic) audio.stopSong(0.8);
    await this.fadeOut(opts.fade ?? 600, opts.white ? [255, 255, 255] : [0, 0, 0]);
    this.scene.start('World', { zone, spawn });
  }

  save() {
    state.save(this.zoneId, this.spawnKey);
  }

  openMenu() {
    audio.sfx('select');
    this.scene.launch('Menu', { from: 'World' });
    this.scene.pause();
  }

  // Texto de ayuda breve arriba de la pantalla
  hint(text, ms = 3500) {
    const t = txt(this, 240, 12, text, { origin: [0.5, 0], color: '#fff8ec', stroke: '#120c1f', strokeThickness: 4, fixed: true, depth: 9500, wrap: 440, align: 'center' });
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300 });
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 400, onComplete: () => t.destroy() });
    return t;
  }

  // Mostrar la letra de una canción como subtítulo
  lyric(text, ms = 2200) {
    const t = txt(this, 240, 176, `♪ ${text} ♪`, { origin: 0.5, color: '#ffe9a0', stroke: '#120c1f', strokeThickness: 4, fixed: true, depth: 9500 });
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 170, duration: 300 });
    this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 300, onComplete: () => t.destroy() });
    return t;
  }
}

// Leyenda de caracteres por defecto para los mapas
export const DEFAULT_LEGEND = {
  '#': 'wallTop',
  W: 'wallHome',
  w: 'wallHomeWin',
  '.': 'wood',
  ':': 'woodDark',
  ',': 'tile',
  g: 'grass',
  h: 'grass2',
  f: 'grass3',
  p: 'path',
  s: 'sand',
  d: 'dirt',
  o: 'stoneOut',
  O: 'sidewalk',
  H: 'hedge',
  '~': 'water',
  V: 'void',
  r: 'rugRed',
  R: 'roofTop',
  E: 'wallHouseOut',
  e: 'wallHouseOutWin',
  D: 'doorOut',
};
