"""ANCESTRAL — banda sonora del showreel (20 s), sintetizada desde cero.

Sin samples: cada sonido nace de osciladores, ruido y modelos físicos simples.
  * Quena: síntesis aditiva + ruido de soplo filtrado + vibrato retardado y adornos.
  * Charango: Karplus-Strong en cuerdas dobles (órdenes), rasgueo de huayno.
  * Bombo legüero: seno con caída de tono + golpe de baqueta; "aro" de madera.
  * Chajchas (pezuñas): nubes de micro-clics.
  * Viento, pad y destellos; reverb por convolución con respuesta impulsiva sintética
    y un eco de montaña sobre la quena.
Tempo 96 BPM (negra = 0,625 s), los mismos tiempos que scene.js.

Uso: python3 music.py salida.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 20.0
N = int(SR * DUR)
BEAT = 60 / 96
rng = np.random.default_rng(2026)

L = np.zeros(N)
R = np.zeros(N)
# envíos a la reverb
RVL = np.zeros(N)
RVR = np.zeros(N)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def bt(b):
    """tiempo en segundos de un pulso (negra) contado desde 0."""
    return b * BEAT


def place(sig, t, gain=1.0, pan=0.0, rev=0.25):
    """Suma una señal mono en el bus estéreo (ley de paneo de potencia constante)."""
    i0 = int(round(t * SR))
    if i0 >= N:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), N - i0)
    s = sig[:n] * gain
    a = (pan + 1) * np.pi / 4
    gl, gr = np.cos(a), np.sin(a)
    L[i0:i0 + n] += s * gl
    R[i0:i0 + n] += s * gr
    RVL[i0:i0 + n] += s * gl * rev
    RVR[i0:i0 + n] += s * gr * rev


def bp(x, lo, hi, order=2):
    lo = max(20, lo)
    hi = min(SR / 2 - 100, hi)
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def adsr(n, a, d, s, r, sustain_level=0.8):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    env = np.ones(n) * sustain_level
    a = min(a, n)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    d = min(d, n - a)
    env[a:a + d] = np.linspace(1, sustain_level, d)
    if r > 0 and n > r:
        env[-r:] *= np.linspace(1, 0, r) ** 1.3
    return env


# ------------------------------------------------------------------ quena
def quena(m, dur, grace=None, amp=1.0, vib=True):
    tail = 0.12
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    f0 = midi(m)
    f = np.full(n, f0)
    # ataque: entra un pelo baja de afinación, como al soplar
    f *= 1 - 0.012 * np.exp(-t / 0.035)
    if grace is not None:
        gl = min(0.075, dur * 0.3)
        g = t < gl
        f[g] = midi(grace)
        k = (t >= gl) & (t < gl + 0.025)
        f[k] = midi(grace) + (f0 - midi(grace)) * (t[k] - gl) / 0.025
    if vib:
        depth = 0.0075 * np.clip((t - 0.28) / 0.35, 0, 1)
        f *= 1 + depth * np.sin(2 * np.pi * (5.1 + 0.3 * np.sin(t * 1.3)) * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.30 * np.sin(2 * ph + 0.3) + 0.11 * np.sin(3 * ph + 1.1) + 0.04 * np.sin(4 * ph)
    env = adsr(n, 0.05, 0.12, 0, tail + 0.05, 0.82)
    # leve crescendo en notas largas
    env *= 1 + 0.12 * np.clip((t - 0.3) / max(dur, 0.4), 0, 1)
    noise = rng.standard_normal(n)
    breath = bp(noise, f0 * 0.75, f0 * 1.35) * 0.55 + bp(noise, f0 * 1.8, f0 * 2.3) * 0.25 + hp(noise, 3500) * 0.05
    chiff = hp(noise, 1800) * np.exp(-t / 0.025) * 0.35
    out = (tone * (0.86 + 0.14 * lp(rng.standard_normal(n), 12) * 8) * 0.9 + breath * 1.6) * env + chiff * (env > 0)
    return out * amp * 0.22


# ------------------------------------------------------------------ charango
def ks(f, dur, bright=0.6, decay=0.996):
    """Karplus-Strong vectorizado por bloques del largo de la línea de retardo."""
    n = int(dur * SR)
    per = SR / f
    Ld = int(per)
    x = rng.uniform(-1, 1, Ld)
    x = lp(x, 1500 + 7000 * bright, 1)
    y = np.zeros(n + Ld + 2)
    y[:Ld] = x
    # y[i] = decay * (y[i-Ld] + y[i-Ld-1]) / 2, calculado de a un bloque de Ld muestras
    i = Ld
    while i < n + Ld:
        j = min(i + Ld, n + Ld)
        a = y[i - Ld:j - Ld]
        b = y[i - Ld - 1:j - Ld - 1] if i - Ld - 1 >= 0 else np.concatenate(([0], y[0:j - Ld - 1]))
        y[i:j] = decay * (0.5 * (a + b))
        i = j
    out = y[Ld:Ld + n]
    env = np.ones(n)
    r = min(int(0.04 * SR), n)
    env[-r:] = np.linspace(1, 0, r)
    return out * env


def charango_note(m, dur=1.2, amp=1.0, bright=0.65):
    f = midi(m)
    a = ks(f, dur, bright, 0.9965)
    b = ks(f * 1.0025, dur, bright * 0.9, 0.996)   # orden doble, apenas desafinado
    body = a + 0.8 * b
    body = body + 0.25 * bp(body, 380, 900)        # caja de resonancia
    return body * amp * 0.16


VOICING = {
    'Am': [69, 72, 76, 81, 76],
    'F': [65, 69, 72, 77, 81],
    'G': [67, 71, 74, 79, 83],
    'C': [67, 72, 76, 79, 84],
}


def strum(chord, t, down=True, amp=1.0, spread=0.014, dur=1.0, pan=0.25):
    notes = VOICING[chord] if down else VOICING[chord][::-1]
    for k, m in enumerate(notes):
        place(charango_note(m, dur, amp * (0.75 + 0.25 * rng.random()), 0.55 + 0.2 * rng.random()),
              t + k * spread * (0.8 + 0.4 * rng.random()), pan=pan + (k - 2) * 0.06, rev=0.22)


# ------------------------------------------------------------------ percusión
def bombo(amp=1.0, f_hi=120, f_lo=52, dec=0.42):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.045)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    skin = lp(rng.standard_normal(n), 1400) * np.exp(-t / 0.018) * 0.5
    hide = bp(rng.standard_normal(n), 180, 420) * np.exp(-t / 0.09) * 0.25   # cuero de cabra
    return (body + skin + hide) * amp * 0.55


def aro(amp=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    click = bp(rng.standard_normal(n), 1800, 4200) * np.exp(-t / 0.012)
    tone = np.sin(2 * np.pi * 1650 * t) * np.exp(-t / 0.02) * 0.4
    return (click + tone) * amp * 0.16


def chajchas(amp=1.0, spread=0.09):
    n = int((spread + 0.05) * SR)
    out = np.zeros(n)
    for _ in range(26):
        i = int(rng.random() ** 1.6 * spread * SR)
        ln = int(0.004 * SR)
        if i + ln < n:
            out[i:i + ln] += rng.standard_normal(ln) * np.exp(-np.arange(ln) / (0.0009 * SR)) * rng.uniform(0.3, 1)
    return hp(out, 2500) * amp * 0.07


def bell(f, dur=1.6, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, a, d in [(1, 1, 0.9), (2.76, 0.45, 0.45), (5.40, 0.25, 0.22), (8.93, 0.12, 0.12)]:
        out += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / d)
    out *= 1 - np.exp(-t / 0.002)
    return out * amp * 0.1


def whoosh(dur, lo=300, hi=6000, amp=1.0, rise=True):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    bands = np.geomspace(lo, hi, 9)
    for k, fc in enumerate(bands):
        c = k / (len(bands) - 1)
        c = c if rise else 1 - c
        env = np.exp(-((t - (0.15 + 0.7 * c)) / 0.16) ** 2)
        out += bp(noise, fc * 0.7, fc * 1.4) * env
    out *= np.sin(np.pi * t) ** 0.6
    return out * amp * 0.25


def drip():
    """La gota de cochinilla: 'plop' que sube de tono + golpe grave."""
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 600 + 1700 * (1 - np.exp(-t / 0.02))
    plop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
    thump = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.22)
    return plop * 0.35 + thump * 0.6


def boom(dur=3.0, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 38 + 50 * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    s += lp(rng.standard_normal(n), 220) * np.exp(-t / 0.35) * 0.6
    return s * amp * 0.7


def shimmer(t0, notes, step, amp=1.0, pan0=-0.6, pan1=0.6):
    for k, m in enumerate(notes):
        p = pan0 + (pan1 - pan0) * (k / max(1, len(notes) - 1))
        place(bell(midi(m), 1.8, amp), t0 + k * step, pan=p, rev=0.6)


# ------------------------------------------------------------------ ambiente
def wind():
    noise = rng.standard_normal(N)
    t = np.arange(N) / SR
    a = lp(noise, 500, 2)
    b = bp(rng.standard_normal(N), 700, 1600)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
    lvl = np.interp(t, [0, 1.5, 2.5, 5, 10, 15, 16.5, 17.5, 20], [0.0, 1.0, 0.8, 0.55, 0.4, 0.5, 1.0, 0.6, 0.45])
    return (a * 0.9 + b * 0.25) * mod * lvl * 0.05


def pad_chord(notes, dur, amp=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        for det in (-0.07, 0.0, 0.07):
            f = midi(m + det)
            ph0 = rng.uniform(0, 2 * np.pi)
            for h in range(1, 9):
                out += np.sin(2 * np.pi * f * h * t + ph0 * h) / h ** 1.35
    out = lp(out, 900, 2)
    env = np.minimum(1, np.minimum(t / 0.8, (dur - t) / 0.9).clip(0))
    return out * env * amp * 0.012


# ================================================================== arreglo
place(wind(), 0, pan=0, rev=0.1)
# el viento en estéreo: copia decorrelacionada
w2 = wind()
L += w2 * 0.6
R -= w2 * 0.6

# dron andino: La + Mi graves durante toda la pieza
drone = pad_chord([45, 52], 20.5, 1.0)
drone *= np.interp(np.arange(len(drone)) / SR, [0, 2, 10, 15.3, 16, 17.4, 17.6, 20.5], [0.3, 0.8, 1.0, 1.0, 0.7, 0.9, 1.3, 1.0])
place(drone, 0, rev=0.3)

# pad armónico por compás
CHORDS = [('Am', 0, 8), ('F', 8, 4), ('G', 12, 4), ('Am', 16, 4), ('F', 20, 2), ('G', 22, 2), ('Am', 24, 2), ('C', 26, 2), ('Am', 28, 5)]
PAD_NOTES = {'Am': [57, 60, 64], 'F': [53, 57, 60], 'G': [55, 59, 62], 'C': [55, 60, 64]}
for ch, b0, nb in CHORDS:
    amp = 0.85 if b0 < 8 else 1.0 if b0 < 28 else 1.3
    place(pad_chord(PAD_NOTES[ch], bt(nb) + 0.9, amp), bt(b0) - 0.15, rev=0.5)

# ---- melodía de quena: (pulso, duración en pulsos, nota, adorno)
MEL = [
    (0.5, 1.5, 76, 74), (2.0, 0.5, 79, None), (2.5, 1.5, 81, 79),
    (4.0, 0.5, 79, None), (4.5, 0.5, 76, None), (5.0, 1.0, 74, None), (6.0, 2.0, 76, 79),
    (8.0, 0.75, 81, None), (8.75, 0.25, 79, None), (9.0, 1.0, 76, None), (10.0, 0.5, 79, None), (10.5, 0.5, 76, None), (11.0, 1.0, 74, 76),
    (12.0, 0.5, 76, None), (14.0, 0.5, 72, None), (14.5, 0.5, 74, None), (15.0, 1.0, 76, 79),
    (18.0, 0.5, 81, None), (18.5, 0.5, 79, None), (19.0, 0.5, 76, None), (19.5, 0.5, 74, None),
    (20.0, 0.75, 76, 79), (20.75, 0.25, 74, None), (21.0, 0.5, 72, None), (21.5, 0.5, 74, None),
    (22.0, 0.75, 76, None), (22.75, 0.25, 79, None), (23.0, 1.0, 81, 79),
    (24.0, 1.5, 84, 86), (25.5, 0.5, 81, None), (26.0, 0.5, 79, None), (26.5, 0.5, 76, None), (27.0, 0.5, 74, None), (27.5, 0.5, 72, None),
    (28.25, 3.6, 81, 79),
]
for b, d, m, g in MEL:
    amp = 1.1 if b < 8 else 1.0
    if b >= 28:
        amp = 0.9
    sig = quena(m, bt(d) * 0.97, g, amp)
    if b >= 28:
        sig *= np.interp(np.arange(len(sig)) / SR, [0, 1.2, 2.25], [1, 0.8, 0.0])
    place(sig, bt(b), pan=-0.12, rev=0.42)

# eco de montaña de la quena: una copia retardada 3/4 de pulso, más oscura
echo_src = np.zeros(N)
for b, d, m, g in MEL:
    s = quena(m, bt(d) * 0.97, g, 0.9 if b < 28 else 0.6)
    i0 = int(bt(b) * SR)
    n = min(len(s), N - i0)
    echo_src[i0:i0 + n] += s[:n]
echo_src = lp(echo_src, 2200)
dly = int(bt(0.75) * SR)
for k, (pan, g) in enumerate([(0.55, 0.28), (-0.5, 0.14), (0.4, 0.07)]):
    d = dly * (k + 1)
    e = np.zeros(N)
    e[d:] = echo_src[:N - d]
    place(e, 0, gain=g, pan=pan, rev=0.6)

# ---- hilo de oro del intro: destellos que siguen la punta del hilo (paneo)
for k in range(16):
    tt = 0.25 + k * 0.115
    x = (tt - 0.15) / 1.9
    place(bell(midi([81, 84, 86, 88, 91][k % 5] + 12), 1.0, 0.35 + 0.2 * rng.random()), tt, pan=-0.9 + 1.8 * x, rev=0.7)

# zoom dentro del hilo (2.2 s) y giro hacia el teñido (7.2 s)
place(whoosh(0.6, 200, 5000, 0.9), 2.08, rev=0.4)
place(whoosh(1.0, 250, 6000, 0.7), 7.1, pan=-0.2, rev=0.45)   # giro de 90° (7,0-8,2 s)

# ---- hilado: arpegio de charango en semicorcheas que "gira"
for i in range(16):
    tt = bt(8 + i * 0.25)
    notes = [65, 69, 72, 77, 72, 69, 72, 77]
    m = notes[i % 8] + 12 * (i // 8 == 1 and i % 2 == 0)
    place(charango_note(m, 0.7, 0.45 + 0.15 * (i % 4 == 0), 0.5), tt, pan=0.35 * np.sin(i * 0.8), rev=0.3)
# zumbido del huso
t_sp = np.arange(int(2.6 * SR)) / SR
whirr = bp(rng.standard_normal(len(t_sp)), 900, 2600) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.5 * t_sp)) * np.minimum(1, t_sp / 0.4) * np.minimum(1, (2.6 - t_sp) / 0.3)
place(whirr * 0.025, 4.95, pan=0.05, rev=0.2)

# ---- teñido: gota, impacto y campana
place(drip(), bt(13), gain=0.8, rev=0.35)
place(bell(midi(69), 3.0, 1.6), bt(13), pan=0.0, rev=0.7)
place(bell(midi(76), 2.5, 0.8), bt(13) + 0.02, pan=0.3, rev=0.7)
place(bombo(0.8, 90, 45, 0.6), bt(13), rev=0.2)
# arpegio suave del compás 4 (G)
for i, m in enumerate([67, 71, 74, 79, 74, 71]):
    place(charango_note(m, 0.9, 0.4, 0.5), bt(14 + i * 0.333), pan=0.3, rev=0.35)

# latigazo del hilo hacia arriba (9.8 s)
place(whoosh(0.55, 500, 9000, 0.9), 9.72, pan=0.1, rev=0.3)

# ---- urdimbre: glissando de charango sincronizado con cada hilo que cae
PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for o in range(24):
    tt = 10.02 + o * 0.016 + 0.28   # cuando el hilo toca la viga inferior
    m = PENTA[min(len(PENTA) - 1, 2 + o * 12 // 24)]
    place(charango_note(m, 1.2, 0.33, 0.7), tt, pan=-0.6 + 1.2 * (o % 2), rev=0.35)
place(bombo(1.0), bt(16), rev=0.15)
# lizos: cada corchea una nota pulsada que alterna
for i in range(int((12.7 - 10.9) / (BEAT / 2))):
    tt = 10.9 + i * BEAT / 2
    place(charango_note([69, 76][i % 2], 0.5, 0.38, 0.45), tt, pan=[-0.3, 0.3][i % 2], rev=0.25)
    place(aro(0.5), tt, pan=0.4, rev=0.1)
place(bombo(0.7), bt(18), rev=0.15)
place(bombo(0.6), bt(19.5), rev=0.15)

# ---- tejido: rasgueo de huayno, bombo, aro y chajchas (pulsos 20-24)
STR = {20: 'F', 21: 'F', 22: 'G', 23: 'G'}
for b in range(20, 24):
    ch = STR[b]
    acc = 1.0 + 0.1 * (b - 20)
    strum(ch, bt(b), True, 0.75 * acc)
    strum(ch, bt(b + 0.5), False, 0.45 * acc, 0.010)
    strum(ch, bt(b + 0.75), True, 0.55 * acc, 0.010)
    place(bombo(0.95 if b % 2 == 0 else 0.6), bt(b), rev=0.12)
    place(aro(0.9), bt(b + 0.5), pan=0.35, rev=0.08)
    place(aro(0.6), bt(b + 0.75), pan=0.35, rev=0.08)
    for s in range(4):
        place(chajchas(0.7 + 0.15 * (b - 20) + 0.3 * (s == 0)), bt(b + s * 0.25), pan=-0.55, rev=0.25)
# redoble de bombo al final del tejido
for k in range(4):
    place(bombo(0.45 + 0.15 * k, 140, 60, 0.25), bt(23 + k * 0.25), rev=0.15)

# el textil se completa (15.0 s): golpe, acorde abierto y destello ascendente
place(bombo(1.1), bt(24), rev=0.25)
strum('Am', bt(24), True, 1.0, 0.02, 2.5)
place(chajchas(1.5, 0.3), bt(24), pan=-0.4, rev=0.5)
shimmer(15.1, [81, 84, 86, 88, 91, 93, 96], 0.07, 0.5)

# apus: la cordillera crece — swell grave y arpegio lejano
n_sw = int(2.1 * SR)
t_sw = np.arange(n_sw) / SR
swell = lp(rng.standard_normal(n_sw), 300) * (t_sw / 2.1) ** 2 * 0.4
place(swell, 15.4, rev=0.4)
for i, m in enumerate([60, 64, 67, 72, 67, 64, 69, 72, 76]):
    place(charango_note(m, 1.3, 0.3, 0.4), bt(25 + i * 0.333), pan=0.5 - 0.1 * i, rev=0.55)
# subida hacia el logo
place(whoosh(1.0, 150, 9000, 1.1), 16.55, rev=0.5)

# ---- logo (17.5 s): golpe grande, acorde final, estrellas de la Cruz del Sur
place(boom(3.0, 1.0), bt(28), rev=0.4)
place(bombo(1.2, 100, 42, 0.8), bt(28), rev=0.3)
strum('Am', bt(28), True, 0.9, 0.035, 2.6, pan=0.15)
# cada estrella que se enciende: la Cruz del Sur (izquierda) y las Pléyades (derecha)
for i, m in enumerate([88, 93, 91, 96, 86, 84, 89]):
    place(bell(midi(m), 2.2, 0.5), 17.45 + i * 0.07, pan=-0.75 + 0.05 * i, rev=0.75)
for i, m in enumerate([96, 100, 98, 103, 101, 105]):
    place(bell(midi(m), 1.6, 0.22), 17.85 + i * 0.07, pan=0.6 + 0.04 * i, rev=0.8)
# la Chakana se dibuja: brillo suave
shimmer(17.8, [81, 86, 88, 93], 0.22, 0.3, -0.3, 0.3)
# NOW IN UTAH
place(bell(midi(81), 2.5, 0.7), 19.0, rev=0.8)
place(bell(midi(88), 2.0, 0.35), 19.0, pan=0.3, rev=0.8)

# ------------------------------------------------------------------ reverb
def make_ir(seconds=3.4, seed=7):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        noise = r.standard_normal(n)
        # la cola se oscurece con el tiempo: mezcla de ruido claro y oscuro
        dark = lp(noise, 1800, 1)
        bright = noise
        mixk = np.exp(-t / 0.6)
        ir = (bright * mixk + dark * (1 - mixk)) * np.exp(-t * 6.9 / seconds)
        # reflexiones tempranas
        for k in range(10):
            ir[int(r.uniform(0.008, 0.07) * SR)] += r.uniform(0.3, 0.8) * r.choice([-1, 1])
        ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


irL, irR = make_ir()
wetL = fftconvolve(hp(RVL, 180), irL)[:N]
wetR = fftconvolve(hp(RVR, 180), irR)[:N]
outL = L + wetL * 0.9
outR = R + wetR * 0.9

# ------------------------------------------------------------------ máster
t = np.arange(N) / SR
fade = np.clip((DUR - t) / 0.45, 0, 1) ** 1.5
fade *= np.clip(t / 0.05, 0, 1)
outL *= fade
outR *= fade
# corte de graves inaudibles y limitador suave
outL, outR = hp(outL, 28), hp(outR, 28)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
g = 1.25 / peak
outL = np.tanh(outL * g) / np.tanh(1.25)
outR = np.tanh(outR * g) / np.tanh(1.25)
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
outL *= 0.89 / peak
outR *= 0.89 / peak

out = np.stack([outL, outR], axis=1)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'ancestral_music.wav', SR, (out * 32767).astype(np.int16))
print('ok', out.shape)
