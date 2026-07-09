#!/usr/bin/env bash
# Gera os PNGs do app a partir dos SVGs de assets/brand.
# Requer rsvg-convert (brew install librsvg). Não é dependência do app —
# roda apenas quando a marca muda.
set -euo pipefail

cd "$(dirname "$0")/.."
BRAND=assets/brand
OUT=assets/images

command -v rsvg-convert >/dev/null || {
  echo "rsvg-convert não encontrado (brew install librsvg)" >&2
  exit 1
}

rsvg-convert -w 1024 -h 1024 "$BRAND/icon.svg" -o "$OUT/icon.png"
rsvg-convert -w 1024 -h 1024 "$BRAND/mark.svg" -o "$OUT/android-icon-foreground.png"
rsvg-convert -w 1024 -h 1024 "$BRAND/background.svg" -o "$OUT/android-icon-background.png"
rsvg-convert -w 1024 -h 1024 "$BRAND/mark-monochrome.svg" -o "$OUT/android-icon-monochrome.png"
rsvg-convert -w 512 -h 512 "$BRAND/mark.svg" -o "$OUT/splash-icon.png"
rsvg-convert -w 48 -h 48 "$BRAND/icon.svg" -o "$OUT/favicon.png"

echo "ícones gerados em $OUT"
