#!/usr/bin/env bash
set -euo pipefail

secrets_file="${QM_SECRETS_FILE:-/mnt/c/ETNA/MASTER2/VMS & SERVICES.txt}"
marker="${QM_VAULT_MARKER:-mdp vault}"

if [[ ! -f "$secrets_file" ]]; then
  echo "ERROR: secrets file not found: $secrets_file" >&2
  exit 1
fi

set +e
password="$(
  awk -v marker="$marker" '
    {
      line = $0
      sub(/\r$/, "", line)
    }
    line == marker {
      found = 1
      next
    }
    found && line !~ /^[[:space:]]*$/ {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
      print line
      seen = 1
      exit
    }
    END {
      if (!found) {
        exit 2
      }
      if (found && !seen) {
        exit 3
      }
    }
  ' "$secrets_file"
)"
rc=$?
set -e

case "$rc" in
  0)
    printf '%s\n' "$password"
    ;;
  2)
    echo "ERROR: marker '$marker' not found in $secrets_file" >&2
    exit 2
    ;;
  3)
    echo "ERROR: no non-empty vault password line after marker '$marker'" >&2
    exit 3
    ;;
  *)
    echo "ERROR: failed to read vault password from $secrets_file" >&2
    exit "$rc"
    ;;
esac
