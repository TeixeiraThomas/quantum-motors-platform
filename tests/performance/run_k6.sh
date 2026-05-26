#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-http://172.16.248.64}"
front_host="${2:-front.quantum.local}"
api_host="${3:-api.quantum.local}"

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
timestamp="$(date +%Y%m%d-%H%M%S)"
report_dir="${script_dir}/reports/${timestamp}"
mkdir -p "$report_dir"

echo "Running k6 load test..."
echo "BASE_URL=${base_url} FRONT_HOST=${front_host} API_HOST=${api_host}"

docker run --rm --network host \
  -v "${script_dir}:/scripts" \
  -v "${report_dir}:/report" \
  grafana/k6:0.52.0 \
  run \
  --env BASE_URL="${base_url}" \
  --env FRONT_HOST="${front_host}" \
  --env API_HOST="${api_host}" \
  --summary-export=/report/k6-summary.json \
  /scripts/k6-platform.js

python "${script_dir}/generate_report.py" \
  --summary "${report_dir}/k6-summary.json" \
  --output "${report_dir}/k6-report.md" \
  --base-url "${base_url}" \
  --front-host "${front_host}" \
  --api-host "${api_host}"

echo "k6 artifacts:"
echo "  ${report_dir}/k6-summary.json"
echo "  ${report_dir}/k6-report.md"
