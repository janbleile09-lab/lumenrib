#!/bin/zsh
# run.sh NAME SPEC MODEL [TIMEOUT] — startet EINE verfolgte agy-Session
set -u
BASE="$HOME/lito-site/.agent"
CTX="$BASE/context.md"
NAME="${1:?Name fehlt}"; SPEC="${2:?Spec fehlt}"; MODEL="${3:-claude-opus-5-5-high}"; TO="${4:-2400s}"
REPO="$HOME/lito-site"
mkdir -p "$BASE/logs"
[ -f "$SPEC" ] || { echo "FEHLER: Spec $SPEC fehlt"; exit 2; }
case "$SPEC" in /*) ;; *) SPEC="$PWD/$SPEC" ;; esac
CTXF="$BASE/logs/$NAME.ctx"; ERR="$BASE/logs/$NAME.err"; JSON="$BASE/logs/$NAME.json"; PIDF="$BASE/logs/$NAME.pid"
cat "$CTX" > "$CTXF"; printf '\n\n---\n\n' >> "$CTXF"; cat "$SPEC" >> "$CTXF"
echo "[$NAME] ctx=$(wc -c < "$CTXF") bytes model=$MODEL"
cd "$REPO" || exit 3
env -u PYTHONPATH HOME="$HOME" agy --print "$(cat "$CTXF")" \
  --model "$MODEL" --dangerously-skip-permissions --add-dir "$REPO" \
  --output-format json --print-timeout "$TO" >"$JSON" 2>"$ERR" &
PID=$!; echo "$PID" > "$PIDF"; sleep 1
kill -0 "$PID" 2>/dev/null || { echo "[$NAME] NICHT GESTARTET:"; tail -3 "$ERR"; exit 4; }
echo "[$NAME] gestartet pid=$PID"
sleep 2
ps -o command= -p "$PID" 2>/dev/null | grep -q "GEMEINSAMER KONTEXT" \
  && echo "[$NAME] Auftragstext bestaetigt" \
  || { echo "[$NAME] WARNUNG: Auftragstext NICHT im Prozess"; tail -3 "$ERR"; exit 5; }
