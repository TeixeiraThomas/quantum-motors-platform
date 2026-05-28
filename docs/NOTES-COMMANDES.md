# Notes commandes 100% WSL

Toutes les commandes ci-dessous sont a lancer dans un terminal WSL (bash).

## 1) Se placer dans le repo

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
```

## 2) Git - sync, pull, push

```bash
git status --short
git pull --rebase rendu main
git push rendu main
git push origin main
```

Si `git pull --rebase` refuse (modifs locales):

```bash
git status --short
git restore .gitlab-ci.yml
git pull --rebase rendu main
```

## 3) Git - commit test pipeline

Commit vide (declenche une pipeline sans toucher au code):

```bash
git commit --allow-empty -m "ci: test push"
git push rendu main
git push origin main
```

## 4) Runner GitLab - run normal

```bash
bash ansible/scripts/wsl-ansible.sh runners --limit vm1,vm2,vm3
```

Alias:

```bash
echo "alias qm-runners='cd /mnt/c/ETNA/MASTER2/Quantum-Motors && bash ansible/scripts/wsl-ansible.sh runners --limit vm1,vm2,vm3'" >> ~/.bashrc
source ~/.bashrc
qm-runners
```

## 5) Runner GitLab - re-register force avec token

### 5.1 Charger le token a la main

```bash
unset RUNNER_TOKEN
read -rsp "Token runner ETNA: " RUNNER_TOKEN; echo
echo "len=${#RUNNER_TOKEN}"
printf 'prefix=%s\n' "${RUNNER_TOKEN:0:8}"
```

Validation:

```bash
printf '%s' "$RUNNER_TOKEN" | grep -q '[[:space:]]' && echo "Token invalide (espaces/newlines)" || echo "format ok"
```

### 5.2 Re-register vm1

```bash
bash ansible/scripts/wsl-ansible.sh runners --limit vm1 \
  -e gitlab_runner_url="http://172.16.248.236" \
  -e "gitlab_runner_registration_token=${RUNNER_TOKEN}" \
  -e gitlab_runner_force_reregister=true \
  -e gitlab_runner_debug_registration=true
```

### 5.3 Re-register vm2,vm3

```bash
bash ansible/scripts/wsl-ansible.sh runners --limit vm2,vm3 \
  -e gitlab_runner_url="http://172.16.248.236" \
  -e "gitlab_runner_registration_token=${RUNNER_TOKEN}" \
  -e gitlab_runner_force_reregister=true \
  -e gitlab_runner_debug_registration=true
```

## 6) Variables Ansible via JSON (WSL)

```bash
export RUNNER_TOKEN
python3 - <<'PY'
import json, os
d = {
  "gitlab_runner_url": "http://172.16.248.236",
  "gitlab_runner_registration_token": os.environ["RUNNER_TOKEN"],
  "gitlab_runner_force_reregister": True,
  "gitlab_runner_debug_registration": True
}
open("/tmp/runner-vars.json","w").write(json.dumps(d))
print("written /tmp/runner-vars.json")
PY
```

Puis:

```bash
bash ansible/scripts/wsl-ansible.sh runners --limit vm1 -e @/tmp/runner-vars.json
bash ansible/scripts/wsl-ansible.sh runners --limit vm2,vm3 -e @/tmp/runner-vars.json
```

## 7) Verifications runner / Docker (WSL)

```bash
docker ps --format '{{.Names}}'
docker logs gitlab-runner --tail 100
docker inspect gitlab-runner
```

```bash
docker service ls | grep -E 'monitoring_prometheus|monitoring_node-exporter|monitoring_cadvisor|logging_grafana-logs'
```

## 8) Verifications Prometheus (WSL)

Node exporter:

```bash
curl -sS -H 'Host: prometheus.quantum.local' \
  'http://172.16.248.64/api/v1/query?query=up{job="node-exporter"}'
```

Cadvisor:

```bash
curl -sS -H 'Host: prometheus.quantum.local' \
  'http://172.16.248.64/api/v1/query?query=up{job="cadvisor"}'
```

## 9) SSH rendu ETNA (WSL)

Generer une cle:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_etna_rendu -C "etna-rendu"
cat ~/.ssh/id_etna_rendu.pub
```

Copier la cle publique dans ton compte GitLab ETNA, puis test:

```bash
ssh -i ~/.ssh/id_etna_rendu -o IdentitiesOnly=yes -T git@rendu-git.etna-alternance.net
```

Configurer le remote:

```bash
git remote get-url rendu
git remote set-url rendu git@rendu-git.etna-alternance.net:module-10269/activity-54967/group-1075429
```

Pousser:

```bash
git push rendu main
```

## 10) Erreurs frequentes

### A) `ansible-playbook: error: unrecognized arguments: \\`

Cause: commande collee avec mauvais retours ligne.

Toujours relancer en bash WSL exactement comme ci-dessus.

### B) `gitlab_runner_registration_token must be defined`

```bash
echo "len=${#RUNNER_TOKEN}"
```

Si `len=0`, le token est vide: relire le token puis rejouer la commande.

### C) `Permission denied (publickey)` sur `git push rendu`

```bash
ssh -i ~/.ssh/id_etna_rendu -o IdentitiesOnly=yes -T git@rendu-git.etna-alternance.net
git push rendu main
```

## 11) CI - diagnostic rapide

```bash
git log --oneline -n 10
git show --name-only --oneline HEAD
git status --short
```
