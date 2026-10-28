"""Pista "future pop" de 10 s para el video de 8000 seguidores.

150 BPM (negra = 0,4 s, compás = 1,6 s). Clímax ("drop") en 4,8 s, cuando el
contador llega a 8000. Todo se sintetiza aquí: no usa samples externos.
Uso: python3 music.py salida.wav
"""
import sys
import wave
import numpy as np
from scipy import signal

SR = 44100
DUR = 10.0
N = int(SR * DUR)
BEAT = 60 / 150
BAR = BEAT * 4
S16 = BEAT / 4
DROP = 3 * BAR          # 4,8 s
rng = np.random.default_rng(8000)

L = np.zeros(N); Rch = np.zeros(N)
ML = np.zeros(N); MR = np.zeros(N)          # bus con bombeo (acordes, bajo)
send_L = np.zeros(N); send_R = np.zeros(N)   # bus de reverb
dly_L = np.zeros(N); dly_R = np.zeros(N)     # bus de delay


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(x, t0, gain=1.0, pan=0.0, rev=0.0, dly=0.0, pump=False):
    """Mezcla un mono (o (2,n) estéreo) en el instante t0."""
    i = int(round(t0 * SR))
    if i >= N:
        return
    if x.ndim == 1:
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        xl, xr = x * lg * 1.4142, x * rg * 1.4142
    else:
        xl, xr = x[0], x[1]
    n = min(len(xl), N - i)
    xl, xr = xl[:n] * gain, xr[:n] * gain
    if pump:
        ML[i:i + n] += xl; MR[i:i + n] += xr
    else:
        L[i:i + n] += xl; Rch[i:i + n] += xr
    if rev:
        send_L[i:i + n] += xl * rev; send_R[i:i + n] += xr * rev
    if dly:
        dly_L[i:i + n] += xl * dly; dly_R[i:i + n] += xr * dly


def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.08):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((dur - t) / r, 0, 1)
    return e * rel


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def saw(f, n, phase=0.0):
    """Sierra con poca aliasing (sobremuestreo x4)."""
    m = n * 4
    ph = (phase + np.arange(m) * f / (SR * 4)) % 1.0
    return signal.resample_poly(2 * ph - 1, 1, 4)[:n]


# ---------------- armonía ----------------
CH = {
    'F':  [53, 57, 60, 65, 69],
    'C':  [52, 55, 60, 64, 67],
    'Dm': [53, 57, 62, 65, 69],
    'Bb': [53, 58, 62, 65, 70],
}
ROOT = {'F': 41, 'C': 36, 'Dm': 38, 'Bb': 34}
ARP = {
    'F':  [69, 72, 77, 72], 'C': [67, 72, 76, 72],
    'Dm': [69, 74, 77, 74], 'Bb': [70, 74, 77, 79],
    'C2': [72, 76, 79, 81],
}
# (inicio, duración, acorde) — intro/build y drop
INTRO = [(0, BAR, 'F'), (BAR, BAR, 'Dm'), (2 * BAR, BEAT * 2, 'Bb'), (2 * BAR + 2 * BEAT, BEAT * 2, 'C')]
DROPC = [(DROP + i * 2 * BEAT, 2 * BEAT, c) for i, c in enumerate(['F', 'C', 'Dm', 'Bb', 'Bb', 'C'])]
FINAL = 6 * BAR          # 9,6 s: resolución en F


def supersaw(notes, n, cutoff, voices=7, spread=0.18):
    out = np.zeros((2, n))
    for m in notes:
        for v in range(voices):
            det = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
            x = saw(mtof(m + det), n, rng.random())
            pan = (v - (voices - 1) / 2) / ((voices - 1) / 2) * 0.8
            out[0] += x * np.cos((pan + 1) * np.pi / 4)
            out[1] += x * np.sin((pan + 1) * np.pi / 4)
    out /= voices * len(notes) ** 0.6
    return np.stack([lp(out[0], cutoff), lp(out[1], cutoff)])


def pluck(m, dur=0.35, bright=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = 0.6 * saw(mtof(m), n) + 0.4 * np.sign(np.sin(2 * np.pi * mtof(m) * t)) * 0.5
    # filtro que se cierra rápido: mezcla de versión brillante y opaca
    a = np.exp(-t / 0.05)
    x = lp(x, 9000 * bright) * a + lp(x, 1400 * bright) * (1 - a)
    return x * np.exp(-t / 0.16) * env_adsr(n, 0.002, 1, 1, 0.03)


def kick(gain=1.0):
    n = int(SR * 0.45)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.25
    return np.tanh((x + click) * 1.6) * gain


def snare(gain=1.0, tone=200):
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * tone * t) * np.exp(-t / 0.05) * 0.6
    nz = bp(rng.standard_normal(n), 1500, 9000) * np.exp(-t / 0.09)
    return (body + nz) * gain


def clap(gain=1.0):
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        e += np.where(t >= off, np.exp(-(t - off) / (0.012 if k < 2 else 0.12)), 0)
    return nz * e * gain * 0.7


def hat(open_=False, gain=1.0):
    n = int(SR * (0.25 if open_ else 0.06))
    t = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 7000), 13000) * np.exp(-t / (0.08 if open_ else 0.015)) * gain


def crash(dur=1.6, gain=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = lp(hp(rng.standard_normal(n), 4000), 12000) * np.exp(-t / (dur / 3.5))
    return x * gain


def boom(gain=1.0):
    n = int(SR * 1.2)
    t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t / 0.12)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45) * 1.8) * gain


def riser(t0, t1, gain=1.0, lo=400, hi=9000):
    n = int(SR * (t1 - t0))
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        k = i / n
        fc = lo * (hi / lo) ** (k ** 1.6)
        out[i:i + seg] = bp(nz[i:i + seg + 0], fc * 0.7, fc * 1.3, 1)[:len(out[i:i + seg])]
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (3 * t / t[-1])) / SR) * 0.15
    e = (np.arange(n) / n) ** 2
    add((out + tone) * e * gain, t0, rev=0.3)


def whoosh(t0, dur, gain=1.0):
    n = int(SR * dur)
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        k = i / n
        fc = 300 * (6000 / 300) ** np.sin(np.pi * k)
        out[i:i + seg] = bp(nz[i:i + seg], fc * 0.6, fc * 1.6, 1)[:len(out[i:i + seg])]
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    x = out * e * gain
    # paneo de izquierda a derecha
    pan = np.linspace(-0.7, 0.7, n)
    st = np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)]) * 1.4
    add(st, t0, rev=0.25)


def blip(t0, f0, gain=1.0):
    n = int(SR * 0.16)
    t = np.arange(n) / SR
    f = f0 * (0.7 + 0.3 * (1 - np.exp(-t / 0.015)))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05)
    add(x * gain, t0, pan=0.0, rev=0.35, dly=0.25)


# ---------------- sidechain (bombeo) ----------------
kick_times = []


def sc_curve():
    c = np.ones(N)
    t = np.arange(N) / SR
    for kt in kick_times:
        i = int(kt * SR)
        m = min(N - i, int(SR * 0.4))
        tt = t[:m]
        c[i:i + m] = np.minimum(c[i:i + m], 1 - 0.75 * np.exp(-tt / 0.09))
    return c


# ---------------- arreglo ----------------
# 1) Intro + build: pad abriendo filtro y arpegio en corcheas
for t0, d, ch in INTRO:
    n = int(SR * d)
    cut = 700 + 2600 * (t0 / DROP) ** 1.5
    pad = supersaw(CH[ch], n, cut) * env_adsr(n, 0.04, 1, 1, 0.05)
    add(pad, t0, gain=0.75, rev=0.35, pump=True)
    pat = ARP[ch]
    for k in range(int(round(d / (BEAT / 2)))):
        tk = t0 + k * BEAT / 2
        add(pluck(pat[k % 4], bright=0.35 + 0.65 * tk / DROP), tk, gain=0.6,
            pan=0.3 * (-1) ** k, rev=0.25, dly=0.35)

# Shaker en semicorcheas desde el compás 1
for k in range(int(DROP / S16)):
    tk = k * S16
    add(hat(gain=0.05 + 0.07 * (k % 2 == 0)), tk, pan=0.25)

# Bombo en negras durante el build (compases 2–3)
for k in range(8):
    tk = BAR + k * BEAT
    add(kick(0.4 + 0.35 * k / 7), tk)
    kick_times.append(tk)

# Redoble acelerando hacia el drop
for k in range(4):
    add(snare(0.25 + 0.1 * k), 2 * BAR + k * BEAT / 2, rev=0.2)
for k in range(8):
    add(snare(0.4 + 0.07 * k, tone=200 + 15 * k), 2 * BAR + 2 * BEAT + k * S16, rev=0.2)
riser(1.9, DROP, gain=0.35)

# Silencio de 80 ms antes del drop: da más golpe al llegar a 8000
gap = np.ones(N)
g0, g1 = int((DROP - 0.08) * SR), int(DROP * SR)
gap[g0 - 220:g0] = np.linspace(1, 0, 220); gap[g0:g1] = 0
for buf in (L, Rch, ML, MR, send_L, send_R, dly_L, dly_R):
    buf *= gap

# 2) DROP en 4,8 s (llega a 8000)
add(boom(0.9), DROP)
add(crash(2.0, 0.22), DROP, rev=0.3)
stab_steps = [0, 3, 6, 8, 10, 12, 14]                 # patrón sincopado por compás
bar_kicks = [0, 3, 10]
for bi in range(3):                                    # compases 4, 5 y 6
    b0 = DROP + bi * BAR
    for st in bar_kicks:
        add(kick(1.0), b0 + st * S16); kick_times.append(b0 + st * S16)
    add(snare(0.55), b0 + 8 * S16, rev=0.25)
    add(clap(0.8), b0 + 8 * S16, rev=0.3)
    for st in range(0, 16, 2):
        add(hat(gain=0.18), b0 + st * S16 + S16, pan=-0.2)
    add(hat(True, 0.12), b0 + 14 * S16, pan=0.2)

# Acordes del drop: golpes sincopados de supersaw
for i, (t0, d, ch) in enumerate(DROPC):
    bar_off = ((t0 - DROP) % BAR) / S16              # 0 u 8 (mitad de compás)
    for st in stab_steps:
        if bar_off <= st < bar_off + 8:
            ts = t0 + (st - bar_off) * S16
            ln = S16 * (2 if st in (0, 8) else 1.4)
            n = int(SR * ln)
            x = supersaw(CH[ch], n, 5200) * env_adsr(n, 0.003, 0.12, 0.6, 0.03)
            add(x, ts, gain=0.55, rev=0.3, pump=True)
    # Bajo: raíz con saturación, sigue el acorde
    n = int(SR * d)
    tt = np.arange(n) / SR
    f = mtof(ROOT[ch])
    b = np.tanh(2.2 * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)))
    add(lp(b, 900) * env_adsr(n, 0.005, 1, 1, 0.04), t0, gain=0.42, pump=True)
    # Gancho melódico (pluck con eco)
    pat = ARP['C2'] if (ch == 'C' and i == 5) else ARP[ch]
    for k in range(4):
        add(pluck(pat[k] + 12, 0.3, 1.0), t0 + k * BEAT / 2, gain=0.22,
            pan=0.35 * (-1) ** k, rev=0.3, dly=0.4)

# 3) Transiciones del video
whoosh(5.55, 0.75, 0.55)            # barrido al fondo blanco
whoosh(7.45, 0.6, 0.45)             # el círculo se abre
riser(7.2, 8.0, gain=0.2, lo=800, hi=7000)
for k in range(4):                  # mini-redoble antes del compás 6
    add(snare(0.3 + 0.08 * k), 7.6 + k * S16, rev=0.2)
add(crash(1.2, 0.2), 8.0, rev=0.3)

# Pastillas CTA (8,4 / 8,6 / 8,8) y "tap" en Comparte (9,4)
for tk, m in [(8.4, 84), (8.6, 88), (8.8, 91)]:
    blip(tk, mtof(m), 0.3)
blip(9.4, mtof(96), 0.35)

# 4) Final: acorde de F que resuelve en 9,6 s
n = int(SR * (DUR - FINAL))
x = supersaw(CH['F'] + [72, 77], n, 6000) * env_adsr(n, 0.003, 0.25, 0.45, 0.2)
add(x, FINAL, gain=0.6, rev=0.5)
add(kick(1.0), FINAL); kick_times.append(FINAL)
add(boom(0.5), FINAL)
add(crash(1.0, 0.3), FINAL, rev=0.4)
tt = np.arange(n) / SR
add(lp(np.tanh(2 * np.sin(2 * np.pi * mtof(41) * tt)), 900) * env_adsr(n, 0.005, 0.3, 0.5, 0.2), FINAL, gain=0.4)
add(pluck(89, 0.4), FINAL, gain=0.25, rev=0.4, dly=0.4)

# ---------------- mezcla ----------------
sc = sc_curve()
L += ML * sc; Rch += MR * sc

# Delay de corchea con puntillo, ping-pong
d = int(SR * BEAT * 0.75)
dl = np.zeros(N); dr = np.zeros(N)
for k in range(1, 5):
    g = 0.42 ** k
    src_l, src_r = (dly_R, dly_L) if k % 2 else (dly_L, dly_R)
    dl[k * d:] += src_l[:N - k * d] * g
    dr[k * d:] += src_r[:N - k * d] * g
dl, dr = lp(hp(dl, 400), 6000), lp(hp(dr, 400), 6000)
L += dl * 0.8; Rch += dr * 0.8
send_L += dl * 0.3; send_R += dr * 0.3

# Reverb: convolución con ruido decreciente (estéreo decorrelado)
ir_n = int(SR * 1.4)
ti = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-ti / 0.35)
irR = rng.standard_normal(ir_n) * np.exp(-ti / 0.35)
irL, irR = lp(hp(irL, 300), 7000), lp(hp(irR, 300), 7000)
rvL = signal.fftconvolve(send_L, irL)[:N] * 0.05
rvR = signal.fftconvolve(send_R, irR)[:N] * 0.05
L += rvL * sc; Rch += rvR * sc

# Bombeo general suave (glue) + master
glue = 1 - 0.18 * (1 - sc)
L *= glue; Rch *= glue
mix = np.stack([L, Rch])
mix = np.stack([hp(mix[0], 25), hp(mix[1], 25)])
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)            # saturación suave = más "punch"
fade_n = int(SR * 0.35)
mix[:, -fade_n:] *= np.linspace(1, 0, fade_n) ** 1.5
mix[:, :int(SR * 0.01)] *= np.linspace(0, 1, int(SR * 0.01))
mix *= 10 ** (-1 / 20)                               # techo -1 dBFS

pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', sys.argv[1])
