// Motor de audio: sintetizador + secuenciador + efectos, todo con Web Audio.
// La música es original y se genera en el navegador (no hay archivos de audio).

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicVol = 0.8;
    this.sfxVol = 0.9;
    this.clarity = 1;
    this.current = null;
    this.timer = null;
    this.listeners = new Set();
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    this.master.connect(comp).connect(ctx.destination);

    // Bus de música: pasa por un filtro que "apaga" la música cuando falta claridad
    this.musicOut = ctx.createGain();
    this.musicOut.gain.value = this.musicVol;
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.musicFilter.Q.value = 0.7;
    this.musicFilter.connect(this.musicOut).connect(this.master);

    this.musicDry = ctx.createGain();
    this.musicDry.connect(this.musicFilter);

    // Reverb generada (sala amplia) y eco suave
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.8, 2.6);
    this.reverbIn = ctx.createGain();
    this.reverbIn.gain.value = 0.9;
    this.reverbIn.connect(this.reverb).connect(this.musicFilter);

    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 2600;
    this.delayIn = ctx.createGain();
    this.delayIn.gain.value = 0.5;
    this.delayIn.connect(this.delay);
    this.delay.connect(dlp).connect(fb).connect(this.delay);
    dlp.connect(this.musicFilter);

    // Bus de efectos
    this.sfxOut = ctx.createGain();
    this.sfxOut.gain.value = this.sfxVol;
    this.sfxOut.connect(this.master);
    this.sfxWet = ctx.createGain();
    this.sfxWet.gain.value = 1;
    const sfxRev = ctx.createConvolver();
    sfxRev.buffer = this.makeImpulse(1.6, 3);
    this.sfxWet.connect(sfxRev).connect(this.sfxOut);

    this.noiseBuf = this.makeNoise(2);
    this.pulseWave = this.makePulse(0.25);
    this.initAmbience();
  }

  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') this.ctx.resume();
    // Truco para iOS: reproducir un buffer vacío dentro del gesto del usuario
    const b = this.ctx.createBuffer(1, 1, 22050);
    const s = this.ctx.createBufferSource();
    s.buffer = b;
    s.connect(this.ctx.destination);
    s.start(0);
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // Tiempo que el jugador "escucha" (compensa latencia de salida)
  heardTime() {
    if (!this.ctx) return 0;
    const lat = (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
    return this.ctx.currentTime - Math.min(lat, 0.2);
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  makePulse(duty) {
    const n = 64;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return this.ctx.createPeriodicWave(real, imag);
  }

  setMusicVolume(v) {
    this.musicVol = v;
    if (this.musicOut) this.musicOut.gain.setTargetAtTime(v * this.clarityGain(), this.now(), 0.1);
  }

  setSfxVolume(v) {
    this.sfxVol = v;
    if (this.sfxOut) this.sfxOut.gain.setTargetAtTime(v, this.now(), 0.05);
  }

  clarityGain() {
    return 0.45 + 0.55 * this.clarity;
  }

  // 0 = música apagada y lejana, 1 = música plena
  setClarity(c, time = 1.5) {
    this.clarity = Math.max(0, Math.min(1, c));
    if (!this.ctx) return;
    const f = 280 * Math.pow(20000 / 280, this.clarity);
    const t = this.now();
    this.musicFilter.frequency.cancelScheduledValues(t);
    this.musicFilter.frequency.setTargetAtTime(f, t, time / 3);
    this.musicOut.gain.setTargetAtTime(this.musicVol * this.clarityGain(), t, time / 3);
    if (this.windGain) this.windGain.gain.setTargetAtTime((1 - this.clarity) * 0.16 * (this.ambienceOn ? 1 : 0), t, time / 3);
  }

  // Viento de fondo cuando falta la música
  initAmbience() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(bp.frequency);
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(bp).connect(this.windGain).connect(this.master);
    // Zumbido suave
    const hum = ctx.createOscillator();
    hum.frequency.value = 55;
    const humG = ctx.createGain();
    humG.gain.value = 0.25;
    hum.connect(humG).connect(this.windGain);
    src.start();
    lfo.start();
    hum.start();
    this.ambienceOn = false;
  }

  setAmbience(on) {
    this.ambienceOn = on;
    this.setClarity(this.clarity, 1);
  }

  // ------------------------------------------------------------------ Instrumentos
  // Cada instrumento crea sus nodos, programa la envolvente y se conecta a `out`.
  voice(inst, t, midi, dur, vel = 0.8, out = null, wet = null) {
    const ctx = this.ctx;
    if (!ctx) return;
    const f = midiToFreq(midi);
    const env = ctx.createGain();
    env.gain.value = 0;
    const dest = out || this.musicDry;
    env.connect(dest);
    if (wet) {
      const w = ctx.createGain();
      w.gain.value = wet.rev ?? 0.3;
      env.connect(w).connect(wet.revNode || this.reverbIn);
      if (wet.delay) {
        const d = ctx.createGain();
        d.gain.value = wet.delay;
        env.connect(d).connect(wet.delayNode || this.delayIn);
      }
    }
    const nodes = [];
    const osc = (type, freq, gain = 1, detune = 0) => {
      const o = ctx.createOscillator();
      if (type === 'pulse') o.setPeriodicWave(this.pulseWave);
      else o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g);
      nodes.push(o);
      return { o, g };
    };
    const noise = () => {
      const s = ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      nodes.push(s);
      return s;
    };
    const start = (end) => nodes.forEach((n) => {
      n.start(t);
      n.stop(end + 0.05);
    });
    const v = vel;
    let end = t + dur;

    switch (inst) {
      case 'piano': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1800 + v * 2600;
        lp.connect(env);
        const a = osc('triangle', f, 0.7);
        const b = osc('sine', f * 2, 0.22);
        const c = osc('sine', f * 3, 0.07);
        const d = osc('sawtooth', f, 0.05);
        [a, b, c, d].forEach((x) => x.g.connect(lp));
        const decay = Math.max(0.5, 2.2 - (midi - 48) * 0.03);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.42 * v, t + 0.004);
        env.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.25);
        env.gain.exponentialRampToValueAtTime(0.0008, t + Math.min(dur + 0.4, decay));
        end = t + Math.min(dur + 0.4, decay);
        break;
      }
      case 'epiano': {
        const mod = osc('sine', f * 1, 1);
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(f * 1.4, t);
        mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.5);
        mod.o.disconnect();
        mod.o.connect(mg);
        const car = osc('sine', f, 0.8);
        mg.connect(car.o.frequency);
        const c2 = osc('sine', f * 2, 0.08);
        car.g.connect(env);
        c2.g.connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.4 * v, t + 0.006);
        env.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.6);
        env.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.9);
        end = t + dur + 0.9;
        break;
      }
      case 'pad':
      case 'strings': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = inst === 'pad' ? 900 : 2200;
        lp.Q.value = 0.5;
        lp.connect(env);
        const a = osc('sawtooth', f, 0.3, -8);
        const b = osc('sawtooth', f, 0.3, 8);
        const c = osc('triangle', f / 2, 0.3);
        [a, b, c].forEach((x) => x.g.connect(lp));
        const att = inst === 'pad' ? 0.7 : 0.25;
        const rel = inst === 'pad' ? 1.4 : 0.6;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.16 * v, t + Math.min(att, dur * 0.6));
        env.gain.setValueAtTime(0.16 * v, t + dur);
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + rel);
        end = t + dur + rel;
        break;
      }
      case 'choir': {
        const vib = ctx.createOscillator();
        vib.frequency.value = 5.2;
        const vg = ctx.createGain();
        vg.gain.setValueAtTime(0, t);
        vg.gain.linearRampToValueAtTime(9, t + 0.35);
        vib.connect(vg);
        nodes.push(vib);
        const sum = ctx.createGain();
        const a = osc('sawtooth', f, 0.35, -6);
        const b = osc('sawtooth', f, 0.35, 7);
        vg.connect(a.o.detune);
        vg.connect(b.o.detune);
        a.g.connect(sum);
        b.g.connect(sum);
        const formants = [[730, 1, 7], [1090, 0.55, 9], [2440, 0.25, 11]];
        for (const [ff, gg, q] of formants) {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = ff;
          bp.Q.value = q;
          const fg = ctx.createGain();
          fg.gain.value = gg * 2.2;
          sum.connect(bp).connect(fg).connect(env);
        }
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3 * v, t + 0.09);
        env.gain.setValueAtTime(0.3 * v, t + Math.max(0.1, dur - 0.05));
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.3);
        end = t + dur + 0.3;
        break;
      }
      case 'organ': {
        [[1, 0.5], [2, 0.3], [3, 0.14], [4, 0.1], [0.5, 0.2]].forEach(([m, g]) => osc('sine', f * m, g).g.connect(env));
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.2 * v, t + 0.06);
        env.gain.setValueAtTime(0.2 * v, t + dur);
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.35);
        end = t + dur + 0.35;
        break;
      }
      case 'pluck':
      case 'lead': {
        const a = osc(inst === 'lead' ? 'pulse' : 'square', f, 0.22);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(inst === 'lead' ? 3200 : 4000, t);
        lp.frequency.exponentialRampToValueAtTime(900, t + 0.25);
        a.g.connect(lp).connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3 * v, t + 0.004);
        if (inst === 'lead') {
          env.gain.setValueAtTime(0.22 * v, t + Math.max(0.02, dur - 0.02));
          env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.08);
          end = t + dur + 0.08;
        } else {
          env.gain.exponentialRampToValueAtTime(0.0005, t + Math.min(0.35, dur + 0.2));
          end = t + Math.min(0.35, dur + 0.2);
        }
        break;
      }
      case 'arp': {
        osc('triangle', f, 0.6).g.connect(env);
        osc('sine', f * 2, 0.15).g.connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.32 * v, t + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
        end = t + 0.45;
        break;
      }
      case 'marimba': {
        osc('sine', f, 0.8).g.connect(env);
        osc('sine', f * 4, 0.12).g.connect(env);
        if (f * 10 < 16000) osc('sine', f * 10, 0.03).g.connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.45 * v, t + 0.003);
        env.gain.exponentialRampToValueAtTime(0.0005, t + 0.55);
        end = t + 0.55;
        break;
      }
      case 'bell': {
        [[1, 0.5], [2.76, 0.18], [5.4, 0.08], [8.93, 0.03]].filter(([m]) => f * m < 16000).forEach(([m, g]) => osc('sine', f * m, g).g.connect(env));
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.32 * v, t + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0005, t + 1.6);
        end = t + 1.6;
        break;
      }
      case 'flute': {
        const vib = ctx.createOscillator();
        vib.frequency.value = 5;
        const vg = ctx.createGain();
        vg.gain.value = 6;
        vib.connect(vg);
        nodes.push(vib);
        const a = osc('sine', f, 0.8);
        const b = osc('triangle', f, 0.2);
        vg.connect(a.o.detune);
        a.g.connect(env);
        b.g.connect(env);
        const n = noise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = f * 2;
        bp.Q.value = 2;
        const ng = ctx.createGain();
        ng.gain.value = 0.05;
        n.connect(bp).connect(ng).connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.28 * v, t + 0.05);
        env.gain.setValueAtTime(0.24 * v, t + Math.max(0.06, dur - 0.03));
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.15);
        end = t + dur + 0.15;
        break;
      }
      case 'bass': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 700;
        lp.connect(env);
        osc('triangle', f, 0.8).g.connect(lp);
        osc('sine', f, 0.6).g.connect(lp);
        osc('sawtooth', f, 0.08).g.connect(lp);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.55 * v, t + 0.008);
        env.gain.exponentialRampToValueAtTime(0.25 * v, t + 0.2);
        env.gain.setValueAtTime(0.25 * v, t + Math.max(0.02, dur - 0.03));
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.08);
        end = t + dur + 0.08;
        break;
      }
      case 'brass': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 2;
        lp.frequency.setValueAtTime(500, t);
        lp.frequency.linearRampToValueAtTime(3400, t + 0.05);
        lp.frequency.exponentialRampToValueAtTime(1700, t + 0.25);
        lp.connect(env);
        osc('sawtooth', f, 0.3, -5).g.connect(lp);
        osc('sawtooth', f, 0.3, 6).g.connect(lp);
        osc('square', f / 2, 0.06).g.connect(lp);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3 * v, t + 0.03);
        env.gain.setValueAtTime(0.24 * v, t + Math.max(0.04, dur - 0.02));
        env.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.12);
        end = t + dur + 0.12;
        break;
      }
      // ----------------------------------------------------------------- Percusión
      case 'kick': {
        const a = osc('sine', 150, 1);
        a.o.frequency.setValueAtTime(150, t);
        a.o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        a.g.connect(env);
        env.gain.setValueAtTime(0.9 * v, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        end = t + 0.3;
        break;
      }
      case 'snare':
      case 'clap':
      case 'hat':
      case 'shaker': {
        const n = noise();
        const fl = ctx.createBiquadFilter();
        fl.type = inst === 'hat' || inst === 'shaker' ? 'highpass' : 'bandpass';
        fl.frequency.value = inst === 'hat' ? 7000 : inst === 'shaker' ? 5000 : inst === 'clap' ? 1300 : 1800;
        fl.Q.value = inst === 'clap' ? 1.5 : 0.7;
        n.connect(fl).connect(env);
        const len = inst === 'hat' ? 0.05 : inst === 'shaker' ? 0.08 : inst === 'clap' ? 0.16 : 0.18;
        const pk = inst === 'hat' ? 0.25 : inst === 'shaker' ? 0.14 : 0.55;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(pk * v, t + (inst === 'shaker' ? 0.02 : 0.002));
        env.gain.exponentialRampToValueAtTime(0.001, t + len);
        if (inst === 'snare') {
          const b = osc('triangle', 190, 0.5);
          b.o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
          b.g.connect(env);
        }
        end = t + len;
        break;
      }
      case 'conga':
      case 'bongo': {
        const base = inst === 'bongo' ? 360 : 200;
        const fr = base * (midi >= 60 ? 1.35 : 1);
        const a = osc('sine', fr, 1);
        a.o.frequency.setValueAtTime(fr * 1.4, t);
        a.o.frequency.exponentialRampToValueAtTime(fr, t + 0.02);
        a.g.connect(env);
        env.gain.setValueAtTime(0.55 * v, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        end = t + 0.22;
        break;
      }
      case 'cowbell': {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 800;
        bp.Q.value = 3;
        bp.connect(env);
        osc('square', 540, 0.3).g.connect(bp);
        osc('square', 800, 0.3).g.connect(bp);
        env.gain.setValueAtTime(0.5 * v, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        end = t + 0.18;
        break;
      }
      case 'clave': {
        osc('sine', 2500, 1).g.connect(env);
        env.gain.setValueAtTime(0.35 * v, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        end = t + 0.06;
        break;
      }
      default:
        return;
    }
    start(end);
  }

  // ------------------------------------------------------------------ Secuenciador
  playSong(song, opts = {}) {
    if (!this.ctx) return;
    const { fade = 0.6, loop = true, level = 99, onEnd = null, delay = 0.08 } = opts;
    if (this.current && this.current.song === song && !opts.restart) {
      this.current.level = level;
      return this.current;
    }
    this.stopSong(fade);
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.musicDry);
    const t0 = ctx.currentTime + delay;
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(song.gain ?? 1, t0 + (opts.fadeIn ?? 0.05));
    const revNode = ctx.createGain();
    revNode.connect(this.reverbIn);
    const delayNode = ctx.createGain();
    delayNode.connect(this.delayIn);
    const spStep = 60 / song.bpm / song.stepsPerBeat;
    const inst = {
      song, bus, revNode, delayNode, loop, level, onEnd,
      startTime: t0, loopStart: t0, step: 0, spStep,
      stopped: false,
    };
    // Índice de eventos por paso
    if (!song._byStep) {
      song._byStep = Array.from({ length: song.totalSteps }, () => []);
      song.tracks.forEach((tr, ti) => {
        for (const ev of tr.events) {
          const s = Math.round(ev[0]);
          if (s >= 0 && s < song.totalSteps) song._byStep[s].push([ti, ev]);
        }
      });
    }
    this.current = inst;
    this.ensureTimer();
    return inst;
  }

  ensureTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 25);
  }

  tick() {
    const inst = this.current;
    if (!inst || inst.stopped || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.15;
    const song = inst.song;
    while (true) {
      const swing = song.swing && inst.step % 2 === 1 ? song.swing * inst.spStep : 0;
      const t = inst.loopStart + inst.step * inst.spStep + swing;
      if (t > ahead) break;
      for (const [ti, ev] of song._byStep[inst.step]) {
        const tr = song.tracks[ti];
        if ((tr.minLevel || 0) > inst.level) continue;
        if (tr.maxLevel != null && tr.maxLevel < inst.level) continue;
        const [, notes, len, vel] = ev;
        const dur = (len || 1) * inst.spStep;
        const list = Array.isArray(notes) ? notes : [notes];
        const wet = tr.wet || tr.delay ? { rev: tr.wet || 0, delay: tr.delay || 0, revNode: inst.revNode, delayNode: inst.delayNode } : null;
        const out = this.trackGain(inst, ti, tr);
        const tt = t + (ev[4] || 0);
        for (const n of list) this.voice(tr.inst, tt, n, dur, (vel ?? 0.8) * (tr.vol ?? 1), out, wet);
      }
      for (const l of this.listeners) l(inst.step, t, inst);
      inst.step++;
      if (inst.step >= song.totalSteps) {
        if (inst.loop) {
          inst.step = 0;
          inst.loopStart += song.totalSteps * inst.spStep;
        } else {
          inst.stopped = true;
          const endAt = inst.loopStart + song.totalSteps * inst.spStep;
          const cb = inst.onEnd;
          if (cb) setTimeout(cb, Math.max(0, (endAt - this.ctx.currentTime) * 1000));
          break;
        }
      }
    }
  }

  trackGain(inst, ti, tr) {
    inst.gains = inst.gains || {};
    if (!inst.gains[ti]) {
      const g = this.ctx.createGain();
      g.gain.value = 1;
      g.connect(inst.bus);
      inst.gains[ti] = g;
    }
    return inst.gains[ti];
  }

  onStep(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setLevel(level) {
    if (this.current) this.current.level = level;
  }

  stopSong(fade = 0.6) {
    const inst = this.current;
    if (!inst || !this.ctx) return;
    inst.stopped = true;
    const t = this.ctx.currentTime;
    inst.bus.gain.cancelScheduledValues(t);
    inst.bus.gain.setValueAtTime(inst.bus.gain.value, t);
    inst.bus.gain.linearRampToValueAtTime(0, t + Math.max(0.02, fade));
    const bus = inst.bus;
    setTimeout(() => bus.disconnect(), (fade + 3) * 1000);
    this.current = null;
  }

  // Tiempo (en el reloj de audio) de un paso de la canción actual
  stepTime(step) {
    const inst = this.current;
    if (!inst) return 0;
    return inst.startTime + step * inst.spStep;
  }

  // ------------------------------------------------------------------ Efectos de sonido
  sfx(name, opt = {}) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.005;
    const out = this.sfxOut;
    const wet = { rev: opt.wet ?? 0.25, revNode: this.sfxWet };
    const V = (i, time, m, d, v, w = wet) => this.voice(i, time, m, d, v, out, w);
    switch (name) {
      case 'blip':
        this.tone(t, opt.freq || 520, 0.035, 0.06, 'square');
        break;
      case 'cursor':
        this.tone(t, 880, 0.04, 0.08, 'square');
        break;
      case 'select':
        this.tone(t, 660, 0.05, 0.1, 'square');
        this.tone(t + 0.05, 990, 0.07, 0.1, 'square');
        break;
      case 'cancel':
        this.tone(t, 500, 0.05, 0.1, 'square');
        this.tone(t + 0.05, 350, 0.07, 0.1, 'square');
        break;
      case 'step':
        this.noiseHit(t, 1200, 0.03, 0.05, 'bandpass');
        break;
      case 'bump':
        this.tone(t, 110, 0.08, 0.2, 'triangle');
        break;
      case 'bark':
        this.bark(t);
        this.bark(t + 0.18, 0.9);
        break;
      case 'bark1':
        this.bark(t);
        break;
      case 'meow':
        this.meow(t, opt.high);
        break;
      case 'item':
        [67, 72, 76, 79].forEach((m, i) => V('bell', t + i * 0.08, m + 12, 0.2, 0.6));
        break;
      case 'note':
        [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => V('bell', t + i * 0.07, m, 0.3, 0.7, { rev: 0.5, revNode: this.sfxWet }));
        [60, 64, 67, 72].forEach((m) => V('strings', t + 0.45, m, 1.4, 0.8));
        break;
      case 'success':
        [72, 76, 79, 84].forEach((m, i) => V('marimba', t + i * 0.07, m, 0.2, 0.9));
        break;
      case 'error':
        this.tone(t, 220, 0.12, 0.14, 'square');
        this.tone(t + 0.13, 165, 0.2, 0.14, 'square');
        break;
      case 'hit':
        V('bell', t, opt.midi || 84, 0.1, 0.35);
        break;
      case 'miss':
        this.noiseHit(t, 300, 0.12, 0.25, 'lowpass');
        break;
      case 'flash':
        this.sweep(t, 400, 6000, 0.35, 0.35);
        V('bell', t + 0.05, 96, 0.3, 0.5, { rev: 0.8, revNode: this.sfxWet });
        break;
      case 'whoosh':
        this.sweep(t, 3000, 300, 0.35, 0.3);
        break;
      case 'shatter':
        this.noiseHit(t, 3000, 0.4, 0.5, 'highpass');
        for (let i = 0; i < 10; i++) this.tone(t + Math.random() * 0.35, 2000 + Math.random() * 3000, 0.08, 0.06, 'sine');
        break;
      case 'crack':
        for (let i = 0; i < 4; i++) this.noiseHit(t + i * 0.05, 2500, 0.03, 0.4, 'highpass');
        break;
      case 'ding':
        V('bell', t, 88, 0.4, 0.8);
        V('bell', t + 0.25, 84, 0.6, 0.8);
        break;
      case 'door':
        this.tone(t, 90, 0.15, 0.3, 'triangle');
        this.noiseHit(t, 400, 0.1, 0.15, 'lowpass');
        break;
      case 'heal':
        for (let i = 0; i < 8; i++) V('bell', t + i * 0.05, 72 + i * 2, 0.2, 0.5);
        break;
      case 'confetti':
        for (let i = 0; i < 6; i++) this.noiseHit(t + i * 0.07 + Math.random() * 0.05, 4000, 0.04, 0.3, 'highpass');
        break;
      case 'pop':
        this.tone(t, 900, 0.05, 0.2, 'sine', 1800);
        break;
      case 'throw':
        this.sweep(t, 800, 2400, 0.15, 0.15);
        break;
      case 'slip':
        this.tone(t, 1400, 0.45, 0.16, 'sine', 250);
        this.noiseHit(t + 0.45, 200, 0.15, 0.4, 'lowpass');
        break;
      case 'thud':
        this.noiseHit(t, 180, 0.15, 0.5, 'lowpass');
        break;
      case 'cutin':
        this.sweep(t, 200, 5000, 0.25, 0.3);
        V('brass', t + 0.2, 72, 0.3, 0.9);
        V('brass', t + 0.2, 76, 0.3, 0.9);
        V('brass', t + 0.2, 79, 0.3, 0.9);
        break;
      case 'glitch':
        for (let i = 0; i < 6; i++) this.tone(t + i * 0.04, 100 + Math.random() * 1500, 0.035, 0.1, 'square');
        break;
      case 'fanfare':
        [[67, 0], [72, 0.12], [76, 0.24], [79, 0.36], [84, 0.6]].forEach(([m, d]) => {
          V('brass', t + d, m, d === 0.6 ? 0.7 : 0.1, 0.9);
          V('bell', t + d, m + 12, 0.2, 0.4);
        });
        break;
      case 'chime':
        [79, 83, 86, 91].forEach((m, i) => V('bell', t + i * 0.12, m, 0.4, 0.5, { rev: 0.7, revNode: this.sfxWet }));
        break;
      default:
        break;
    }
  }

  tone(t, freq, dur, vol, type = 'square', toFreq = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(this.sfxOut);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noiseHit(t, freq, dur, vol, type = 'bandpass') {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f).connect(g).connect(this.sfxOut);
    s.start(t, Math.random());
    s.stop(t + dur + 0.02);
  }

  sweep(t, f0, f1, dur, vol) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f).connect(g).connect(this.sfxOut);
    g.connect(this.sfxWet);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  bark(t, pitch = 1) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(620 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(330 * pitch, t + 0.09);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(bp).connect(g).connect(this.sfxOut);
    o.start(t);
    o.stop(t + 0.13);
    this.noiseHit(t, 1500, 0.05, 0.12, 'bandpass');
  }

  meow(t, high = false) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const b = high ? 900 : 650;
    o.frequency.setValueAtTime(b, t);
    o.frequency.linearRampToValueAtTime(b * 1.35, t + 0.15);
    o.frequency.linearRampToValueAtTime(b * 0.9, t + 0.38);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.linearRampToValueAtTime(1800, t + 0.15);
    bp.frequency.linearRampToValueAtTime(700, t + 0.38);
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(bp).connect(g).connect(this.sfxOut);
    o.start(t);
    o.stop(t + 0.45);
  }

  // Toca una nota musical suelta (piano del minijuego, Simon, etc.)
  note(inst, midi, dur = 0.4, vel = 0.9, toMusic = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.003;
    if (toMusic) this.voice(inst, t, midi, dur, vel, this.musicDry, { rev: 0.35, revNode: this.reverbIn });
    else this.voice(inst, t, midi, dur, vel, this.sfxOut, { rev: 0.35, revNode: this.sfxWet });
  }
}

export const audio = new AudioEngine();
