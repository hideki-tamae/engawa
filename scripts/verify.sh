#!/usr/bin/env bash
# ハーネス: 1項目ごとに、ここを通るまで次へ進まない。自己採点はしない。
set -u
fail=0
step() { printf '\n== %s\n' "$1"; shift; if "$@"; then echo "   PASS"; else echo "   FAIL"; fail=1; fi; }
step "typecheck" npx tsc --noEmit
step "lint"      npx eslint app components lib
step "unit tests" npx vitest run
step "no secrets in tracked/new files" bash -c '! grep -rEn "AIza[0-9A-Za-z_-]{30,}" app components lib scripts --include=*.ts --include=*.tsx --include=*.sh --include=*.md 2>/dev/null'
[ "${1:-}" = "--build" ] && step "next build" npx next build
echo; [ $fail -eq 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit $fail
