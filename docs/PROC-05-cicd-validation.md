# Procédure 5 : Validation live du Pipeline CI/CD

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 30 min  
**Prérequis :**
- ✅ Playbooks Ansible exécutés (infrastructure.yml, gitlab.yml, runners.yml)
- ✅ Variables CI/CD déclarées dans GitLab
- ✅ /etc/hosts configuré localement
- ✅ Runner(s) visible(s) dans GitLab UI (Admin → CI/CD → Runners)

---

## Objectif

Exécuter une véritable pipeline GitLab CI/CD end-to-end pour valider :
1. Tests unitaires et lint
2. Build et push des images Docker
3. Déploiement en preprod
4. Smoke tests en preprod
5. Déploiement gre green (optionnel - branche main)
6. Basculement prod blue → green (optionnel)

---

## Étape 1 : Vérification des prérequis

### 1.1 — Runners disponibles

```bash
# GitLab UI → Admin (couronne) → CI/CD → Runners

# Output attendu :
Status      Description       Tags
✅ online   vm1-runner        swarm-manager, swarm, docker
✅ online   vm2-runner        swarm-worker, swarm, docker
✅ online   vm3-runner        swarm-worker, swarm, docker
```

Si < 1 runner en ligne : exécute d'abord

```bash
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass
```

### 1.2 — Variables CI déclarées

```bash
# GitLab UI → Dépôt Quantum-Motors → Settings → CI/CD → Variables

# Output attendu :
Key                         Mask  Type
CI_REGISTRY_USER            ❌    Variable
CI_REGISTRY_PASSWORD        ✅    Variable
REGISTRY_PULL_USER          ❌    Variable
REGISTRY_PULL_PASSWORD      ✅    Variable
PREPROD_DB_ROOT_PASSWORD    ✅    Variable
PREPROD_DB_PASSWORD         ✅    Variable
PROD_DB_ROOT_PASSWORD       ✅    Variable
PROD_DB_PASSWORD            ✅    Variable
BACKEND_ADMIN_PASSWORD      ✅    Variable
```

Si manquant : exécute d'abord la Procédure 3.

### 1.3 — Dépôt Git configuré

```bash
cd /path/to/Quantum-Motors
git remote -v

# Output attendu :
origin  http://172.16.248.236/Quantum-Motors.git (fetch)
origin  http://172.16.248.236/Quantum-Motors.git (push)
```

Si le dépôt ne pointe pas vers GitLab : configure-le

```bash
git remote remove origin
git remote add origin http://172.16.248.236/Quantum-Motors.git
```

---

## Étape 2 : Trigger la pipeline (branche develop)

### 2.1 — Prépare la branche

```bash
cd /path/to/Quantum-Motors

# Switch vers develop
git checkout develop

# Ou crée une branche de feature
git checkout -b feature/test-pipeline
```

### 2.2 — Modifie un fichier arbitraire

```bash
# Modifie un fichier qui n'affecte pas le build/test
echo "# Validation pipeline - $(date)" >> README.md

# Ou modifie un autre fichier anodin
cat >> docs/NOTES.md << 'EOF'
## Test execution - $(date)

Pipeline test for validation of CI/CD integration.
EOF
```

### 2.3 — Commit et push

```bash
git add .
git commit -m "test: trigger CI/CD pipeline validation"
git push origin develop  # (ou ta branche de feature)

# Output attendu :
# Counting objects: 3, done.
# Delta compression using up to 4 threads.
# To http://172.16.248.236/Quantum-Motors.git
#  * [new branch]      develop -> develop
```

---

## Étape 3 : Observe la pipeline

### 3.1 — Accède au dashboard GitLab

```
http://172.16.248.236/Quantum-Motors/-/pipelines
```

Tu devrais voir une pipeline en cours (jaune : running).

### 3.2 — Stages attendus (pour branche develop)

```
Status   Stage           Job                   Duration
───────────────────────────────────────────────────────
⏳ test
   ├─ test_backend                          15s
   ├─ lint_backend                          10s
   ├─ lint_front                            8s
✅ build
   ├─ build_backend                         45s
   └─ build_frontend                        35s
⏳ deploy_preprod
   └─ deploy_preprod                        30s
⏳ test_preprod
   └─ test_preprod                          20s

❌ deploy_green          [SKIPPED - branche ≠ main]
❌ test_green            [SKIPPED - branche ≠ main]
❌ switch_prod           [SKIPPED - branche ≠ main]
```

---

## Étape 4 : Valide chaque stage

### Stage 1 : test_backend

**Clique sur job `test_backend`**

Output attendu :

```
Running with gitlab-runner ...
Running on vm2-runner...
$ cd clo5-backend-master
$ apt-get update
$ apt-get install -y --no-install-recommends openssl
...
●●●●● 6/6 tests passed [======] 100%

Job succeeded
```

### Stage 2 : lint_backend

**Clique sur job `lint_backend`**

Output attendu :

```
$ cd clo5-backend-master
$ yarn lint
Linting...
✔ All files passed linting

Job succeeded
```

### Stage 3 : lint_front

**Clique sur job `lint_front`**

Output attendu :

```
$ cd clo5-front-main
$ yarn lint
Linting...
✔ All files OK

Job succeeded
```

### Stage 4 : build_backend

**Clique sur job `build_backend`**

Output attendu (fin) :

```
docker push 172.16.248.236:5050/Quantum-Motors/backend:abc123def...
abc123def...: digest: sha256:...
Successfully pushed backend image

Job succeeded
```

### Stage 5 : build_frontend

**Clique sur job `build_frontend`**

Output attendu (fin) :

```
docker push 172.16.248.236:5050/Quantum-Motors/frontend:abc123def...
abc123def...: digest: sha256:...
Successfully pushed frontend image

Job succeeded
```

### Stage 6 : deploy_preprod

**Clique sur job `deploy_preprod`**

Output attendu :

```
$ docker stack deploy --with-registry-auth -c deploy/preprod.yml preprod
Creating service preprod_mariadb-preprod
Creating service preprod_api-preprod
Creating service preprod_front-preprod

$ until docker service ls | grep preprod_api-preprod | grep -q '1/1'; do sleep 5; done
(attendra ~20s que le service converge)

Job succeeded
```

### Stage 7 : test_preprod

**Clique sur job `test_preprod`**

Output attendu :

```
$ curl http://127.0.0.1 -H "Host: preprod.quantum.local"
<html>...</html>

Smoke test against http://127.0.0.1 (preprod.quantum.local / api-preprod.quantum.local)
...
✅ frontend home: PASS
✅ frontend configure: PASS
✅ api health: PASS
✅ api models: PASS
✅ api configure: PASS

Smoke test passed

Job succeeded
```

---

## Étape 5 : Valide en environnement réel

### 5.1 — Test résolution DNS

```bash
# Depuis ta machine locale
nslookup preprod.quantum.local
# Output : 172.16.248.64
```

### 5.2 — Accès à la frontend preprod

```bash
# Dans un navigateur
http://preprod.quantum.local
```

Acceptation ✅ : Page d'accueil du configurateur visible.

### 5.3 — Accès à l'API preprod

```bash
curl http://api-preprod.quantum.local/health -H "Content-Type: application/json"
```

Output attendu :

```json
{
  "status": "OK",
  "timestamp": "2026-04-13T..."
}
```

### 5.4 — Test une requête API

```bash
curl -X POST http://api-preprod.quantum.local/car/configure \
  -H "Content-Type: application/json" \
  -H "Authorization: P@ssw0rd!" \
  -d '{"model": 1, "color": 1, "battery": 1, "finish": 1}'
```

Output attendu :

```json
{
  "code": 200,
  "data": {
    "uic": "QM-...",
    "model": "Quantum Motors V1",
    ...
  }
}
```

### 5.5 — Consulte les logs dans Grafana

```bash
# Ouvre dans un navigateur
http://logs.quantum.local
```

Acceptation ✅ : Interface Grafana visible

Cherche dans Loki :

```
label_job = "swarm"
label_stack = "preprod"
```

Output attendu :

```
timestamp | container_name        | message
----------|----------------------|--------
14:32:01  | preprod_api-preprod  | GET /models HTTP/1.1 200
14:32:02  | preprod_front-pre... | Compiled successfully
...
```

---

## Étape 6 : Test blue/green (optionnel - branche main)

Si tu veux tester le déploiement prod (blue/green) :

### 6.1 — Switch vers main

```bash
cd /path/to/Quantum-Motors
git checkout main
```

### 6.2 — Trigger la pipeline

```bash
# Modifie un fichier
echo "# Prod test" >> README.md

git add .
git commit -m "test: prod green deployment"
git push origin main
```

### 6.3 — Observe la pipeline complète

La pipeline exécutera maintenant :
```
test → build → deploy_preprod → test_preprod → deploy_green → test_green → switch_prod
```

**Temps total : ~3-5 minutes**

### 6.4 — Valide prod green

Une fois tous les stages réussis :

```bash
# Frontend prod (green)
http://front-green.quantum.local
# OU
http://front.quantum.local  (après switch)

# API prod (green)
curl http://api.quantum.local/health
```

---

## Étape 7 : Analyse des erreurs (troubleshooting)

### Erreur : "Runner not found"

```
ERROR: Runner offline or no runner with tags: [docker, swarm]
```

**Cause :** Aucun runner en ligne

**Solution :**

```bash
# Vérifie que les runners tournent
ssh teixei_t@172.16.248.64 "docker ps | grep gitlab-runner"

# S'ils ne tournent pas, redémarre les playbooks
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass
```

### Erreur : "test_backend: FAILED"

```
ERROR: ENOENT: no such file or directory .env.test
```

**Cause :** Fichier de test manquant

**Solution :**

```bash
# Tous les fichiers .env.test.example sont présents
# Vérifie que le backend Dockerfile les copy
# Ou modifie la CI pour les créer dynamiquement

# Workaround : crée le fichier
cat > clo5-backend-master/.env.test.example << 'EOF'
DATABASE_URL=mysql://quantum:quantum@localhost:3306/quantum_motors_test
PORT=3000
EOF
```

### Erreur : "build_backend: Registry authentication failed"

```
ERROR: docker push: unauthorized
unauthorized: authentication required
```

**Cause :** CI_REGISTRY_PASSWORD ou REGISTRY_PULL_PASSWORD incorrect

**Solution :**

```bash
# 1. Revérifie les Deploy Tokens dans GitLab UI
#    Admin → Deploy Tokens
# 2. Copie les NOUVEAUX tokens
# 3. Mets à jour les variables CI
#    Dépôt → Settings → CI/CD → Variables
# 4. Relance la pipeline
```

### Erreur : "deploy_preprod: connection refused"

```
ERROR: Cannot connect to Swarm manager at 172.16.248.64:2377
```

**Cause :** Swarm manager non accessible ou down

**Solution :**

```bash
# Vérifie que vm1 tourne
ping 172.16.248.64

# Vérifie que Swarm est actif
ssh teixei_t@172.16.248.64 "docker swarm ca"

# Re-execute infrastructure playbook si besoin
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass
```

### Erreur : "test_preprod: timeout"

```
ERROR: Health check timeout: service not converged after 120s
```

**Cause :** Services preprod prennent trop de temps à démarrer

**Solution :**

```bash
# 1. Vérifie la ressource disponible dans Swarm
ssh teixei_t@172.16.248.64 "docker node ls"
ssh teixei_t@172.16.248.64 "docker stats"

# 2. Augmente le timeout dans .gitlab-ci.yml
#    Modifie "until docker service ls" pour attendre plus longtemps

# 3. Redémarre manuellement si bloqué
ssh teixei_t@172.16.248.64 "docker service ls"
ssh teixei_t@172.16.248.64 "docker service update preprod_api-preprod --force"
```

---

## Acceptation globale ✅

La pipeline est **validée** si :

1. ✅ Tous les stages **test**, **build**, **deploy_preprod**, **test_preprod** réussissent
2. ✅ Pas d'erreur dans les logs des jobs
3. ✅ Frontend accessible via `preprod.quantum.local`
4. ✅ API accessible via `api-preprod.quantum.local/health`
5. ✅ Logs visibles dans Grafana (`logs.quantum.local`)
6. ✅ (optionnel) Branche main complète jusqu'à `switch_prod` ✅

---

## Documentation post-validation

Une fois la pipeline validée, mets à jour la doc 0-bis :

```bash
# Édite la doc technique
nano docs/etape-0bis-documentation-technique.md

# Ajoute une nouvelle section :
## 10. Validation live

Validation exécutée le `2026-04-13` :

- ✅ Pipeline develop : test → build → deploy_preprod → test_preprod OK
- ✅ Frontend preprod : http://preprod.quantum.local OK
- ✅ API preprod : http://api-preprod.quantum.local/health OK
- ✅ Logs dans Grafana : http://logs.quantum.local OK
- ✅ Smoke tests : 5/5 passed
- ✅ Runners : 3/3 online, tags OK

Fait par : [Ton nom]
```

---

## Références

- [GitLab Pipelines](https://docs.gitlab.com/ee/ci/pipelines/)
- [GitLab Runners Documentation](https://docs.gitlab.com/runner/)
- [Docker Swarm Services](https://docs.docker.com/engine/reference/commandline/service/)
- [Traefik Routing](https://doc.traefik.io/traefik/routing/overview/)
