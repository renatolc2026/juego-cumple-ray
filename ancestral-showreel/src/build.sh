#!/usr/bin/env bash
# Construye el showreel completo: cuadros -> música -> MP4 1920x1080 a 60 fps.
# Uso: ./build.sh <dir_de_trabajo> <mp4_salida>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mkdir -p "${1:?dir de trabajo}" && cd "$1" && pwd)"
OUT="$(cd "$(dirname "${2:?mp4 de salida}")" && pwd)/$(basename "$2")"
mkdir -p "$WORK/frames"

node "$HERE/render.cjs" "$WORK/frames" --workers "${WORKERS:-4}"
python3 "$HERE/music.py" "$WORK/music.wav"

# H.264 en dos pasadas a 18 Mbps: el grano analógico se come la tasa de bits
# con CRF, así que se fija un objetivo (≈45 MB para 20 s).
cd "$WORK"
for pass in 1 2; do
  if [ "$pass" = 1 ]; then tail=(-an -f null /dev/null)
  else tail=(-map 1:a -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"); fi
  ffmpeg -y -hide_banner -loglevel error -thread_queue_size 512 \
    -framerate 60 -i frames/f_%05d.png -i music.wav -map 0:v \
    -c:v libx264 -preset slow -b:v 18M -maxrate 30M -bufsize 36M -pass "$pass" -passlogfile x264 \
    -profile:v high -level 4.2 -pix_fmt yuv420p -g 120 \
    -vf "scale=out_color_matrix=bt709:out_range=tv" \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -t 20 "${tail[@]}"
done
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels \
  -show_entries format=duration,size,bit_rate -of default=nw=1 "$OUT"
