#!/bin/sh

set -eu

loki_base_url="${1:?Missing Loki base URL (example: http://127.0.0.1:3100)}"
stack="${2:-preprod}"
api_service_regex="${3:-.+api-preprod.+}"
front_service_regex="${4:-.+front-preprod.+}"

window_seconds="${LOG_QUERY_WINDOW_SECONDS:-3600}"
limit="${LOG_QUERY_LIMIT:-1000}"
step_seconds="${LOG_QUERY_STEP_SECONDS:-60}"

if ! printf "%s" "$window_seconds" | grep -Eq '^[0-9]+$'; then
  echo "Invalid LOG_QUERY_WINDOW_SECONDS value: $window_seconds"
  exit 1
fi

if ! printf "%s" "$step_seconds" | grep -Eq '^[0-9]+$'; then
  echo "Invalid LOG_QUERY_STEP_SECONDS value: $step_seconds"
  exit 1
fi

if ! printf "%s" "$limit" | grep -Eq '^[0-9]+$'; then
  echo "Invalid LOG_QUERY_LIMIT value: $limit"
  exit 1
fi

now_seconds="$(date +%s)"
start_ns="$(( (now_seconds - window_seconds) * 1000000000 ))"
end_ns="$(( now_seconds * 1000000000 ))"

total=0

run_query_test() {
  name="$1"
  mode="$2"
  query="$3"

  total=$((total + 1))

  case "$mode" in
    range)
      endpoint="${loki_base_url%/}/loki/api/v1/query_range"
      response_with_status="$(curl -sS --retry 8 --retry-delay 2 --retry-all-errors -G \
        "$endpoint" \
        --data-urlencode "query=$query" \
        --data-urlencode "start=$start_ns" \
        --data-urlencode "end=$end_ns" \
        --data-urlencode "limit=$limit" \
        --data-urlencode "step=$step_seconds" \
        -w '\nHTTP_STATUS:%{http_code}')"
      ;;
    instant)
      endpoint="${loki_base_url%/}/loki/api/v1/query"
      response_with_status="$(curl -sS --retry 8 --retry-delay 2 --retry-all-errors -G \
        "$endpoint" \
        --data-urlencode "query=$query" \
        --data-urlencode "time=$end_ns" \
        -w '\nHTTP_STATUS:%{http_code}')"
      ;;
    *)
      echo "Unknown query mode '$mode' for test '$name'"
      exit 1
      ;;
  esac

  http_status="$(printf '%s\n' "$response_with_status" | awk -F: '/^HTTP_STATUS:/{print $2}')"
  response="$(printf '%s\n' "$response_with_status" | sed '$d')"

  if [ "$http_status" != "200" ]; then
    echo "Log query test failed: $name"
    echo "Mode: $mode"
    echo "Endpoint: $endpoint"
    echo "HTTP status: $http_status"
    echo "Query: $query"
    echo "Response: $response"
    exit 1
  fi

  if ! printf "%s" "$response" | grep -q '"status":"success"'; then
    echo "Log query test failed: $name"
    echo "Mode: $mode"
    echo "Endpoint: $endpoint"
    echo "Query: $query"
    echo "Response: $response"
    exit 1
  fi

  echo "OK [$total] $name"
}

echo "LogQL tests against Loki=${loki_base_url} stack=${stack} window=${window_seconds}s"

while IFS= read -r line; do
  [ -z "$line" ] && continue

  name="${line%%:::*}"
  rest="${line#*:::}"
  mode="${rest%%:::*}"
  query="${rest#*:::}"

  run_query_test "$name" "$mode" "$query"
done <<EOF
all_preprod_logs:::range:::{job="swarm", stack="$stack"}
api_preprod_logs:::range:::{job="swarm", stack="$stack", service=~"$api_service_regex"}
front_preprod_logs:::range:::{job="swarm", stack="$stack", service=~"$front_service_regex"}
error_logs:::range:::{job="swarm", stack="$stack"} |~ "(?i)error|exception|fatal|panic"
http_5xx_logs:::range:::{job="swarm", stack="$stack"} |~ " 5[0-9]{2} "
http_4xx_logs:::range:::{job="swarm", stack="$stack"} |~ " 4[0-9]{2} "
timeout_or_connection_errors:::range:::{job="swarm", stack="$stack"} |~ "(?i)timeout|timed out|econnreset|connection refused"
volume_by_service:::instant:::sum by (service) (count_over_time({job="swarm", stack="$stack"}[5m]))
error_volume_by_service:::instant:::sum by (service) (count_over_time({job="swarm", stack="$stack"} |~ "(?i)error|exception|fatal|panic" [5m]))
http_5xx_rate_by_service:::instant:::sum by (service) (rate({job="swarm", stack="$stack"} |~ " 5[0-9]{2} " [5m]))
volume_by_node:::instant:::sum by (node) (count_over_time({job="swarm", stack="$stack"}[5m]))
blue_green_comparison:::instant:::sum by (stack) (count_over_time({job="swarm", stack=~"prodgreen|prod-live"}[5m]))
EOF

echo "All LogQL tests passed ($total queries)"
