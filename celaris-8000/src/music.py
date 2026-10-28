"""Pista "nu-disco pop" de 19 s para el video de 8000 seguidores.

Moderna y bailable: bombo four-on-the-floor, bajo en octavas, acordes de
sintetizador con bombeo, pluck y "vocal chops" sintéticos. Brillo controlado:
hats y platillos filtrados, sin supersaws.
100 BPM (negra = 0,6 s, compás = 2,4 s). Cada escena dura medio compás (1,2 s)
más que en la versión de 13 s, para dar tiempo de lectura:
  0,0  intro         · 3,6 build     · 6,0 drop (llega a 8000)
  10,8 CTA           · 14,4 cierre de marca "Enciende tu poder"
  18,0 acorde final que resuelve y se apaga en 19 s
Todo se sintetiza aquí, sin samples. Uso: python3 music.py salida.wav
"""
import sys
import wave
import numpy as np
from scipy import signal

SR = 44100
DUR = 19.0
N = int(SR * DUR)
BEAT = 60 / 100
BAR = BEAT * 4
S16 = BEAT / 4
BUILD = 1.5 * BAR       # 3,6 s
DROP = 2.5 * BAR        # 6,0 s
CTA = 4.5 * BAR         # 10,8 s
BRAND = 6 * BAR         # 14,4 s
FINAL = 7.5 * BAR       # 18,0 s
rng = np.random.default_rng(8000)

L = np.zeros(N); Rch = np.zeros(N)
ML = np.zeros(N); MR = np.zeros(N)            # bus con bombeo (acordes, pads, bajo)
send_L = np.zeros(N); send_R = np.zeros(N)    # envío a reverb
dly_L = np.zeros(N); dly_R = np.zeros(N)      # envío a delay


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(x, t0, gain=1.0, pan=0.0, rev=0.0, dly=0.0, pump=False):
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


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)


def tail(n, r=0.03):
    e = np.ones(n)
    k = min(n, int(SR * r))
    e[-k:] = np.linspace(1, 0, k)
    return e


def saw(f, n, phase=0.0):
    """Sierra con poca aliasing (sobremuestreo x4); f puede ser un array."""
    m = n * 4
    ff = np.repeat(f, 4)[:m] if np.ndim(f) else f
    ph = (phase + np.cumsum(np.broadcast_to(ff, (m,))) / (SR * 4)) % 1.0
    return signal.resample_poly(2 * ph - 1, 1, 4)[:n]


def filt_env(x, bright, dark, tau):
    """Filtro que se cierra: mezcla versión brillante → opaca con envolvente."""
    t = np.arange(len(x)) / SR
    a = np.exp(-t / tau)
    return lp(x, bright) * a + lp(x, dark) * (1 - a)


# ---------------- instrumentos ----------------
def stab(notes, dur, bright=4200, vel=1.0):
    """Acorde de sintetizador (3 sierras desafinadas por nota, estéreo)."""
    n = int(SR * dur)
    out = np.zeros((2, n))
    for m in notes:
        for v, (det, pan) in enumerate(((-0.08, -0.6), (0.0, 0.0), (0.08, 0.6))):
            x = saw(mtof(m + det), n, rng.random())
            out[0] += x * np.cos((pan + 1) * np.pi / 4)
            out[1] += x * np.sin((pan + 1) * np.pi / 4)
    out /= 3 * len(notes) ** 0.7
    e = np.minimum(1, np.arange(n) / (SR * 0.004)) * tail(n, 0.04)
    return np.stack([filt_env(out[c], bright, 900, 0.09) for c in (0, 1)]) * e * vel


def pad(notes, dur, cutoff):
    n = int(SR * dur)
    out = np.zeros((2, n))
    for m in notes:
        for c, det in enumerate((-0.1, 0.1)):
            out[c] += saw(mtof(m + det), n, rng.random())
    out = np.stack([lp(out[0], cutoff), lp(out[1], cutoff)]) / len(notes)
    t = np.arange(n) / SR
    return out * np.minimum(1, t / 0.2) * tail(n, 0.15)


def pluck(m, dur=0.4):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = mtof(m)
    x = 0.6 * saw(f, n) + 0.4 * np.sign(np.sin(2 * np.pi * f * t))
    x = filt_env(x, 6000, 1100, 0.05)
    return x * np.exp(-t / 0.18) * np.minimum(1, t / 0.002) * tail(n)


FORMANTS = {'a': [(750, 1.0), (1180, 0.55), (2500, 0.18)],
            'o': [(500, 1.0), (850, 0.6), (2400, 0.12)]}


def vchop(m, dur=0.3, vowel='a'):
    """'Vocal chop' sintético: sierra por filtros de formantes + subida de tono."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = mtof(m) * 2 ** ((-0.8 * np.exp(-t / 0.03) + 0.06 * np.sin(2 * np.pi * 5.5 * t) * (t > 0.08)) / 12)
    src = saw(f, n)
    x = sum(g * bp(src, fc * 0.88, fc * 1.12) for fc, g in FORMANTS[vowel])
    e = np.minimum(1, t / 0.008) * np.exp(-t / 0.22) * tail(n, 0.04)
    return x * e * 2.2


def bass(m, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = mtof(m)
    x = 0.7 * saw(f, n) + 0.6 * np.sin(2 * np.pi * f * t)
    x = filt_env(x, 1600, 380, 0.06)
    return np.tanh(1.5 * x) * np.minimum(1, t / 0.003) * tail(n, 0.02)


def kick(gain=1.0):
    n = int(SR * 0.4)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t / 0.028)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17)
    click = lp(hp(rng.standard_normal(n), 1500), 6000) * np.exp(-t / 0.003) * 0.2
    return np.tanh(1.5 * (x + click)) * gain


def clap(gain=1.0):
    n = int(SR * 0.32)
    t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 1000, 6500)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        e += np.where(t >= off, np.exp(-(t - off) / (0.01 if k < 2 else 0.1)), 0)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.4
    return (nz * e * 0.7 + body) * gain


def hat(open_=False, gain=1.0):
    n = int(SR * (0.22 if open_ else 0.05))
    t = np.arange(n) / SR
    x = lp(hp(rng.standard_normal(n), 6500), 11500)
    return x * np.exp(-t / (0.07 if open_ else 0.014)) * gain


def crash(dur=1.5, gain=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 3000), 9000) * np.exp(-t / (dur / 3.5)) * gain


def boom(gain=1.0):
    n = int(SR * 1.0)
    t = np.arange(n) / SR
    f = 36 + 50 * np.exp(-t / 0.1)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.4) * 1.6) * gain


def noise_sweep(t0, dur, lo, hi, shape, gain=1.0, pan_sweep=False):
    n = int(SR * dur)
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        fc = lo * (hi / lo) ** shape(i / n)
        out[i:i + seg] = bp(nz[i:i + seg], fc * 0.65, fc * 1.4, 1)[:len(out[i:i + seg])]
    if pan_sweep:
        x = out * np.sin(np.pi * np.arange(n) / n) ** 2 * gain
        pan = np.linspace(-0.6, 0.6, n)
        add(np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)]) * 1.4, t0, rev=0.25)
    else:
        add(out * (np.arange(n) / n) ** 2 * gain, t0, rev=0.3)


# ---------------- armonía (Fa mayor) ----------------
CH = {
    'F':  [57, 60, 64, 65],        # Fmaj7
    'C':  [55, 60, 62, 64],        # Cadd9
    'Dm': [57, 60, 62, 65],        # Dm7
    'Bb': [58, 62, 65, 69],        # Bbmaj7
}
ROOT = {'F': 41, 'C': 36, 'Dm': 38, 'Bb': 34}
H, Q = BAR / 2, BAR / 4
INTRO = [(0, BAR, 'F'), (BAR, H, 'C'),
         (BUILD, H, 'Dm'), (BUILD + H, Q, 'Bb'), (BUILD + H + Q, Q, 'C')]
GROOVE = [(DROP, H, 'F'), (DROP + H, H, 'C'), (DROP + 2 * H, H, 'Dm'), (DROP + 3 * H, H, 'Bb'),
          (CTA, H, 'Dm'), (CTA + H, H, 'Bb'), (CTA + 2 * H, H, 'C'),
          (BRAND, H, 'F'), (BRAND + H, H, 'Bb'), (BRAND + 2 * H, H, 'C')]
# gancho (semicorcheas dentro de cada medio compás): pluck + vocal chop
HOOK = {'F': [(0, 72), (3, 77), (6, 76)], 'C': [(0, 76), (3, 72), (6, 67)],
        'Dm': [(0, 74), (3, 72), (6, 69)], 'Bb': [(0, 74), (3, 77), (6, 74)]}
STAB_STEPS = (0, 3, 6)                               # acordes sincopados por medio compás

kick_times = []

# ---------------- 1) intro + build (0 – 6,0 s) ----------------
for t0, d, ch in INTRO:
    add(pad(CH[ch], d + 0.1, 600 + 2400 * (t0 / DROP) ** 1.3), t0, gain=0.65, rev=0.3, pump=True)
arp = {'F': [65, 69, 72, 76], 'Dm': [62, 65, 69, 72], 'Bb': [62, 65, 70, 74], 'C': [64, 67, 72, 76]}
for t0, d, ch in INTRO:
    for k in range(int(round(d / (BEAT / 2)))):
        tk = t0 + k * BEAT / 2
        add(pluck(arp[ch][k % 4]), tk, gain=0.42 + 0.12 * tk / DROP, pan=0.35 * (-1) ** k, rev=0.25, dly=0.3)
for k in range(int(DROP / (BEAT / 2))):              # hats en corcheas desde el inicio
    add(hat(gain=0.12 + 0.06 * (k % 2)), k * BEAT / 2, pan=0.2)
for k in range(4):                                   # bombo entrando en el build
    tk = BUILD + k * BEAT
    add(kick(0.45 + 0.15 * k), tk); kick_times.append(tk)
for k in range(8):                                   # redoble de palmas hacia el drop
    add(clap(0.15 + 0.05 * k), BUILD + 2 * BEAT + k * S16, rev=0.2)
noise_sweep(BUILD, DROP - BUILD, 300, 6000, lambda k: k ** 1.6, gain=0.3)
add(vchop(77, 0.5, 'o'), DROP - 2 * S16, gain=0.3, rev=0.4, dly=0.3)   # "oh" antes del drop

gap = np.ones(N)                                     # silencio de 60 ms antes del drop
g0, g1 = int((DROP - 0.06) * SR), int(DROP * SR)
gap[g0 - 200:g0] = np.linspace(1, 0, 200); gap[g0:g1] = 0
for buf in (L, Rch, ML, MR, send_L, send_R, dly_L, dly_R):
    buf *= gap

# ---------------- 2) groove (6,0 – 18,0 s) ----------------
for tk, g in ((DROP, 0.6), (BRAND, 0.45)):
    add(boom(g), tk)
    add(crash(1.6, 0.16), tk, rev=0.3)
for k in range(int(round((FINAL - DROP) / BEAT))):   # four-on-the-floor, palmas en 2 y 4
    tk = DROP + k * BEAT
    add(kick(1.0), tk); kick_times.append(tk)
    if k % 2 == 1:
        add(clap(0.6), tk, rev=0.25)
    add(hat(True, 0.22), tk + BEAT / 2, pan=0.2)     # hat abierto en contratiempo
    for s in (1, 3):
        add(hat(gain=0.1), tk + s * S16, pan=-0.25)

for t0, d, ch in GROOVE:
    for st in STAB_STEPS:                            # acordes sincopados
        if st * S16 < d - 1e-6:
            add(stab(CH[ch], S16 * 2.2, 4200), t0 + st * S16, gain=0.7, rev=0.25, pump=True)
    add(pad(CH[ch], d, 1800), t0, gain=0.14, pump=True)
    for k in range(int(round(d / (BEAT / 2)))):      # bajo en octavas (disco)
        add(bass(ROOT[ch] + 12 * (k % 2), BEAT / 2 * 0.85), t0 + k * BEAT / 2, gain=0.38, pump=True)
    # gancho en el drop y en la marca; durante el CTA lo reemplazan las pastillas
    in_cta = CTA - 1e-6 < t0 < BRAND - 1e-6
    if ch in HOOK and not in_cta:
        for st, m in HOOK[ch]:
            add(pluck(m, 0.45), t0 + st * S16, gain=0.3, pan=0.25, rev=0.25, dly=0.3)
            add(vchop(m, 0.32, 'a'), t0 + st * S16, gain=0.26, pan=-0.15, rev=0.3, dly=0.2)

# transiciones del video
noise_sweep(7.75, 0.75, 300, 4500, lambda k: np.sin(np.pi * k), gain=0.35, pan_sweep=True)   # barrido a blanco
noise_sweep(10.35, 0.6, 300, 4500, lambda k: np.sin(np.pi * k), gain=0.3, pan_sweep=True)    # círculo
noise_sweep(13.8, 0.6, 400, 6000, lambda k: k ** 1.5, gain=0.25)                              # hacia la marca

# pastillas del CTA (12,0 / 12,3 / 12,6) y "tap" en Compartiendo (12,9): vocal chops
for tk, m in [(12.0, 74), (12.3, 77), (12.6, 79), (12.9, 81)]:
    add(vchop(m, 0.35, 'a'), tk, gain=0.36, rev=0.3, dly=0.3)
    add(pluck(m, 0.35), tk, gain=0.2, rev=0.2)

# ---------------- 3) acorde final (18,0 – 19,0 s) ----------------
n_end = DUR - FINAL
add(stab(CH['F'] + [69, 72], n_end, 5000, 1.2), FINAL, gain=0.6, rev=0.5, pump=True)
add(pad(CH['F'], n_end, 2500), FINAL, gain=0.25, rev=0.4)
add(bass(41, 0.8), FINAL, gain=0.55)
add(kick(1.0), FINAL); kick_times.append(FINAL)
add(boom(0.45), FINAL)
add(crash(1.2, 0.18), FINAL, rev=0.4)
add(vchop(77, 0.6, 'o'), FINAL, gain=0.32, rev=0.5, dly=0.35)

# ---------------- mezcla ----------------
t_all = np.arange(N) / SR
sc = np.ones(N)
for kt in kick_times:                                # sidechain marcado (sonido actual)
    i = int(kt * SR); m = min(N - i, int(SR * 0.35))
    sc[i:i + m] = np.minimum(sc[i:i + m], 1 - 0.6 * np.exp(-t_all[:m] / 0.09))
L += ML * sc; Rch += MR * sc

d = int(SR * BEAT * 0.75)                            # delay corchea con puntillo, ping-pong
dl = np.zeros(N); dr = np.zeros(N)
for k in range(1, 4):
    g = 0.4 ** k
    sl, sr_ = (dly_R, dly_L) if k % 2 else (dly_L, dly_R)
    dl[k * d:] += sl[:N - k * d] * g
    dr[k * d:] += sr_[:N - k * d] * g
dl, dr = lp(hp(dl, 350), 5000), lp(hp(dr, 350), 5000)
L += dl * 0.7; Rch += dr * 0.7

ir_n = int(SR * 1.5)                                 # reverb
ti = np.arange(ir_n) / SR
irL = lp(hp(rng.standard_normal(ir_n) * np.exp(-ti / 0.38), 250), 6500)
irR = lp(hp(rng.standard_normal(ir_n) * np.exp(-ti / 0.38), 250), 6500)
L += signal.fftconvolve(send_L, irL)[:N] * 0.045 * sc
Rch += signal.fftconvolve(send_R, irR)[:N] * 0.045 * sc

mix = np.stack([hp(L, 28), hp(Rch, 28)])
mix = np.stack([lp(mix[0], 14000), lp(mix[1], 14000)])
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
fade_n = int(SR * 0.5)
mix[:, -fade_n:] *= np.linspace(1, 0, fade_n) ** 1.5
mix[:, :int(SR * 0.01)] *= np.linspace(0, 1, int(SR * 0.01))
mix *= 10 ** (-1 / 20)                               # techo -1 dBFS

pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', sys.argv[1])
