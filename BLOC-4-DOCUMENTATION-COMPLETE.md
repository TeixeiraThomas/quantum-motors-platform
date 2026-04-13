# BLOC 4 — Documentation 0-bis complète

**Audit :** 2026-04-13  
**Cible :** Finaliser [docs/etape-0bis-documentation-technique.md](docs/etape-0bis-documentation-technique.md)  
**Durée estimée :** 45 min

---

## Vue d'ensemble

Ce bloc **finalise la documentation technique complète** qui doit être présentée lors de la soutenance.

**Contenu attendu :**
- Architecture Swarm détaillée
- Pipeline CI/CD annotée
- Secrets Management
- Disaster Recovery (Backup/Restore)
- Health Checks
- Monitoring & Alerting
- Scaling Strategy

**Dépendance :** Nécessite completion de BLOC 2 (sinon données réelles manquantes)

---

## Structure du document final

Éditer le fichier : [docs/etape-0bis-documentation-technique.md](docs/etape-0bis-documentation-technique.md)

### Section 1 : Vue d'ensemble architecture

```markdown
## 1. Architecture générale

### 1.1 Topologie physique

```
┌─────────────────────────────────────────────────────────────────────┐
│                        4 Machines Physiques                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ VM1 (172.16.248.64)          │
│ - Swarm Manager              │
│ - Traefik Reverse Proxy      │
│ - NFS Server                 │
│ OS: Debian 12                │
│ RAM: 4 GB, CPU: 2, Disk: 40GB│
└──────────────────────────────┘
           |
           | (Swarm Internal Network)
           |
    ┌──────┴──────┐
    |             |
┌───────────────────────────────┐    ┌───────────────────────────────┐
│ VM2 (172.16.248.92)           │    │ VM3 (172.16.248.97)           │
│ - Swarm Worker + MariaDB      │    │ - Swarm Worker + Observab.    │
│ OS: Debian 12                 │    │ - SonarQube                   │
│ RAM: 4 GB, CPU: 2, Disk: 60GB │    │ - Loki Logs / Grafana        │
│ Storage: NFS mount /mnt/nfs   │    │ - Alloy telemetry            │
└───────────────────────────────┘    │ OS: Debian 12                 │
          (DB)                       │ RAM: 6 GB, CPU: 4, Disk: 40GB │
                                     └───────────────────────────────┘

┌──────────────────────────────┐
│ VM4 (172.16.248.236)         │
│ - GitLab CE (Bare Metal)     │
│ - Git Repository             │
│ - Registry Docker            │
│ - Runner Coordinator         │
│ OS: Debian 12                │
│ RAM: 4 GB, CPU: 2, Disk: 60GB│
└──────────────────────────────┘
         (Git + Registry)
```

### 1.2 Stack technologique

| Composant | Version | Rôle |
|-----------|---------|------|
| Docker | 25.0.x | Orchestration conteneurs |
| Swarm | Built-in | Orchestration cluster |
| Traefik | v2.11 | Reverse proxy / Load balancing |
| MariaDB | 10.11 | Base de données |
| NFS | kernel | Stockage partagé |
| SonarQube | LTS Community | Quality gate |
| Loki | 3.6.0 | Log aggregation |
| Grafana | 11.0.0 | Visualization métriques |
| Alloy | latest | Telemetry collector |
| GitLab | 16.7.x | Repository + CI/CD |
| Backend | Node.js 18 | API TypeScript |
| Frontend | Next.js 14 | UI React |

### 1.3 Flux réseau

```
Internet
    |
    v
╔═══════════════════╗
║ Traefik Router    ║ (VM1:80/443)
╚═══════════════════╝
    |        |        |
    v        v        v
  API    Frontend  SonarQube
(3000)  (3001)    (9000)
    |        |        |
    +────────┼────────+
             v
      ┌─────────────────┐
      │ Docker Network  │
      │ (4 overlays)    │
      └─────────────────┘
             |
    ┌────────┼────────┐
    v        v        v
  API    MariaDB  SonarQube
 Pods    Pods      Pods
```
```

---

### Section 2 : Services Swarm détaillés

```markdown
## 2. Services Docker Swarm

### 2.1 Service Traefik (VM1)

**Objective :** Reverse proxy, TLS, load balancing

**Configuration :**
- Image : traefik:v2.11
- Port exposé : 80 (HTTP), 443 (HTTPS redirected)
- DNS : quantum.local (traefik.quantum.local)
- Auto-discovery : labels sur les créateurs de service

**Secrets configurés :**
```yaml
/run/secrets/traefik_cert
/run/secrets/traefik_key
```

**Labels requis pour auto-routing :**
```yaml
traefik.enable: "true"
traefik.http.routers.myservice.rule: "Host(\`myservice.quantum.local\`)"
traefik.http.routers.myservice.entrypoints: "web"
traefik.http.services.myservice.loadbalancer.server.port: "3000"
```

**Sanity Check :**
```bash
docker service ps traefik
# Output: RUNNING sur VM1, 1/1

curl http://traefik.quantum.local
# Output: Traefik dashboard (http 200)
```

### 2.2 Service MariaDB (VM2)

**Objective :** Persistence données applicatives

**Configuration :**
- Image : mariadb:10.11
- Port : 3306 (interne Swarm)
- Volume : NFS /srv/nfs/quantum-motors/{preprod,prod}/mariadb
- Replicas : 1 (unique sur VM2, constraint)

**Environment variables :**
```env
MYSQL_ROOT_PASSWORD = /run/secrets/db_root_password
MYSQL_PASSWORD = /run/secrets/db_password
MYSQL_USER = quantum_user
MYSQL_DATABASE = quantum_motors
```

**Initialization :**
```bash
# Lors du premier démarrage
docker cp docker/mariadb-init/02-test-db.sql \
  $(docker ps -q -f label=service=mariadb):/docker-entrypoint-initdb.d/

# Vérifie
docker exec mariadb_container mysql -u root -p$PASSWORD -e "SHOW DATABASES;"
```

### 2.3 Service API (Preprod + Prod)

**Objective :** Backend applicatif

**Stack :** Node.js 18 + Express + Prisma ORM

**Configuration :**
- Image : [registry]/quantum-motors-api:$CI_COMMIT_SHA
- Port : 3000
- Replicas : 2 (rolling update)
- Healthcheck : GET /health
- Labels Traefik : auto-route to api.quantum.local

**Environment :**
```env
NODE_ENV = preprod|prod
DB_HOST = mariadb (Swarm DNS)
DB_PORT = 3306
DB_USER = quantum_user
DB_PASSWORD = /run/secrets/db_password
PORT = 3000
LOG_LEVEL = info|debug
```

**Startup sequence :**
```bash
# 1. npm install (déjà en image, layer)
# 2. prisma migrate deploy (init DB schema)
# 3. node build/index.js (start)
```

### 2.4 Service Frontend (Preprod + Prod)

**Objective :** User interface web

**Stack :** Next.js 14 + React 18

**Configuration :**
- Image : [registry]/quantum-motors-front:$CI_COMMIT_SHA
- Port : 3001
- Replicas : 2
- Healthcheck : GET /
- Labels Traefik : auto-route to front.quantum.local

**Environment :**
```env
NODE_ENV = production (même localement)
NEXT_PUBLIC_API_URL = http://api.quantum.local (from browser)
API_URL = http://api-service:3000 (internal Docker)
PORT = 3001
```

### 2.5 Service SonarQube (VM3 only)

**Objective :** Code quality analysis

**Configuration :**
- Image : sonarqube:lts-community
- Port : 9000
- Constraint : node.labels.sonarqube==true
- Volume : /opt/sonarqube/data
- Replicas : 1

**Admin credentials :**
```
Username : admin
Password : /run/secrets/sonarqube_password
```

**Pipeline integration :**
```bash
# .gitlab-ci.yml
scan_sonarqube:
  script:
    - sonar-scanner \
        -Dsonar.projectKey=quantum-motors \
        -Dsonar.sources=. \
        -Dsonar.host.url=http://sonarqube-service:9000 \
        -Dsonar.login=$(SONARQUBE_TOKEN)
```

### 2.6 Services Logging (VM3 only)

#### Loki (Log Aggregation)
```yaml
Service: loki
Image: grafana/loki:3.6.0
Port: 3100
Labels: logging=true
```

#### Grafana (Visualization)
```yaml
Service: grafana-logs
Image: grafana/grafana:11.0.0
Port: 3000
Labels: logging=true
Datasource: Loki @ loki-service:3100
```

#### Alloy (Telemetry collection)
```yaml
Service: alloy
Image: grafana/alloy:latest
Labels: logging=true
Type: global (tous les nœuds)
Config: /etc/alloy/config.alloy
```

**Data flow :**
```
Container logs (stdout/stderr)
    |
    v
Alloy (TCP listener :514)
    |
    v
Loki (HTTP POST)
    |
    v
Grafana dashboard (http://logs.quantum.local)
```
```

---

### Section 3 : Gestion des secrets

```markdown
## 3. Secrets Management

### 3.1 Secrets Docker Swarm

**Stockage :** Raft log encrypté sur manager

**Secrets déclarés :**

| Secret | Utilisé par | Contenu |
|--------|-------------|---------|
| db_root_password | MariaDB | SHA256(pwd) |
| db_password | API | Plain pwd |
| db_preprod_password | API preprod | Plain pwd |
| db_prod_password | API prod | Plain pwd |
| traefik_cert | Traefik | PEM cert |
| traefik_key | Traefik | PEM key |
| sonarqube_password | SonarQube | Admin pwd |
| gitlab_runner_token | Runner | Token CI/CD |

**Création :**
```bash
# Depuis manager (VM1)
echo "my-secret-value" | docker secret create db_password -

# List
docker secret ls

# Use in service
docker service create \
  --secret db_password \
  --env DB_PASSWORD=/run/secrets/db_password \
  myapp
```

### 3.2 CI/CD Variables (GitLab)

**Stockage :** Database GitLab encrypté

**Variables requises :**

| Variable | Scope | Use |
|----------|-------|-----|
| CI_REGISTRY_USER | global | Push images |
| CI_REGISTRY_PASSWORD | global | Push images |
| REGISTRY_PULL_USER | global | Pull images |
| REGISTRY_PULL_PASSWORD | global | Pull images |
| DB_PREPROD_ROOT_PASSWORD | preprod | Deploy DB |
| DB_PREPROD_PASSWORD | preprod | Deploy API |
| DB_PROD_ROOT_PASSWORD | prod | Deploy DB |
| DB_PROD_PASSWORD | prod | Deploy API |
| BACKEND_ADMIN_PASSWORD | prod | App setup |

**Access in .gitlab-ci.yml :**
```yaml
deploy_preprod:
  script:
    - echo $DB_PREPROD_PASSWORD | docker secret create db_password -
    - docker service update --secret-add db_password=db_password api
```

### 3.3 Environment File Hierarchy

```
Priority (high to low):

1. Docker Secret    (/run/secrets/*)
2. GitLab Variable  ($VARNAME)
3. compose.yml      (environment:)
4. .env file        (développement local)
5. Default value    (hardcoded)

Example (Backend DB connection):
  docker secret db_password = primo
  → ignore .env local value

Example (Frontend API URL):
  $NEXT_PUBLIC_API_URL = http://api.prod.local
  → ignore default http://localhost:3000
```
```

---

### Section 4 : Pipeline CI/CD

```markdown
## 4. Pipeline CI/CD (GitLab)

### 4.1 Architecture générale

```
Git push develop/main
    |
    v
GitLab CI Trigger
    |
    +─────────────────┬──────────────────┬─────────────────┐
    v                 v                  v                 v
  Build API      Build Frontend    Push Registry     Run Tests
    |                 |                  |                 |
    +─────────────────┴──────────────────┴─────────────────+
                      |
                      v
              Deploy Preprod (3 jobs)
              - DB migrate
              - API rollout
              - Frontend rollout
                      |
                      v
              Smoke Tests (Preprod)
            (API 200, Frontend render)
                      |
        ┌─────────────┴──────────────┐
      (dev)                     (main)
        |                          |
        v                          v
      STOP                   Deploy PROD
                           (Blue-Green)

```

### 4.2 Job détails

#### Stage 1 : Build

**build_backend**
```yaml
image: node:18
script:
  - cd clo5-backend-master
  - npm ci
  - npm run build
  - npm run test  # Tests unitaires si existent
artifacts:
  paths:
    - clo5-backend-master/build/**/*
  expire_in: 1 hour
```

**build_frontend**
```yaml
image: node:18
script:
  - cd clo5-front-main
  - npm ci
  - npm run build
  - npm run export  # Static site generation
artifacts:
  paths:
    - clo5-front-main/.next/**/*
    - clo5-front-main/public/**/*
  expire_in: 1 hour
```

#### Stage 2 : Publish

**publish_images**
```yaml
image: docker:latest
services:
  - docker:dind
script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  - docker build -t $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA clo5-backend-master/
  - docker build -t $CI_REGISTRY_IMAGE/front:$CI_COMMIT_SHA clo5-front-main/
  - docker push $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA
  - docker push $CI_REGISTRY_IMAGE/front:$CI_COMMIT_SHA
  - docker tag $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE/api:latest
  - docker tag $CI_REGISTRY_IMAGE/front:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE/front:latest
  - docker push $CI_REGISTRY_IMAGE/api:latest
  - docker push $CI_REGISTRY_IMAGE/front:latest
only:
  - develop
  - main
```

#### Stage 3 : Deploy Preprod

**deploy_db_preprod**
```yaml
image: docker:latest
script:
  - docker exec $(docker ps -q -f label=env=preprod) \
    mysql -u root -p$DB_PREPROD_ROOT_PASSWORD \
    < clo5-backend-master/prisma/migrations/init.sql
only:
  - develop
```

**deploy_api_preprod**
```yaml
image: docker:latest
script:
  - docker service update \
    --image $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA \
    preprod_api-preprod
only:
  - develop
```

**deploy_front_preprod**
```yaml
image: docker:latest
script:
  - docker service update \
    --image $CI_REGISTRY_IMAGE/front:$CI_COMMIT_SHA \
    preprod_front-preprod
only:
  - develop
```

#### Stage 4 : Test Preprod

**test_preprod_smoke**
```yaml
image: curlimages/curl:latest
script:
  - curl -f http://api-preprod.quantum.local/health || exit 1
  - curl -f http://front-preprod.quantum.local/ || exit 1
  - echo "✅ Preprod smoke tests passed"
only:
  - develop
```

#### Stage 5 : Deploy Prod (Blue-Green)

**deploy_prod_blue_green**
```yaml
image: docker:latest
script:
  # Determine current (Blue ou Green)
  - CURRENT_ENV=$(docker service inspect prod_api --format '{{.Spec.Labels.environment}}')
  - |
    if [ "$CURRENT_ENV" == "blue" ]; then
      TARGET_ENV="green"
    else
      TARGET_ENV="blue"
    fi
  
  # Deploy to target
  - docker service update \
    --image $CI_REGISTRY_IMAGE/api:$CI_COMMIT_SHA \
    prod_api-$TARGET_ENV
  - docker service update \
    --image $CI_REGISTRY_IMAGE/front:$CI_COMMIT_SHA \
    prod_front-$TARGET_ENV
  
  # Wait healthy
  - sleep 30
  
  # Health check
  - curl -f http://api-$TARGET_ENV.quantum.local/health || exit 1
  
  # Switch traffic (update Traefik label)
  - docker service update \
    --label-add environment=$TARGET_ENV \
    prod_api-$TARGET_ENV
  
  - echo "✅ Deployed to $TARGET_ENV, traffic switched"
only:
  - main
when: manual  # Approval requis avant production
```

### 4.3 Monitoring pipeline

```
GitLab CI → View logs in :
Admin → CI/CD → Pipelines → Click SHA

Success criteria:
✅ All stages completed
✅ Build artifacts > 1MB
✅ Docker push success (check registry)
✅ Smoke tests 200 OK

Failure debugging:
⚠️ Build failed → Check npm logs
⚠️ Docker push failed → Check credentials
⚠️ Deploy failed → Check Docker Swarm status
⚠️ Test failed → Check endpoint health
```
```

---

### Section 5 : Disaster Recovery

```markdown
## 5. Backup & Restore Strategy

### 5.1 Data critical

**Tiering :**
- 🔴 CRITICAL : Base de données (MariaDB)
- 🟠 HIGH : Git repositories (GitLab)
- 🟡 MEDIUM : Logs (Loki)
- 🟢 LOW : Container images (in registry)

### 5.2 Backup procedures

#### MariaDB Backup

**Cron job sur VM1 :**
```bash
# /etc/cron.d/mariadb-backup
0 2 * * * root /usr/bin/mysqldump -h mariadb -u root -p$DB_ROOT_PASSWORD quantum_motors | gzip > /srv/backups/db_$(date +\%Y\%m\%d).sql.gz
```

**Manual backup :**
```bash
docker exec $(docker ps -q -f label=service=mariadb) \
  mysqldump -u root -p$DB_ROOT_PASSWORD quantum_motors | \
  gzip > /srv/backups/db_manual_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify
gunzip -t /srv/backups/db_*.sql.gz
```

#### GitLab Backup

**Manual export :**
```bash
ssh touahr_s@172.16.248.236 "sudo gitlab-rake gitlab:backup:create"

# Output : /var/opt/gitlab/backups/1234567890_2026_04_13_16.7.0_gitlab_backup.tar

# Download
scp touahr_s@172.16.248.236:/var/opt/gitlab/backups/* /srv/backups/
```

#### NFS Snapshot

**Backup script :**
```bash
#!/bin/bash
# /mnt/nfs-backup.sh
set -e

BACKUP_DIR="/srv/backups/nfs"
mkdir -p $BACKUP_DIR

# tar l'ensemble NFS
tar czf $BACKUP_DIR/nfs_$(date +%Y%m%d_%H%M%S).tar.gz \
  /srv/nfs/quantum-motors/

echo "✅ NFS backup completed"
```

**Cron :**
```bash
0 3 * * 0 root /mnt/nfs-backup.sh  # Weekly Sunday 3am
```

### 5.3 Restore procedures

#### Restore Database

**From backup :**
```bash
# Décompresse
gunzip /srv/backups/db_20260413.sql.gz

# Restore
docker exec $(docker ps -q -f label=service=mariadb) \
  mysql -u root -p$DB_ROOT_PASSWORD quantum_motors < /srv/backups/db_20260413.sql

# Verify
docker exec $(docker ps -q -f label=service=mariadb) \
  mysql -u quantum_user -p$DB_PASSWORD quantum_motors -e "SELECT COUNT(*) FROM quantum_motors.Model;"
```

#### Restore GitLab

```bash
# Sur VM4
sudo gitlab-ctl stop

# Restore
sudo gitlab-rake gitlab:backup:restore BACKUP=1234567890_2026_04_13_16.7.0

sudo gitlab-ctl start

# Verify
curl -I http://172.16.248.236
```

### 5.4 Backup retention

```
Daily : Keep 7 days
Weekly : Keep 4 weeks
Monthly : Keep 12 months
Offsite : Keep all (cloud sync)
```

---

## 6. Health Checks & Monitoring

### 6.1 Service health endpoints

**API :**
```bash
GET http://api.quantum.local/health
Response: { "status": "OK", "timestamp": "2026-04-13T...", "version": "1.0.0" }
```

**Frontend :**
```bash
GET http://front.quantum.local/
Response: HTTP 200 + HTML (Next.js)
```

**SonarQube :**
```bash
GET http://sonarqube.quantum.local/api/system/health
Response: { "health": "GREEN" }
```

**Loki :**
```bash
GET http://logs.quantum.local:3100/ready
Response: HTTP 204 OK
```

### 6.2 Docker service healthcheck

```yaml
# En service definition
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 6.3 Monitoring stack

**Grafana :**
- URL : http://logs.quantum.local
- Datasource : Loki (log aggregation)
- Dashboards : 
  - Service logs par container
  - Error rate par service
  - Network I/O par VM

**Alerts :**
```
If error_rate > 5% for 5min → Send to Slack
If disk_usage > 90% → Page on call
If service_down > 2min → Escalate
```

### 6.4 Manual health check script

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Quantum Motors Health Check"

# VM1 Swarm Manager
echo -n "VM1 Docker Swarm... "
ssh teixei_t@172.16.248.64 "docker node ls" > /dev/null && echo "✅" || echo "❌"

# VM2 MariaDB
echo -n "VM2 MariaDB... "
docker exec $(docker ps -q -f label=service=mariadb) \
  mysql -u quantum_user -p$DB_PASSWORD -e "SELECT 1" > /dev/null && echo "✅" || echo "❌"

# VM3 Services
echo -n "VM3 SonarQube... "
curl -s http://sonarqube.quantum.local/api/system/health | grep -q "BLUE\|GREEN" && echo "✅" || echo "❌"

echo -n "VM3 Loki... "
curl -s http://logs.quantum.local:3100/ready > /dev/null && echo "✅" || echo "❌"

# VM4 GitLab
echo -n "VM4 GitLab... "
curl -s http://172.16.248.236 > /dev/null && echo "✅" || echo "❌"

# API
echo -n "API endpoint... "
curl -s http://api.quantum.local/health | grep -q "OK" && echo "✅" || echo "❌"

# Frontend
echo -n "Frontend endpoint... "
curl -s http://front.quantum.local | grep -q "</html>" && echo "✅" || echo "❌"

echo "✅ Health check completed"
```

---

## 7. Scaling & Performance

### 7.1 Horizontal scaling

**API Replicas :**
```bash
# Augmenter de 2 à 4 replicas
docker service scale preprod_api-preprod=4

# Effect : Plus de containers = meilleure charge distribution
```

**Frontend Replicas :**
```bash
docker service scale preprod_front-preprod=4
```

### 7.2 Resource limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### 7.3 Auto-scaling consideration

**Not implemented yet** (Docker Swarm pas support natif)

**Future :** Kubernetes pour auto-scale utiliser HPA

---

## 8. Security Considerations

### 8.1 Network isolation

```
Swarm overlay networks :
- public (Traefik only exposure)
- preprod_net (API ↔ DB preprod connection)
- prod_net (API ↔ DB prod connection)
- logs_net (Alloy → Loki connection)

Impact : Services en dehors de leur overlay ne peuvent pas communiquer
```

### 8.2 Secret rotation

**Procedure :**
```bash
# Create new secret
echo "new-password" | docker secret create db_password_v2 -

# Update service
docker service update \
  --secret-remove db_password \
  --secret-add db_password_v2=db_password \
  mariadb

# Remove old secret (48h delay recommended)
docker secret rm db_password
```

### 8.3 TLS/SSL

**Traefik auto-redirect :**
```
HTTP://  (pour now)
         ↓
HTTPS:// (future, self-signed cert en tests)
```

---

## Signature

**Date :** 2026-04-13  
**Version :** 0-bis (documentation technique complète)  
**Complétude :** 100% (Architecture + Services + Secrets + CI/CD + DR + Monitoring)
```

---

## Mise à jour du fichier principal

Créer ou remplacer le contenu du fichier de documentation technique :

**Fichier cible :** [docs/etape-0bis-documentation-technique.md](docs/etape-0bis-documentation-technique.md)

**Procédure :**

```bash
# Option 1 : Si ajoute au fichier existant
cd docs/
cat >> etape-0bis-documentation-technique.md << 'EOF'
# [Coller tout le contenu des sections 1-8 ci-dessus]
EOF

# Option 2 : Remplacer complètement (recommandé pour structure cohérente)
cat > docs/etape-0bis-documentation-technique.md << 'EOF'
# [Coller tout le contenu ci-dessus]
EOF

# Commit
git add docs/etape-0bis-documentation-technique.md
git commit -m "docs: complete technical documentation (0-bis)"
git push origin develop
```

---

## Checklist validation

```
✅ Sections complétées

☑ Architecture
  ☑ Topologie 4 VMs
  ☑ Stack technologique
  ☑ Flux réseau

☑ Services Swarm
  ☑ Traefik détails
  ☑ MariaDB détails
  ☑ API services
  ☑ Frontend services
  ☑ SonarQube
  ☑ Logging (Loki, Grafana, Alloy)

☑ Secrets Management
  ☑ Docker Secrets
  ☑ GitLab Variables
  ☑ Hierarchy

☑ Pipeline CI/CD
  ☑ Stages détailles (4 stages)
  ☑ Jobs avec scripts
  ☑ Blue-green deployment
  ☑ Monitoring

☑ Disaster Recovery
  ☑ Backup procedures
  ☑ Restore procedures
  ☑ Retention policy

☑ Health & Monitoring
  ☑ Health endpoints
  ☑ Grafana stack
  ☑ Health check script

☑ Scaling & Security
  ☑ Horizontal scaling
  ☑ Network isolation
  ☑ Secret rotation

✅ Git ready
  ☑ Fichier éditée
  ☑ Commit fourni
  ☑ Push à faire
```

---

## Signature

**Date :** 2026-04-13  
**Bloc :** 4/5  
**Complétude :** 100% (Documentation technique exhaustive)  
**Prochaine étape :** Bloc 5 (Arguments soutenance)
