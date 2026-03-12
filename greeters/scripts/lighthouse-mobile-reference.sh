#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bash scripts/lighthouse-mobile-reference.sh <base_url> [routes_csv]"
  echo "Example: bash scripts/lighthouse-mobile-reference.sh https://greeters.nexus-conseil.ch '/, /galerie, /actualites'"
  exit 1
fi

BASE_URL="${1%/}"
ROUTES_INPUT="${2:-/,/galerie,/actualites,/devenez-benevole,/contact}"
RUNS="${LIGHTHOUSE_RUNS:-3}"
THRESHOLD_SCORE="${LIGHTHOUSE_THRESHOLD_SCORE:-95}"
OUTPUT_ROOT="${LIGHTHOUSE_OUTPUT_ROOT:-/app/greeters/test_reports/lighthouse}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="${OUTPUT_ROOT}/${TIMESTAMP}"

mkdir -p "$REPORT_DIR"

if [ -n "${CHROME_PATH:-}" ] && [ -x "${CHROME_PATH}" ]; then
  LIGHTHOUSE_CHROME_PATH="${CHROME_PATH}"
elif [ -x "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell" ]; then
  LIGHTHOUSE_CHROME_PATH="/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"
else
  LIGHTHOUSE_CHROME_PATH="$(python - <<'PY'
from pathlib import Path
candidates = sorted(Path('/pw-browsers').glob('**/headless_shell'))
print(candidates[0] if candidates else '')
PY
)"
fi

if [ -z "${LIGHTHOUSE_CHROME_PATH}" ] || [ ! -x "${LIGHTHOUSE_CHROME_PATH}" ]; then
  echo "Impossible de trouver un navigateur Chromium headless utilisable."
  exit 1
fi

export CHROME_PATH="${LIGHTHOUSE_CHROME_PATH}"
export BASE_URL
export LIGHTHOUSE_REPORT_DIR="${REPORT_DIR}"
export LIGHTHOUSE_THRESHOLD_SCORE
export LIGHTHOUSE_RUNS

python - <<'PY'
import os
from pathlib import Path

routes = [entry.strip() for entry in os.environ.get('ROUTES_INPUT', '').split(',') if entry.strip()]
report_dir = Path(os.environ['LIGHTHOUSE_REPORT_DIR'])
(report_dir / 'routes.txt').write_text('\n'.join(routes) + '\n', encoding='utf-8')
PY

export ROUTES_INPUT

echo "Lighthouse mobile reference"
echo "- Base URL : ${BASE_URL}"
echo "- Routes   : ${ROUTES_INPUT}"
echo "- Runs     : ${RUNS}"
echo "- Chrome   : ${CHROME_PATH}"
echo "- Reports  : ${REPORT_DIR}"

python - <<'PY' > "${REPORT_DIR}/routes.safe"
import os

routes = [entry.strip() for entry in os.environ.get('ROUTES_INPUT', '').split(',') if entry.strip()]
for route in routes:
    normalized = route if route.startswith('/') else f'/{route}'
    safe = normalized.strip('/').replace('/', '__') or 'home'
    print(f"{normalized}|{safe}")
PY

while IFS='|' read -r route safe; do
  [ -n "$route" ] || continue

  for run in $(seq 1 "$RUNS"); do
    target="${BASE_URL}${route}"
    output_json="${REPORT_DIR}/${safe}.run${run}.json"
    output_html="${REPORT_DIR}/${safe}.run${run}.html"

    echo "→ ${target} (run ${run}/${RUNS})"
    npx --yes lighthouse "$target" \
      --quiet \
      --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage --disable-gpu' \
      --only-categories=performance \
      --emulated-form-factor=mobile \
      --screenEmulation.mobile=true \
      --output=json \
      --output=html \
      --output-path="$output_json"

    mv "${output_json%.json}.report.html" "$output_html" 2>/dev/null || true
  done
done < "${REPORT_DIR}/routes.safe"

python - <<'PY'
import json
import os
import statistics
from pathlib import Path

report_dir = Path(os.environ['LIGHTHOUSE_REPORT_DIR'])
threshold = float(os.environ['LIGHTHOUSE_THRESHOLD_SCORE'])
rows = []

for route_line in (report_dir / 'routes.safe').read_text(encoding='utf-8').splitlines():
    route, safe = route_line.split('|', 1)
    metrics = []
    for report_file in sorted(report_dir.glob(f'{safe}.run*.json')):
        with report_file.open('r', encoding='utf-8') as handle:
            data = json.load(handle)
        metrics.append({
            'file': report_file.name,
            'score': round(data['categories']['performance']['score'] * 100, 1),
            'fcp': data['audits']['first-contentful-paint']['displayValue'],
            'lcp': data['audits']['largest-contentful-paint']['displayValue'],
            'tbt': data['audits']['total-blocking-time']['displayValue'],
            'cls': data['audits']['cumulative-layout-shift']['displayValue'],
        })
    scores = [item['score'] for item in metrics]
    row = {
        'route': route,
        'runs': metrics,
        'best': max(scores),
        'worst': min(scores),
        'median': statistics.median(scores),
        'average': round(statistics.mean(scores), 1),
        'status': 'PASS' if statistics.median(scores) >= threshold else 'FAIL',
    }
    rows.append(row)

summary_lines = [
        '# Lighthouse mobile reference',
        '',
        f'- Base URL: {os.environ.get("BASE_URL", "")}',
        f'- Runs per route: {os.environ.get("LIGHTHOUSE_RUNS", "")}',
        f'- Threshold (median score): {threshold}',
        '',
        '| Route | Best | Median | Average | Worst | Status |',
        '| --- | ---: | ---: | ---: | ---: | --- |',
    ]

for row in rows:
    summary_lines.append(f"| `{row['route']}` | {row['best']} | {row['median']} | {row['average']} | {row['worst']} | **{row['status']}** |")

summary_lines.append('')
for row in rows:
    summary_lines.append(f"## {row['route']}")
    for run in row['runs']:
        summary_lines.append(
            f"- {run['file']}: score {run['score']} · FCP {run['fcp']} · LCP {run['lcp']} · TBT {run['tbt']} · CLS {run['cls']}"
        )
    summary_lines.append('')

summary_path = report_dir / 'summary.md'
summary_path.write_text('\n'.join(summary_lines), encoding='utf-8')
print('\n'.join(summary_lines))

failing = [row for row in rows if row['status'] != 'PASS']
if failing:
    raise SystemExit(1)
PY