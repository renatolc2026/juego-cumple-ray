"""Pista "tropical / chill house" de 10 s para el video de 8000 seguidores.

Moderna pero cálida: piano eléctrico (FM), marimba, bajo redondo y batería
suave; sin supersaws ni platillos brillantes, con el master filtrado arriba.
100 BPM (negra = 0,6 s, compás = 2,4 s): el drop cae en 4,8 s (llega a 8000),
el cierre entra en 7,2 s y el acorde final resuelve en 9,6 s.
Todo se sintetiza aquí, sin samples. Uso: python3 music.py salida.wav
"""
import sys
import wave
import numpy as np
from scipy import signal

SR = 44100
DUR = 10.0
N = int(SR * DUR)
BEAT = 60 / 100
BAR = BEAT * 4
S16 = BEAT / 4
DROP = 2 * BAR          # 4,8 s
OUTRO = 3 * BAR         # 7,2 s
FINAL = 4 * BAR         # 9,6 s
rng = np.random.default_rng(8000)

L = np.zeros(N); Rch = np.zeros(N)
ML = np.zeros(N); MR = np.zeros(N)            # bus con bombeo (teclas, pad, bajo)
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
    """Rampa de salida para que ninguna nota corte en seco."""
    e = np.ones(n)
    k = min(n, int(SR * r))
    e[-k:] = np.linspace(1, 0, k)
    return e


# ---------------- instrumentos ----------------
def epiano(notes, dur, vel=1.0):
    """Piano eléctrico tipo Rhodes por FM, con trémolo estéreo suave."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = mtof(m)
        idx = 1.1 * vel * np.exp(-t / 0.3) + 0.15
        out += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * np.exp(-t / 1.4)
    out *= tail(n, 0.06) / len(notes) ** 0.7
    out = lp(out, 3200)
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * 3.0 * t)
    return np.stack([out * (0.75 + 0.25 * trem), out * (1.0 - 0.25 * trem)]) * vel


def marimba(m, dur=0.6):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.28)
         + 0.22 * np.sin(2 * np.pi * 3.98 * f * t) * np.exp(-t / 0.035)
         + 0.08 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.12))
    x *= np.minimum(1, t / 0.002)
    return lp(x, 6500) * tail(n)


def pad(notes, dur, cutoff=1200):
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        for c, det in enumerate((-0.07, 0.07)):
            ph = rng.random()
            tri = 2 * np.abs(2 * ((mtof(m + det) * t + ph) % 1) - 1) - 1
            out[c] += tri
    out = np.stack([lp(out[0], cutoff), lp(out[1], cutoff)]) / len(notes)
    e = np.minimum(1, t / 0.25) * tail(n, 0.2)
    return out * e


def bass(m, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    x = np.tanh(1.4 * x) * np.minimum(1, t / 0.004) * np.exp(-t / 0.5) * tail(n, 0.04)
    return lp(x, 650)


def kick(gain=1.0):
    n = int(SR * 0.4)
    t = np.arange(n) / SR
    f = 48 + 80 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    return lp(np.tanh(1.3 * x), 2500) * gain


def clap(gain=1.0):
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 4200)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.012, 0.024]):
        e += np.where(t >= off, np.exp(-(t - off) / (0.01 if k < 2 else 0.09)), 0)
    return nz * e * gain * 0.6


def rim(gain=1.0):
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.02) + 0.3 * bp(rng.standard_normal(n), 1500, 4000) * np.exp(-t / 0.01)
    return x * gain


def shaker(gain=1.0):
    n = int(SR * 0.07)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 4000, 8500) * np.minimum(1, t / 0.008) * np.exp(-t / 0.025)
    return x * gain


def swell(t0, t1, gain=1.0, lo=250, hi=2800):
    """Subida de ruido filtrado, cálida (sin llegar a agudos)."""
    n = int(SR * (t1 - t0))
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        fc = lo * (hi / lo) ** ((i / n) ** 1.5)
        out[i:i + seg] = bp(nz[i:i + seg], fc * 0.7, fc * 1.3, 1)[:len(out[i:i + seg])]
    e = (np.arange(n) / n) ** 2
    add(out * e * gain, t0, rev=0.3)


def whoosh(t0, dur, gain=1.0):
    n = int(SR * dur)
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        fc = 250 * (2600 / 250) ** np.sin(np.pi * i / n)
        out[i:i + seg] = bp(nz[i:i + seg], fc * 0.6, fc * 1.5, 1)[:len(out[i:i + seg])]
    x = out * np.sin(np.pi * np.arange(n) / n) ** 2 * gain
    pan = np.linspace(-0.6, 0.6, n)
    add(np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)]) * 1.4, t0, rev=0.25)


def boom(gain=1.0):
    n = int(SR * 1.0)
    t = np.arange(n) / SR
    f = 36 + 40 * np.exp(-t / 0.1)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.4) * 1.5) * gain


# ---------------- armonía (Fa mayor) ----------------
CH = {   # voicings medios, sin notas agudas
    'F':  [57, 60, 64, 65],        # Fmaj7: A C E F
    'C':  [55, 60, 62, 64],        # Cadd9: G C D E
    'Dm': [57, 60, 62, 65],        # Dm7: A C D F
    'Bb': [58, 62, 65, 69],        # Bbmaj7: Bb D F A
}
ROOT = {'F': 41, 'C': 36, 'Dm': 38, 'Bb': 34}
# (inicio, duración, acorde)
INTRO = [(0, BAR, 'F'), (BAR, BAR / 2, 'Dm'), (BAR * 1.5, BAR / 4, 'Bb'), (BAR * 1.75, BAR / 4, 'C')]
DROPC = [(DROP, BAR / 2, 'F'), (DROP + BAR / 2, BAR / 2, 'C'),
         (OUTRO, BAR / 2, 'Dm'), (OUTRO + BAR / 2, BAR / 4, 'Bb'), (OUTRO + BAR * 0.75, BAR / 4, 'C')]
# gancho de marimba con ritmo de tresillo (semicorcheas 0, 3, 6)
HOOK = {'F': [77, 76, 72], 'C': [76, 72, 67], 'Dm': [74, 72, 69]}

kick_times = []

# ---------------- 1) intro + build (0 – 4,8 s) ----------------
for t0, d, ch in INTRO:
    add(epiano(CH[ch], d + 0.3, 0.7), t0, gain=0.5, rev=0.35, pump=True)
    add(pad(CH[ch], d, 700 + 900 * t0 / DROP), t0, gain=0.22, rev=0.3, pump=True)
# marimba arpegiando en corcheas, cada vez más presente
arp = {'F': [65, 69, 72, 69], 'Dm': [62, 65, 69, 65], 'Bb': [62, 65, 70, 65], 'C': [64, 67, 72, 67]}
for t0, d, ch in INTRO:
    for k in range(int(round(d / (BEAT / 2)))):
        tk = t0 + k * BEAT / 2
        add(marimba(arp[ch][k % 4]), tk, gain=0.22 + 0.18 * tk / DROP, pan=0.3 * (-1) ** k, rev=0.25, dly=0.25)
for k in range(int(DROP / S16)):
    add(shaker(0.1 + 0.1 * (k % 2 == 1)), k * S16, pan=0.3)
for k in range(4):                                   # bombo suave en el compás 2
    tk = BAR + k * BEAT
    add(kick(0.35 + 0.15 * k), tk); kick_times.append(tk)
for k in range(8):                                   # redoble de rim hacia el drop
    add(rim(0.12 + 0.03 * k), BAR + 2 * BEAT + k * S16, pan=-0.2, rev=0.2)
swell(2.4, DROP, 0.3)

# silencio de 60 ms antes del drop
gap = np.ones(N)
g0, g1 = int((DROP - 0.06) * SR), int(DROP * SR)
gap[g0 - 200:g0] = np.linspace(1, 0, 200); gap[g0:g1] = 0
for buf in (L, Rch, ML, MR, send_L, send_R, dly_L, dly_R):
    buf *= gap

# ---------------- 2) drop (4,8 – 9,6 s) ----------------
add(boom(0.6), DROP)
for k in range(int((FINAL - DROP) / BEAT)):          # four-on-the-floor + palmas en 2 y 4
    tk = DROP + k * BEAT
    add(kick(0.9), tk); kick_times.append(tk)
    if k % 2 == 1:
        add(clap(0.55), tk, rev=0.3)
    add(shaker(0.26), tk + BEAT / 2, pan=0.25)       # contratiempo
    add(shaker(0.1), tk + 3 * S16, pan=-0.25)

for i, (t0, d, ch) in enumerate(DROPC):
    # teclas: acorde en el tiempo + golpes en contratiempo (house)
    add(epiano(CH[ch], d + 0.2, 0.9), t0, gain=0.45, rev=0.3, pump=True)
    for k in range(int(round(d / BEAT))):
        add(epiano(CH[ch], 0.25, 0.6), t0 + k * BEAT + BEAT / 2, gain=0.3, rev=0.25, pump=True)
    # bajo con ritmo de tresillo
    for st in (0, 3, 6):
        if st * S16 < d:
            add(bass(ROOT[ch] + (12 if st == 3 else 0), min(0.35, d - st * S16)), t0 + st * S16, gain=0.55, pump=True)
    # gancho de marimba (en el último compás lo dejan libre las pastillas del CTA)
    if ch in HOOK and t0 < OUTRO + 0.01:
        for k, st in enumerate((0, 3, 6)):
            add(marimba(HOOK[ch][k], 0.7), t0 + st * S16, gain=0.36, pan=0.2 * (-1) ** k, rev=0.3, dly=0.3)
            add(marimba(HOOK[ch][k] - 12, 0.7), t0 + st * S16, gain=0.14, rev=0.2)

# transiciones del video: barrido a blanco y apertura del círculo
whoosh(5.35, 0.75, 0.4)
whoosh(6.75, 0.6, 0.32)
add(boom(0.35), OUTRO)

# pastillas CTA (8,4 / 8,7 / 9,0): notas de marimba que completan la melodía
for tk, m in [(8.4, 74), (8.7, 77), (9.0, 79)]:
    add(marimba(m, 0.8), tk, gain=0.42, rev=0.35, dly=0.3)
    add(marimba(m - 12, 0.8), tk, gain=0.15)

# ---------------- 3) final: Fmaj7 que resuelve en 9,6 s ----------------
n_end = DUR - FINAL
add(epiano(CH['F'], n_end, 1.0), FINAL, gain=0.55, rev=0.45, pump=True)
add(pad(CH['F'], n_end, 1400), FINAL, gain=0.2, rev=0.4)
add(bass(41, n_end), FINAL, gain=0.55)
add(kick(0.9), FINAL); kick_times.append(FINAL)
add(marimba(81, 0.4), FINAL, gain=0.38, rev=0.4, dly=0.3)
add(marimba(77, 0.4), FINAL, gain=0.3, rev=0.4)

# ---------------- mezcla ----------------
t_all = np.arange(N) / SR
sc = np.ones(N)
for kt in kick_times:                                # bombeo suave (sidechain)
    i = int(kt * SR); m = min(N - i, int(SR * 0.35))
    sc[i:i + m] = np.minimum(sc[i:i + m], 1 - 0.45 * np.exp(-t_all[:m] / 0.08))
L += ML * sc; Rch += MR * sc

d = int(SR * BEAT * 0.75)                            # delay corchea con puntillo, ping-pong
dl = np.zeros(N); dr = np.zeros(N)
for k in range(1, 4):
    g = 0.38 ** k
    sl, sr_ = (dly_R, dly_L) if k % 2 else (dly_L, dly_R)
    dl[k * d:] += sl[:N - k * d] * g
    dr[k * d:] += sr_[:N - k * d] * g
dl, dr = lp(hp(dl, 300), 3500), lp(hp(dr, 300), 3500)
L += dl * 0.7; Rch += dr * 0.7

ir_n = int(SR * 1.6)                                 # reverb oscura
ti = np.arange(ir_n) / SR
irL = lp(hp(rng.standard_normal(ir_n) * np.exp(-ti / 0.4), 250), 4500)
irR = lp(hp(rng.standard_normal(ir_n) * np.exp(-ti / 0.4), 250), 4500)
L += signal.fftconvolve(send_L, irL)[:N] * 0.045
Rch += signal.fftconvolve(send_R, irR)[:N] * 0.045

mix = np.stack([hp(L, 28), hp(Rch, 28)])
mix = np.stack([lp(mix[0], 12000), lp(mix[1], 12000)])  # techo cálido: nada chillón
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fade_n = int(SR * 0.35)
mix[:, -fade_n:] *= np.linspace(1, 0, fade_n) ** 1.5
mix[:, :int(SR * 0.01)] *= np.linspace(0, 1, int(SR * 0.01))
mix *= 10 ** (-1 / 20)                               # techo -1 dBFS

pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', sys.argv[1])
