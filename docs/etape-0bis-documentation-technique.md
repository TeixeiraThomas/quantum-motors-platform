# Etape 0-bis - Documentation technique vivante

Etat documente le `2026-04-04`.

## 1. Perimetre

Cette documentation accompagne les etapes d'infrastructure et de CI/CD. Elle decrit l'etat reel du depot et de l'infrastructure au moment de la mise a jour, afin qu'un tiers puisse comprendre l'architecture et la reproduire.

## 2. Historique des evolutions

| Etape | Evolution | Impact |
| --- | --- | --- |
| `Etape 0` | Schema initial du projet | Base de l'architecture cible |
| `Etape 1` | Swarm, SonarQube, GitLab bare metal | Infrastructure de base automatisee par Ansible |
| `Etape 2` | Traefik, runners GitLab, pipeline CI/CD, blue/green, NFS | Chaine de build et de deploiement continue |

## 3. Choix techniques

### Orchestrateur

- `Docker Swarm` a ete retenu pour rester simple a deployer et a operer sur `3` VMs tout en supportant overlay networks, services replicas et blue/green.

### Automatisation

- `Ansible` pilote la creation du cluster, la configuration des hotes, l'installation de GitLab, le deploiement de Traefik et l'enregistrement des runners.

### Entree HTTP

- `Traefik` est utilise comme reverse proxy et load balancer.
- Le choix permet un routage par labels Docker et facilite le passage `blue -> green` sans reconfigurer la machine hote.

### CI/CD

- `GitLab CE` est heberge hors cluster sur `VM4`.
- Les runners sont installes sur les noeuds Swarm pour pouvoir construire des images, pousser dans la registry GitLab et executer les deploiements au plus proche du cluster.

### Stockage persistant

- MariaDB de preproduction et de production utilisent des volumes `NFS`.
- `VM1` exporte les repertoires NFS, `VM2` consomme ces volumes pour les services MariaDB.

## 4. Architecture actuelle

Le schema mis a jour est disponible dans [`etape-0bis-schema-infrastructure.md`](./etape-0bis-schema-infrastructure.md).

### Repartition des roles

| Hote | Adresse | Role |
| --- | --- | --- |
| `vm1` | `172.16.248.64` | manager Swarm, Traefik, export NFS, runner |
| `vm2` | `172.16.248.92` | worker Swarm, MariaDB, runner |
| `vm3` | `172.16.248.97` | worker Swarm, SonarQube, runner |
| `vm4` | `172.16.248.236` | GitLab CE, registry GitLab |

### Reseaux

Les reseaux overlay definis dans [`ansible/inventories/production/group_vars/all.yml`](../ansible/inventories/production/group_vars/all.yml) sont:

- `public`
- `preprod_net`
- `prod_net`

Usage:

- `public`: exposition via Traefik
- `preprod_net`: services applicatifs de preproduction + MariaDB preprod
- `prod_net`: services applicatifs blue/green + MariaDB prod

Les services exposes via Traefik definissent explicitement `traefik.docker.network=public` pour eviter que Traefik selectionne un reseau applicatif prive sur les conteneurs multi-reseaux.

### Stockage

- export NFS racine: `/srv/nfs/quantum-motors`
- export preprod: `/srv/nfs/quantum-motors/preprod/mariadb`
- export prod: `/srv/nfs/quantum-motors/prod/mariadb`

Les manifests concernes sont:

- [`deploy/preprod.yml`](../deploy/preprod.yml)
- [`deploy/prod-db.yml`](../deploy/prod-db.yml)

## 5. Applications et dependances

### Backend

- application: `Node.js`, `Express`, `Prisma`, MariaDB
- dossier: [`clo5-backend-master`](../clo5-backend-master)
- variables principales:
  - `DATABASE_URL`
  - `PORT`
  - `HOST`
  - `ADMIN_PASSWORD`
  - `CAR_SERVICE_IMAGE_URL`
  - `CORS_ORIGIN`

### Frontend

- application: `Next.js`
- dossier: [`clo5-front-main`](../clo5-front-main)
- le frontend parle au backend via un proxy runtime `/api`
- variables principales:
  - `NEXT_PUBLIC_API_URL`
  - `API_URL_INTERNAL`
  - `HOST`
  - `PORT`

### Flux inter-services

1. Le navigateur appelle `front.quantum.local` ou `preprod.quantum.local`.
2. Traefik route la requete vers le service frontend sur `public`.
3. Le frontend appelle `/api/...`.
4. Le proxy Next.js route vers `API_URL_INTERNAL`.
5. Le backend accede a MariaDB via `preprod_net` ou `prod_net`.

## 6. GitLab, registry et runners

### GitLab

- playbook: [`ansible/playbooks/gitlab.yml`](../ansible/playbooks/gitlab.yml)
- role principal: `install_gitlab`
- URL applicative: `http://172.16.248.236`
- registry: `http://172.16.248.236:5050`
- les noeuds Swarm declarent cette registry comme `insecure registry` dans la configuration Docker

### Secrets Ansible

Les secrets ne sont pas stockes en clair dans les roles.

Variables sensibles attendues:

- `vault_gitlab_root_password`
- `vault_gitlab_prof_password`
- `vault_gitlab_runner_registration_token`

### Runners

- playbook: [`ansible/playbooks/runners.yml`](../ansible/playbooks/runners.yml)
- role: [`ansible/roles/gitlab_runner`](../ansible/roles/gitlab_runner)
- image runner: `gitlab/gitlab-runner:alpine`
- image docker par defaut: `docker:24.0.7`

Tags deployes:

- base: `swarm`, `docker`
- manager: `swarm-manager`
- worker: `swarm-worker`

Usage attendu:

- jobs de build et de deploiement Swarm sur `swarm-manager`
- jobs eventuels de calcul ou d'integration sur `swarm-worker`

## 7. CI/CD et blue/green

Le pipeline GitLab est defini dans [`/.gitlab-ci.yml`](../.gitlab-ci.yml).

### Stages

1. `test`
2. `build`
3. `deploy_preprod`
4. `test_preprod`
5. `deploy_green`
6. `test_green`
7. `switch_prod`

### Flux de deploiement

1. tests backend et lint front/backend
2. build et push des images `backend` et `frontend`
3. deploiement de `preprod` avec remise a zero du stockage MariaDB puis initialisation par le SQL de catalogue
4. smoke tests HTTP sur `preprod.quantum.local` et `api-preprod.quantum.local`
5. deploiement de la base `prod-db`, puis de `prod-green`
6. smoke tests HTTP sur `front-green.quantum.local` et `api-green.quantum.local`
7. bascule des domaines stables vers `prod-green` via `prod-green-live.yml`, puis suppression de la stack `prodgreen`

### Manifests de deploiement

- Traefik: [`deploy/traefik.yml`](../deploy/traefik.yml)
- Preprod: [`deploy/preprod.yml`](../deploy/preprod.yml)
- Base prod: [`deploy/prod-db.yml`](../deploy/prod-db.yml)
- Prod blue: [`deploy/prod-blue.yml`](../deploy/prod-blue.yml)
- Prod green: [`deploy/prod-green.yml`](../deploy/prod-green.yml)
- Prod live blue: [`deploy/prod-blue-live.yml`](../deploy/prod-blue-live.yml)
- Prod live green: [`deploy/prod-green-live.yml`](../deploy/prod-green-live.yml)

### Variables CI attendues

Variables GitLab CI a definir dans le projet:

- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`
- `REGISTRY_PULL_USER`
- `REGISTRY_PULL_PASSWORD`
- `PREPROD_DB_ROOT_PASSWORD`
- `PREPROD_DB_PASSWORD`
- `PROD_DB_ROOT_PASSWORD`
- `PROD_DB_PASSWORD`
- `BACKEND_ADMIN_PASSWORD`

Les jobs de build peuvent utiliser les credentials CI GitLab natifs. Les jobs de deploiement Swarm utilisent un credential registry durable afin que les noeuds puissent re-pull les images apres la fin du job CI.

## 8. Procedures de deploiement

### Provisionner le cluster

Depuis `ansible/`:

```bash
ansible-playbook playbooks/infrastructure.yml
```

Ce playbook:

- installe Docker sur `vm1`, `vm2`, `vm3`
- initialise Swarm
- cree les reseaux overlay
- prepare NFS
- deploie Traefik
- deploie SonarQube

### Installer GitLab sur VM4

```bash
ansible-playbook playbooks/gitlab.yml
```

### Deployer les runners GitLab

```bash
ansible-playbook playbooks/runners.yml
```

Pre-requis:

- `vault_gitlab_runner_registration_token` doit etre defini

### Lancer la stack locale

Depuis la racine du depot:

```bash
docker compose up --build -d
```

La stack locale sert au developpement et a la validation rapide de l'application, independamment du cluster.

## 9. Tests et validation

### Validation depot

Validation realisee le `2026-04-04`:

- build frontend: OK
- lint frontend: OK
- build backend: OK
- lint backend: OK
- tests backend: `41/41` OK
- `ansible-playbook --syntax-check`: OK
- `ansible-lint`: OK
- `docker compose config` sur les manifests de deploiement: OK

### Validation live

Validation live realisee le `2026-04-04`:

- `infrastructure.yml` rejoue avec succes sur `vm1`, `vm2`, `vm3`
- `runners.yml` rejoue avec succes sur `vm1`, `vm2`, `vm3`
- runners GitLab actifs:
  - `vm1-runner`
  - `vm2-runner`
  - `vm3-runner`

Point encore a faire pour la validation finale etape 2:

- executer un vrai pipeline GitLab sur un commit pousse
- verifier les deploiements applicatifs live en preprod et en production green

## 10. Arborescence utile

```text
Quantum-Motors/
|-- ansible/
|   |-- inventories/production/
|   |-- playbooks/
|   `-- roles/
|-- clo5-backend-master/
|-- clo5-front-main/
|-- deploy/
|-- docker/
|-- tests/functional/
`-- docs/
```

## 11. Points d'attention

- `GitLab` reste volontairement hors cluster pour respecter les consignes du module.
- Les mots de passe et tokens doivent rester dans `Ansible Vault` ou dans les variables GitLab CI.
- Les manifests `prod-blue-live.yml` et `prod-green-live.yml` sont les seuls a porter les domaines stables `front.quantum.local` et `api.quantum.local`.
- Les services MariaDB Swarm montent le SQL de catalogue au premier demarrage pour disposer de donnees fonctionnelles en preprod et en prod. Ce SQL inclut aussi l'etat attendu de `_prisma_migrations`.
- Le frontend ne doit pas etre rebuild par environnement pour changer l'URL backend: le proxy `/api` evite ce couplage.
