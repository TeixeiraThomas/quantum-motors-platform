# BLOC 2 — Actions serveur (VM par VM)

**Audit:** 2026-04-13  
**Cible :** Playbooks Ansible applicables directement sur 4 VMs  
**Durée estimée :** 50 min total

---

## Vue d'ensemble

Ce bloc décrit les **actions exactes à exécuter** sur chaque VM (machine locale WSL si nécessaire).

**Flux :**
1. Machine locale : prérequis + Vault
2. VM1 (manager) : tests de connectivité
3. VM2 (worker) : idem
4. VM3 (worker) : idem
5. VM4 (GitLab) : vérifications spécifiques
6. Machine locale : playbooks Ansible
7. Machine locale + GitLab UI : configuration CI/CD

---

## Actions VM1 (172.16.248.64 — Swarm Manager)

### Vérifications pré-déploiement

#### ✅ 1.1 — Connectivité SSH

```bash
# Depuis ta machine locale
ssh -v teixei_t@172.16.248.64 "echo OK"

# Résultat attendu :
# Connected to 172.16.248.64
# echo OK
# OK
```

**Si erreur :** 
```bash
# Essaye avec password
ssh -v teixei_t@172.16.248.64 --ask-pass "echo OK"
```

#### ✅ 1.2 — Vérifier le hostname système

```bash
ssh teixei_t@172.16.248.64 "hostname"

# Résultat attendu : TIC-CLO5-VM1 (ou vm1)
# Note : Si différent, documente-le pour Ansible
```

#### ✅ 1.3 — Vérifier l'OS et la version kernel

```bash
ssh teixei_t@172.16.248.64 "cat /etc/os-release | grep VERSION_ID"
ssh teixei_t@172.16.248.64 "uname -r"

# Résultat attendu :
# VERSION_ID="12"  (Debian 12)
# 6.1.x-x-generic  (Kernel récent)
```

#### ✅ 1.4 — Vérifier l'espace disque

```bash
ssh teixei_t@172.16.248.64 "df -h / | tail -1"

# Résultat attendu :
# /dev/sda1    100G   20G   75G   21%  /
# (Au moins 20-30 GB disponible)
```

#### ✅ 1.5 — Vérifier la RAM disponible

```bash
ssh teixei_t@172.16.248.64 "free -h | grep Mem"

# Résultat attendu :
# Mem:     3.9Gi  0.5Gi  3.2Gi  12%  (4 Go minimum)
```

#### ✅ 1.6 — Vérifier les ports critiques

```bash
ssh teixei_t@172.16.248.64 "sudo netstat -tuln | grep -E ':(22|80|443|2377)'"

# Résultat attendu :
# tcp  0  0  0.0.0.0:22        0.0.0.0:*  LISTEN
# tcp  0  0  0.0.0.0:2377      0.0.0.0:*  LISTEN  (après Swarm init)
```

#### ✅ 1.7 — Accès sudo sans password (recommandé)

```bash
# Test sudo
ssh teixei_t@172.16.248.64 "sudo whoami"

# Si demande password :
# Configure sur VM1 :
ssh teixei_t@172.16.248.64 "sudo visudo"
# Ajoute : teixei_t ALL=(ALL) NOPASSWD: ALL
```

### Configuration post-déploiement (après playbooks)

#### ✅ 1.8 — Vérifier que Swarm est initialisé

```bash
ssh teixei_t@172.16.248.64 "docker swarm ca"

# Résultat attendu :
# -----BEGIN CERTIFICATE-----
# MIIDk...
# -----END CERTIFICATE-----
```

#### ✅ 1.9 — Vérifier les nœuds Swarm

```bash
ssh teixei_t@172.16.248.64 "docker node ls"

# Résultat attendu : 3 nœuds en Ready/Active
# ID           HOSTNAME     STATUS   AVAILABILITY
# 7jkt...      vm1          Ready    Active  (Leader)
# 9vmx...      vm2          Ready    Active
# 4lpd...      vm3          Ready    Active
```

#### ✅ 1.10 — Vérifier les réseaux overlay

```bash
ssh teixei_t@172.16.248.64 "docker network ls | grep -E 'public|preprod|prod|logs'"

# Résultat attendu :
# 7a4f... public     overlay  swarm
# 3b8c... preprod_net overlay  swarm
# 2c6d... prod_net   overlay  swarm
# 9e2a... logs_net   overlay  swarm
```

#### ✅ 1.11 — Vérifier Traefik déployé

```bash
ssh teixei_t@172.16.248.64 "docker service ls | grep traefik"

# Résultat attendu :
# 4a7d... traefik  1/1  traefik:v2.11
```

#### ✅ 1.12 — Vérifier NFS exports configurés

```bash
ssh teixei_t@172.16.248.64 "cat /etc/exports"

# Résultat attendu :
# /srv/nfs/quantum-motors/preprod/mariadb 172.16.248.0/24(rw,sync,...)
# /srv/nfs/quantum-motors/prod/mariadb 172.16.248.0/24(rw,sync,...)
```

---

## Actions VM2 (172.16.248.92 — Swarm Worker + MariaDB)

### Vérifications pré-déploiement

#### ✅ 2.1 — Connectivité SSH

```bash
ssh -v teixei_t@172.16.248.92 "echo OK"

# Résultat attendu : OK
```

#### ✅ 2.2 — Hostname

```bash
ssh teixei_t@172.16.248.92 "hostname"

# Résultat attendu : TIC-CLO5-VM2 (ou vm2)
```

#### ✅ 2.3 — Espace disque (CRITIQUE pour MariaDB)

```bash
ssh teixei_t@172.16.248.92 "df -h /"

# Résultat attendu : Au moins 30 GB disponible
# (MariaDB peut grandir rapidement)
```

### Configuration post-déploiement

#### ✅ 2.4 — Vérifier que le nœud a rejoint Swarm

```bash
ssh teixei_t@172.16.248.92 "docker node ls"

# Résultat attendu : 3 nœuds, dont vm2 Active/Ready
```

#### ✅ 2.5 — Vérifier NFS client monté

```bash
ssh teixei_t@172.16.248.92 "mount | grep nfs"

# Résultat attendu :
# 172.16.248.64:/srv/nfs/quantum-motors on /mnt/nfs (nfs4, rw)
```

#### ✅ 2.6 — Vérifier le répertoire de stockage MariaDB

```bash
ssh teixei_t@172.16.248.92 "ls -la /srv/nfs/quantum-motors/"

# Résultat attendu : dossiers preprod/ et prod/ (vides au départ)
```

#### ✅ 2.7 — Vérifier que Docker tourne

```bash
ssh teixei_t@172.16.248.92 "docker ps"

# Résultat attendu : Docker engine actif
```

---

## Actions VM3 (172.16.248.97 — Swarm Worker + SonarQube + Logging)

### Vérifications pré-déploiement

#### ✅ 3.1 — Connectivité SSH

```bash
ssh -v touahr_s@172.16.248.97 "echo OK"

# Résultat attendu : OK
```

#### ✅ 3.2 — Hostname

```bash
ssh touahr_s@172.16.248.97 "hostname"

# Résultat attendu : TIC-CLO5-VM3 (ou vm3)
```

#### ✅ 3.3 — Espace disque (SonarQube needs ~5 GB)

```bash
ssh touahr_s@172.16.248.97 "df -h /"

# Résultat attendu : Au moins 20-30 GB
```

### Configuration post-déploiement

#### ✅ 3.4 — Vérifier les labels appliqués

```bash
# Sur VM1 (manager)
ssh teixei_t@172.16.248.64 "docker node inspect vm3 --format='{{json .Spec.Labels}}'"

# Résultat attendu :
# {"logging":"true","sonarqube":"true"}
```

#### ✅ 3.5 — Vérifier SonarQube service déployé

```bash
ssh teixei_t@172.16.248.64 "docker service ls | grep sonarqube"

# Résultat attendu :
# a4b7... sonarqube 1/1  sonarqube:lts-community
```

#### ✅ 3.6 — Vérifier l'accès à SonarQube

```bash
# Depuis ta machine locale
curl http://172.16.248.97:9000

# Résultat attendu : HTTP 200 + HTML SonarQube
```

#### ✅ 3.7 — Vérifier Loki service déployé

```bash
ssh teixei_t@172.16.248.64 "docker service ls | grep loki"

# Résultat attendu :
# c8d2... loki  1/1  grafana/loki:3.6.0
```

#### ✅ 3.8 — Vérifier Grafana service déployé

```bash
ssh teixei_t@172.16.248.64 "docker service ls | grep grafana"

# Résultat attendu :
# d9e3... grafana-logs  1/1  grafana/grafana:11.0.0
```

#### ✅ 3.9 — Vérifier l'accès à Grafana

```bash
curl http://logs.quantum.local  # Si /etc/hosts configuré
# OU
curl -H "Host: logs.quantum.local" http://172.16.248.64

# Résultat attendu : HTTP 200 + HTML Grafana
```

#### ✅ 3.10 — Vérifier Alloy running (global sur tous nœuds)

```bash
ssh touahr_s@172.16.248.97 "docker ps | grep alloy"

# Résultat attendu :
# CONTAINER ID  IMAGE              NAMES
# 7a4f...       grafana/alloy:...  (En cours)
```

---

## Actions VM4 (172.16.248.236 — GitLab Bare Metal)

### Vérifications pré-déploiement

#### ✅ 4.1 — Connectivité SSH

```bash
ssh -v touahr_s@172.16.248.236 "echo OK"

# Résultat attendu : OK
```

#### ✅ 4.2 — Hostname

```bash
ssh touahr_s@172.16.248.236 "hostname"

# Résultat attendu : TIC-CLO5-VM4 (ou vm4)
```

#### ✅ 4.3 — Espace disque (CRITIQUE pour GitLab)

```bash
ssh touahr_s@172.16.248.236 "df -h /"

# Résultat attendu : Au moins 50 GB disponible
# (GitLab = 10 GB install + repos + registry)
```

#### ✅ 4.4 — RAM disponible (GitLab needs ~4 GB)

```bash
ssh touahr_s@172.16.248.236 "free -h | grep Mem"

# Résultat attendu : 4 GB minimum
```

### Configuration post-déploiement

#### ✅ 4.5 — Vérifier GitLab installé

```bash
ssh touahr_s@172.16.248.236 "gitlab-ctl status"

# Résultat attendu :
# run: alertmanager: (pid 1234) 5s
# run: gitaly: (pid 1235) 5s
# run: gitlab-exporter: (pid 1236) 5s
# ...
# (La plupart des services doivent être "run")
```

#### ✅ 4.6 — Accès HTTP à GitLab

```bash
curl -I http://172.16.248.236

# Résultat attendu :
# HTTP/1.1 302 Found
# Location: http://172.16.248.236/users/sign_in
```

#### ✅ 4.7 — Vérifier admi users créés

```bash
# Peux pas tester sans login, mais après playbook log :
ssh touahr_s@172.16.248.236 "sudo gitlab-rails runner 'puts User.admins.count'"

# Résultat attendu : nombre > 1
# (root + les intervenant_X créés)
```

#### ✅ 4.8 — Vérifier registry accessible

```bash
curl http://172.16.248.236:5050/v2/

# Résultat attendu :
# HTTP/1.1 401 Unauthorized
# (Pas de creds, donc 401 est normal)
```

---

## Actions Machine locale (Ansible + Vault)

### Phase 1 : Avant les playbooks

#### ✅ A.1 — Installer Ansible

```bash
# MacOS
brew install ansible

# Linux
sudo apt install ansible

# Pip (universel)
pip install ansible

# Vérifie
ansible --version
# Output : ansible [core 2.14.3]  (2.10+)
```

#### ✅ A.2 — Installer les collections

```bash
ansible-galaxy collection install community.docker

# Vérifie
ansible-galaxy collection list | grep community.docker
```

#### ✅ A.3 — Configurer le Vault password

```bash
# Depuis le gestionnaire de secrets (Bitwarden, 1Password, etc.)
# Copie ton password Ansible Vault

# Crée le fichier local
echo "TON_PASSWORD_SECRET" > ~/.vault_pass
chmod 600 ~/.vault_pass

# Vérifie
ls -la ~/.vault_pass
# Output : -rw------- 1 user user 32 Apr 13 14:32 ~/.vault_pass
```

#### ✅ A.4 — Valider l'inventaire Ansible

```bash
cd /path/to/Quantum-Motors

# Ping test
ansible all \
  -i ansible/inventories/production/hosts.yml \
  -m ping

# Résultat attendu :
# vm1 | SUCCESS => { "ping": "pong" }
# vm2 | SUCCESS => { "ping": "pong" }
# vm3 | SUCCESS => { "ping": "pong" }
# vm4 | SUCCESS => { "ping": "pong" }
```

#### ✅ A.5 — Valider la syntaxe des playbooks

```bash
ansible-playbook \
  ansible/playbooks/infrastructure.yml \
  --syntax-check \
  --vault-password-file=~/.vault_pass

ansible-playbook \
  ansible/playbooks/gitlab.yml \
  --syntax-check \
  --vault-password-file=~/.vault_pass

ansible-playbook \
  ansible/playbooks/runners.yml \
  --syntax-check \
  --vault-password-file=~/.vault_pass

# Résultat attendu : playbook: ... (sans erreur)
```

### Phase 2 : Exécution des playbooks

#### ✅ A.6 — Déployer l'infrastructure Swarm

```bash
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass \
  -vv  # verbose pour debug si besoin

# Durée : ~10 min
# Résultat attendu :
# PLAY RECAP ─────────────────────
# vm1 : ok=15 changed=12 unreachable=0 failed=0
# vm2 : ok=12 changed=10 unreachable=0 failed=0
# vm3 : ok=12 changed=10 unreachable=0 failed=0
```

**Si erreur :**
```bash
# Relance avec debug
ansible-playbook ... -vvv  # triple verbose
# OU teste une tâche spécifique
ansible-playbook ... --tags=docker_swarm
```

#### ✅ A.7 — Installer GitLab

```bash
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/gitlab.yml \
  --vault-password-file=~/.vault_pass \
  -vv

# Durée : ~5-10 min (GitLab reconfigure lent)
# Résultat attendu :
# PLAY RECAP ─────────────────────
# vm4 : ok=10 changed=9 unreachable=0 failed=0
```

**Validation :**
```bash
# Attends 2-3 min que GitLab finisse de démarrer
curl http://172.16.248.236
# HTTP 302 OK
```

#### ✅ A.8 — Déployer les GitLab Runners

```bash
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass \
  -vv

# Durée : ~3 min
# Résultat attendu :
# PLAY RECAP ─────────────────────
# vm1 : ok=8 changed=7 unreachable=0 failed=0
# vm2 : ok=8 changed=7 unreachable=0 failed=0
# vm3 : ok=8 changed=7 unreachable=0 failed=0
```

**Validation :**
```bash
# Vérifie dans GitLab UI que 3 runners sont online
# GitLab → Admin → CI/CD → Runners
# Doit montrer 3 runners ✅ online
```

### Phase 3 : Configuration GitLab UI

#### ✅ A.9 — Créer les Deploy Tokens

```
GitLab UI → http://172.16.248.236

1. Admin (couronne) → Deploy Tokens

2. "New deploy token"
   Name: ci_registry_push
   Scopes: ☑ api, ☑ write_registry
   Expires: 365 days
   → CREATE

3. Copie username + token

4. "New deploy token"
   Name: ci_registry_pull
   Scopes: ☑ read_registry
   Expires: 365 days
   → CREATE

5. Copie username + token
```

#### ✅ A.10 — Ajouter les 9 variables CI/CD

```
GitLab UI → Dépôt Quantum-Motors → Settings → CI/CD → Variables

Pour chaque variable :
  Key: [nom]
  Value: [valeur]
  Mask: ☑ ON (pour passwords/tokens)
  → Add variable

Variables à ajouter :
  1. CI_REGISTRY_USER          = [Deploy Token PUSH user]
  2. CI_REGISTRY_PASSWORD      = [Deploy Token PUSH]
  3. REGISTRY_PULL_USER        = [Deploy Token PULL user]
  4. REGISTRY_PULL_PASSWORD    = [Deploy Token PULL]
  5. PREPROD_DB_ROOT_PASSWORD  = [mot de passe gen]
  6. PREPROD_DB_PASSWORD       = [mot de passe gen]
  7. PROD_DB_ROOT_PASSWORD     = [mot de passe gen]
  8. PROD_DB_PASSWORD          = [mot de passe gen]
  9. BACKEND_ADMIN_PASSWORD    = [mot de passe gen]
```

### Phase 4 : Configuration locale finale

#### ✅ A.11 — Configurer /etc/hosts

```bash
# Windows : Notepad Admin → C:\Windows\System32\drivers\etc\hosts
# Linux : sudo nano /etc/hosts
# Mac : sudo nano /etc/hosts

# Ajoute :
172.16.248.64   quantum.local traefik.quantum.local
172.16.248.64   front.quantum.local api.quantum.local
172.16.248.64   front-green.quantum.local api-green.quantum.local
172.16.248.64   front-blue.quantum.local api-blue.quantum.local
172.16.248.64   preprod.quantum.local api-preprod.quantum.local
172.16.248.64   logs.quantum.local

# Sauvegarde (Ctrl+S ou Ctrl+O→Enter→Ctrl+X)
```

#### ✅ A.12 — Tester la résolution

```bash
nslookup traefik.quantum.local
# Output : 172.16.248.64

ping preprod.quantum.local
# Output : 64 bytes from 172.16.248.64
```

---

## Checklist finale validation

```
✅ VM1 @ 172.16.248.64
   ☑ SSH connecté
   ☑ Hostname = TIC-CLO5-VM1
   ☑ Docker Swarm CA installé
   ☑ 3 nœuds Swarm Ready/Active
   ☑ 4 réseaux overlay créés
   ☑ Traefik service running (1/1)
   ☑ NFS exports configurés

✅ VM2 @ 172.16.248.92
   ☑ SSH connecté
   ☑ Hostname = TIC-CLO5-VM2
   ☑ Docker Swarm member
   ☑ NFS client monté
   ☑ 30+ GB disque libre

✅ VM3 @ 172.16.248.97
   ☑ SSH connecté
   ☑ Hostname = TIC-CLO5-VM3
   ☑ Docker Swarm member
   ☑ Labels sonarqube=true, logging=true
   ☑ SonarQube service running (1/1)
   ☑ Loki service running (1/1)
   ☑ Grafana service running (1/1)
   ☑ Alloy container running

✅ VM4 @ 172.16.248.236
   ☑ SSH connecté
   ☑ Hostname = TIC-CLO5-VM4
   ☑ GitLab CE installé
   ☑ HTTP 302 (sign_in accessible)
   ☑ Registry @ :5050 accessible (401)
   ☑ Admin users créés

✅ Machine locale
   ☑ Ansible 2.10+ installé
   ☑ community.docker installé
   ☑ ~/.vault_pass configuré
   ☑ Inventaire ping all OK
   ☑ Playbooks syntax OK
   ☑ infrastructure.yml exécuté ✅
   ☑ gitlab.yml exécuté ✅
   ☑ runners.yml exécuté ✅
   ☑ Deploy tokens créés
   ☑ 9 variables CI/CD déclarées
   ☑ /etc/hosts configuré
   ☑ Résolution domaines OK

✅ Prochaine étape
   ☑ Suivre PROC-05-cicd-validation.md
   ☑ Trigger pipeline develop
   ☑ Valider test→build→deploy_preprod→test_preprod
```

---

## Commandes rapides de troubleshooting

```bash
# Si Swarm down
ssh teixei_t@172.16.248.64 "docker swarm leave --force"
ansible-playbook playbooks/infrastructure.yml --vault-password-file=~/.vault_pass

# Si runner pas enregistré
ansible-playbook playbooks/runners.yml --vault-password-file=~/.vault_pass

# Si GitLab stuck
ssh touahr_s@172.16.248.236 "sudo gitlab-ctl reconfigure"

# Si NFS pas monté
ssh teixei_t@172.16.248.92 "sudo mount -a"

# Vérifier un service spécifique
docker service logs preprod_api-preprod
docker service ps preprod_api-preprod
```

---

## Signature

**Date :** 2026-04-13  
**Bloc :** 2/5  
**Complétude :** 100% (12 décisions par VM)  
**Prochaine étape :** Bloc 3 (Corrections dépôt supplémentaires) → Bloc 4 (Doc 0-bis) → Bloc 5 (Soutenance)
