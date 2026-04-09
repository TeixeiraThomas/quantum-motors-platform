# Etape 0-bis - Documentation technique vivante

Etat documente le `2026-04-09`.

## 1. Perimetre

Cette documentation accompagne les etapes d'infrastructure et de CI/CD. Elle decrit l'etat reel du depot et de l'infrastructure au moment de la mise a jour, afin qu'un tiers puisse comprendre l'architecture et la reproduire.

## 1-bis. Documentation vivante

### Objectif

- fournir un etat de reference a jour pour la soutenance et pour un tiers qui reprendrait le projet
- centraliser les choix techniques, la topologie, les procedures et les dependances
- eviter l'ecart entre ce qui est documente et ce qui est effectivement deploye

### Regles de maintenance

La documentation doit etre mise a jour a chaque evolution significative:

- ajout, suppression ou deplacement d'un service
- changement de role d'une VM
- changement de reseau, volume, domaine, registry ou reverse proxy
- changement du pipeline CI/CD ou des procedures Ansible
- changement des variables requises pour reproduire le projet

### Source de verite

Les artefacts suivants sont consideres comme les sources de verite du projet:

| Element | Source |
| --- | --- |
| Infrastructure Ansible | `ansible/playbooks/` et `ansible/roles/` |
| Inventaire et parametrage | `ansible/inventories/production/` |
| Deploiement Swarm applicatif | `deploy/` |
| Pipeline CI/CD | `/.gitlab-ci.yml` |
| Tests fonctionnels | `tests/functional/` |
| Documentation courante | `docs/etape-0bis-*.md` |

## 2. Historique des evolutions

| Etape | Evolution | Impact |
| --- | --- | --- |
| `Etape 0` | Schema initial du projet | Base de l'architecture cible |
| `Etape 1` | Swarm, SonarQube, GitLab bare metal | Infrastructure de base automatisee par Ansible |
| `Etape 2` | Traefik, runners GitLab, pipeline CI/CD, blue/green, NFS, Loki, Grafana, Alloy | Chaine de build, de deploiement et d'observabilite continue |

## 3. Choix techniques

### Orchestrateur

- `Docker Swarm` a ete retenu pour rester simple a deployer et a operer sur `3` VMs tout en supportant overlay networks, services replicas et blue/green.

### Automatisation

- `Ansible` pilote la creation du cluster, la configuration des hotes, l'installation de GitLab, le deploiement de Traefik et l'enregistrement des runners.
- Le role `docker_swarm` reste generique: reseaux et labels de noeuds proviennent uniquement de variables d'inventaire, sans logique metier hardcodee dans le role.

### Entree HTTP

- `Traefik` est utilise comme reverse proxy et load balancer.
- Le choix permet un routage par labels Docker et facilite le passage `blue -> green` sans reconfigurer la machine hote.

### Collecte de logs

- `Loki` centralise les logs d'execution des conteneurs du cluster.
- `Grafana Alloy` tourne en mode `global` sur tous les noeuds Swarm et collecte les logs via l'API Docker locale.
- `Grafana` expose une interface de consultation sur `logs.quantum.local`.
- `Alloy` a ete retenu a la place de `Promtail` car `Promtail` est desormais en fin de vie.
- Cette approche couvre les logs applicatifs, les logs Traefik et les logs des services d'infrastructure sans modifier les applications.

### CI/CD

- `GitLab CE` est heberge hors cluster sur `VM4`.
- Les runners sont installes sur les noeuds Swarm pour pouvoir construire des images, pousser dans la registry GitLab et executer les deploiements au plus proche du cluster.

### Stockage persistant

- MariaDB de preproduction et de production utilisent des volumes `NFS`.
- `VM1` exporte les repertoires NFS, `VM2` consomme ces volumes pour les services MariaDB.

### Capacite et protections

- Les services Swarm critiques declarent des `reservations` et `limits` CPU/RAM pour reduire les evictions et mieux partager les `2 vCPU / 4 Go` de chaque VM.
- `SonarQube` est volontairement borne sur le noeud `vm3` pour laisser de la capacite a `Loki`, `Grafana` et aux runners.

## 4. Architecture actuelle

Le schema mis a jour est disponible dans [`etape-0bis-schema-infrastructure.md`](./etape-0bis-schema-infrastructure.md).

### Repartition des roles

| Hote | Adresse | Role |
| --- | --- | --- |
| `vm1` | `172.16.248.64` | manager Swarm, Traefik, export NFS, runner |
| `vm2` | `172.16.248.92` | worker Swarm, MariaDB, runner |
| `vm3` | `172.16.248.97` | worker Swarm, SonarQube, Loki, Grafana, runner |
| `vm4` | `172.16.248.236` | GitLab CE, registry GitLab |

### Reseaux

Les reseaux overlay definis dans [`ansible/inventories/production/group_vars/all.yml`](../ansible/inventories/production/group_vars/all.yml) sont:

- `public`
- `preprod_net`
- `prod_net`
- `logs_net`

Usage:

- `public`: exposition via Traefik
- `preprod_net`: services applicatifs de preproduction + MariaDB preprod
- `prod_net`: services applicatifs blue/green + MariaDB prod
- `logs_net`: trafic entre `Alloy`, `Loki` et `Grafana`

Les services exposes via Traefik definissent explicitement `traefik.docker.network=public` pour eviter que Traefik selectionne un reseau applicatif prive sur les conteneurs multi-reseaux.

### Stockage

- export NFS racine: `/srv/nfs/quantum-motors`
- export preprod: `/srv/nfs/quantum-motors/preprod/mariadb`
- export prod: `/srv/nfs/quantum-motors/prod/mariadb`
- stockage Loki: `/srv/loki`
- etat Alloy par noeud: `/srv/alloy`
- stockage Grafana logs: `/srv/grafana`

Les manifests concernes sont:

- [`deploy/preprod.yml`](../deploy/preprod.yml)
- [`deploy/prod-db.yml`](../deploy/prod-db.yml)
- [`deploy/logging.yml`](../deploy/logging.yml)

### Matrice des services

| Service | Emplacement | Exposition | Source de deploiement |
| --- | --- | --- | --- |
| `Docker Swarm manager` | `vm1` | interne cluster | `ansible/playbooks/infrastructure.yml` |
| `Traefik` | `vm1` | HTTP `*:80` | `deploy/traefik.yml` |
| `MariaDB preprod/prod` | `vm2` | reseaux prives Swarm | `deploy/preprod.yml`, `deploy/prod-db.yml` |
| `SonarQube` | `vm3` | port `9000` inter-noeuds | role `SonarQube` |
| `Loki` | `vm3` | port `3100` interne/ops | `deploy/logging.yml` |
| `Grafana logs` | `vm3` | `logs.quantum.local` | `deploy/logging.yml` |
| `GitLab CE` | `vm4` | `http://172.16.248.236` | `ansible/playbooks/gitlab.yml` |
| `GitLab Registry` | `vm4` | `http://172.16.248.236:5050` | `install_gitlab` |
| `GitLab Runner` | `vm1`, `vm2`, `vm3` | execution CI interne | `ansible/playbooks/runners.yml` |

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
6. Les logs des conteneurs sont lus localement par `Alloy`, pousses vers `Loki` via `logs_net`, puis consultables dans `Grafana`.

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

Variables d'infrastructure importantes:

- `swarm_node_labels`
- `overlay_networks`
- `sonarqube_resources`
- `gitlab_admin_users` doit etre renseigne avec les vrais logins des intervenants avant l'execution de `gitlab.yml`

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
- Logging: [`deploy/logging.yml`](../deploy/logging.yml)
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

### Pre-requis de reproduction

Machine d'administration:

- `Ansible` installe localement
- acces SSH aux `4` VMs
- acces au fichier Vault ou aux secrets equivalentes
- client Docker disponible si vous souhaitez valider localement les manifests avec `docker compose config`

Pre-requis reseau:

- resolution locale des domaines `*.quantum.local`, par exemple via `/etc/hosts`, vers l'IP exposee par `Traefik`
- acces HTTP a `vm4` pour l'instance GitLab

Pre-requis depot:

- inventaire `ansible/inventories/production/hosts.yml` renseigne
- variables `group_vars/all.yml` renseignees
- variables sensibles `group_vars/vault.yml` disponibles
- placeholders `gitlab_admin_users` remplaces par les vrais logins des intervenants

### Ordre minimal de reproduction

1. Configurer l'inventaire et les variables Ansible.
2. Executer `ansible-playbook playbooks/infrastructure.yml`.
3. Executer `ansible-playbook playbooks/gitlab.yml`.
4. Recuperer le token d'enregistrement GitLab Runner.
5. Executer `ansible-playbook playbooks/runners.yml`.
6. Declarer les variables CI/CD du projet GitLab.
7. Pousser un commit sur la branche attendue pour lancer la chaine CI/CD.

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
- deploie `Loki`, `Grafana` et `Grafana Alloy`
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
- verifier en environnement reel la remontee des logs dans `Loki` et leur consultation dans `Grafana` apres deploiement du role `logging_stack`

## 10. Checklist de demande de validation

Avant chaque demande de validation, verifier au minimum:

- le schema `etape-0bis-schema-infrastructure.md` reflete bien l'etat reel
- les nouvelles VMs, roles, ports, domaines, reseaux et volumes sont documentes
- les nouvelles variables et secrets attendus sont listes
- la procedure de reproduction a ete ajustee si necessaire
- les manifests ou playbooks modifies ont ete validates localement quand c'est possible
- les ecarts restants ou points non verifies sont explicitement notes

## 11. Arborescence utile

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

## 12. Points d'attention

- `GitLab` reste volontairement hors cluster pour respecter les consignes du module.
- Les mots de passe et tokens doivent rester dans `Ansible Vault` ou dans les variables GitLab CI.
- Les manifests `prod-blue-live.yml` et `prod-green-live.yml` sont les seuls a porter les domaines stables `front.quantum.local` et `api.quantum.local`.
- Les services MariaDB Swarm montent le SQL de catalogue au premier demarrage pour disposer de donnees fonctionnelles en preprod et en prod. Ce SQL inclut aussi l'etat attendu de `_prisma_migrations`.
- Le frontend ne doit pas etre rebuild par environnement pour changer l'URL backend: le proxy `/api` evite ce couplage.
- `Grafana Alloy` lit les logs Docker via le socket local de chaque noeud et les enrichit avec les labels Swarm avant envoi vers `Loki`.
- L'acces anonyme a `Grafana` est acceptable pour le POC interne, mais doit etre remplace par une authentification avant une mise en production reelle.
