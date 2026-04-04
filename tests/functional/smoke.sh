#!/bin/sh

set -eu

base_url="${1:?Missing base URL}"
frontend_host="${2:?Missing frontend host header}"
api_host="${3:?Missing api host header}"

assert_contains() {
  response="$1"
  expected="$2"
  context="$3"

  if ! printf "%s" "$response" | grep -q "$expected"; then
    echo "Smoke test failed for ${context}: expected '${expected}'"
    exit 1
  fi
}

request() {
  host="$1"
  path="$2"
  shift 2
  curl -fsS --retry 15 --retry-delay 2 --retry-all-errors -m 10 -H "Host: ${host}" "$@" "${base_url}${path}"
}

echo "Smoke test against ${base_url} (${frontend_host} / ${api_host})"

frontend_home="$(request "${frontend_host}" "/")"
assert_contains "$frontend_home" "<html" "frontend home"

frontend_configure="$(request "${frontend_host}" "/configure?model_id=1")"
assert_contains "$frontend_configure" "<html" "frontend configure page"

frontend_api_models="$(request "${frontend_host}" "/api/models")"
assert_contains "$frontend_api_models" "\"id\"" "frontend api proxy models"

api_health="$(request "${api_host}" "/health")"
assert_contains "$api_health" "OK" "api health"

api_models="$(request "${api_host}" "/models")"
assert_contains "$api_models" "\"id\"" "api models"

api_configuration="$(request "${api_host}" "/car/configure" -H "Content-Type: application/json" -d '{"model":1}')"
assert_contains "$api_configuration" "\"code\":200" "api configure"
assert_contains "$api_configuration" "\"uic\"" "api configure payload"

echo "Smoke test passed"
