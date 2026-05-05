#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
inventory="$repo_root/ansible/inventories/production/hosts.yml"
vault_helper="$script_dir/wsl-vault-pass.sh"
tmp_vault=""

usage() {
  cat <<'EOF'
Usage: bash ansible/scripts/wsl-ansible.sh <command> [ansible args...]

Commands:
  requirements   Install Ansible Galaxy collections from ansible/requirements.yml
  vault-check    Validate that the local Vault password can decrypt vault.yml
  inventory      Print the parsed production inventory
  ping           Run Ansible ping on all production hosts
  syntax-check   Syntax-check infrastructure, gitlab and runners playbooks
  infrastructure Run playbooks/infrastructure.yml
  gitlab         Run playbooks/gitlab.yml
  runners        Run playbooks/runners.yml

Environment overrides:
  QM_SECRETS_FILE=/mnt/c/path/to/secrets.txt
  QM_VAULT_MARKER="mdp vault"
EOF
}

cleanup() {
  if [[ -n "$tmp_vault" && -f "$tmp_vault" ]]; then
    rm -f "$tmp_vault"
  fi
}
trap cleanup EXIT

make_vault_file() {
  if [[ -z "$tmp_vault" ]]; then
    tmp_vault="$(mktemp)"
    bash "$vault_helper" > "$tmp_vault"
    chmod 600 "$tmp_vault"
  fi
}

run_playbook() {
  local name="$1"
  shift

  make_vault_file
  ANSIBLE_CONFIG="$repo_root/ansible/ansible.cfg" \
  ANSIBLE_ROLES_PATH="$repo_root/ansible/roles" \
  ansible-playbook \
    -i "$inventory" \
    "$repo_root/ansible/playbooks/$name.yml" \
    --vault-password-file "$tmp_vault" \
    "$@"
}

command="${1:-syntax-check}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command" in
  requirements|deps)
    ANSIBLE_CONFIG="$repo_root/ansible/ansible.cfg" \
    ansible-galaxy collection install -r "$repo_root/ansible/requirements.yml" "$@"
    ;;
  vault-check)
    make_vault_file
    ANSIBLE_CONFIG="$repo_root/ansible/ansible.cfg" \
    ansible localhost \
      -i localhost, \
      -c local \
      -e "@$repo_root/ansible/inventories/production/group_vars/vault.yml" \
      --vault-password-file "$tmp_vault" \
      -m ansible.builtin.assert \
      -a '{"that":["(vault_gitlab_root_password | string | length) > 0","(vault_gitlab_prof_password | string | length) > 0"],"quiet":true}' \
      >/dev/null
    echo "Vault OK"
    ;;
  inventory)
    ANSIBLE_CONFIG="$repo_root/ansible/ansible.cfg" \
    ansible-inventory -i "$inventory" --list "$@"
    ;;
  ping)
    ANSIBLE_CONFIG="$repo_root/ansible/ansible.cfg" \
    ANSIBLE_ROLES_PATH="$repo_root/ansible/roles" \
    ansible all -i "$inventory" -m ping "$@"
    ;;
  syntax-check|check)
    run_playbook infrastructure --syntax-check "$@"
    run_playbook gitlab --syntax-check "$@"
    run_playbook runners --syntax-check "$@"
    ;;
  infrastructure|gitlab|runners)
    run_playbook "$command" "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
