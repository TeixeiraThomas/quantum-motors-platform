# Etape 0-bis - Documentation technique vivante

Document datée le `2026-04-09`, mise à jour le `2026-04-13`.

## 0. Synthèse executive

Cette étape documente les réalisations de l'infrastructure et les choix techniques pour le projet Quantum Motors. 

### Ce qui a été réalisé (Étape 2)

L'infrastructure CI/CD et de déploiement a été mise en place avec:

- **Automatisation complète par Ansible**: provisioning de Docker, initialisation Swarm, configuration Traefik, installation GitLab, enregistrement runners
- **Chaîne CI/CD fonctionnelle**: tests, build, déploiement en préproduction, smoke tests, déploiement blue/green en production
- **Observabilité**: collecte de logs centralisée via Loki et Grafana Alloy sur tous les nœuds
- **Stockage persistant**: MariaDB sur volumes NFS, séparation préproduction/production
- **Sécurité des secrets**: utilisation Ansible Vault pour les credentials

### Etat actuel de l'infrastructure

L'infrastructure live comprend:

- **3 VMs cluster Swarm** (vm1, vm2, vm3) avec 2 vCPU / 4 Go RAM
- **1 VM GitLab** (vm4) hebergee hors cluster
- **Réseaux overlay découpés**: `public` (exposition), `preprod_net`, `prod_net`, `logs_net`
- **Services opérationnels**: Traefik (reverse proxy), MariaDB (préproduction/production), SonarQube, Loki+Grafana (logs), runners GitLab
- **Validation**: tous les playbooks Ansible rejouables avec succès, tests unitaires backend OK (41/41), linting frontend OK

Point restant à valider: exécution d'une vraie pipeline GitLab avec déploiement applicatif complet et remontée des logs en production.

### Choix techniques justifiés

Les principaux choix répondent à des contraintes du module ou à des nécessités d'opérations:

1. **Docker Swarm** plutôt que Kubernetes: simplicité opérationnelle sur 3 VMs sans cluster externe
2. **Traefik** pour reverse proxy/load-balancing: routage par labels Docker, facilité du blue/green
3. **Loki + Alloy** pour logs: collecte légère sans modifier les applications, consommation réseau optimisée
4. **NFS pour MariaDB**: séparation volume préproduction/production, facilité du backup
5. **GitLab hors cluster**: respect des consignes du module
6. **Ansible pour automatisation**: idempotence garantie, roles rejouables sans divergence

Voir section 3 pour le detail de chaque choix.

## 1. Périmètre et maintenance

Cette documentation accompagne les étapes d'infrastructure et de CI/CD. Elle décrit l'état réel du dépôt et de l'infrastructure au moment de la mise à jour, afin qu'un tiers puisse comprendre l'architecture et la reproduire.

### Objectif de cette documentation

- fournir un état de référence à jour pour la soutenance et pour un tiers qui reprendrait le projet
- centraliser les choix techniques, la topologie, les procédures et les dépendances
- éviter l'écart entre ce qui est documenté et ce qui est effectivement déployé

### Règles de maintenance

La documentation doit être mise à jour à chaque évolution significative:

- ajout, suppression ou déplacement d'un service
- changement de rôle d'une VM
- changement de reseau, volume, domaine, registry ou reverse proxy
- changement du pipeline CI/CD ou des procedures Ansible
- changement des variables requises pour reproduire le projet

### Sources de verite

Les artefacts suivants sont consideres comme les sources de verite du projet:

| Element | Source |
| --- | --- |
| Infrastructure Ansible | `ansible/playbooks/` et `ansible/roles/` |
| Inventaire et parametrage | `ansible/inventories/production/` |
| Deploiement Swarm applicatif | `deploy/` |
| Pipeline CI/CD | `/.gitlab-ci.yml` |
| Tests fonctionnels | `tests/functional/` |
| Documentation courante | `docs/etape-0bis-*.md` |

## 2. Historique des évolutions

| Étape | Évolution | Impact |
| --- | --- | --- |
| `Étape 0` | Schéma initial du projet | Base de l'architecture cible |
| `Étape 1` | Swarm, SonarQube, GitLab bare metal | Infrastructure de base automatisée par Ansible |
| `Étape 2` | Traefik, runners GitLab, pipeline CI/CD, blue/green, NFS, Loki, Grafana, Alloy | Chaîne de build, de déploiement et d'observabilité continue |

## 3. Choix techniques

### Orchestrateur

- `Docker Swarm` a été retenu pour rester simple à déployer et à opérer sur `3` VMs tout en supportant overlay networks, services replicas et blue/green.

### Automatisation

- `Ansible` pilote la création du cluster, la configuration des hôtes, l'installation de GitLab, le déploiement de Traefik et l'enregistrement des runners.
- Le rôle `docker_swarm` reste générique: réseaux et labels de nœuds proviennent uniquement de variables d'inventaire, sans logique métier hardcodée dans le rôle.

### Entr\u00e9e HTTP

- `Traefik` est utilisé comme reverse proxy et load balancer.
- Le choix permet un routage par labels Docker et facilite le passage `blue -> green` sans reconfigurer la machine hôte.

### Collecte de logs

- `Loki` centralise les logs d'execution des conteneurs du cluster.
- `Grafana Alloy` tourne en mode `global` sur tous les noeuds Swarm et collecte les logs via l'API Docker locale.
- `Grafana` expose une interface de consultation sur `logs.quantum.local`.
- `Alloy` a été retenu à la place de `Promtail` car `Promtail` est désormais en fin de vie.
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
- Le rôle `SonarQube` applique les prerequis kernel (`vm.max_map_count`, `fs.file-max`) sur le noeud cible avant de creer le service Swarm.

## 4. Architecture actuelle

Le schema mis a jour est disponible dans [`etape-0bis-schema-infrastructure.md`](./etape-0bis-schema-infrastructure.md).

### Repartition des roles

| Hôte | Adresse | Rôle |
| --- | --- | --- |
| `vm1` | `172.16.248.64` | manager Swarm, Traefik, export NFS, runner |
| `vm2` | `172.16.248.92` | worker Swarm, MariaDB, runner |
| `vm3` | `172.16.248.97` | worker Swarm, SonarQube, Loki, Grafana, runner |
| `vm4` | `172.16.248.236` | GitLab CE, registry GitLab |

### Réseaux

Les réseaux overlay définis dans [`ansible/inventories/production/group_vars/all.yml`](../ansible/inventories/production/group_vars/all.yml) sont:

- `public`
- `preprod_net`
- `prod_net`
- `logs_net`

Usage:

- `public`: exposition via Traefik
- `preprod_net`: services applicatifs de préproduction + MariaDB preprod
- `prod_net`: services applicatifs blue/green + MariaDB prod
- `logs_net`: trafic entre `Alloy`, `Loki` et `Grafana`

Les services exposés via Traefik définissent explicitement `traefik.docker.network=public` pour éviter que Traefik sélectionne un réseau applicatif privé sur les conteneurs multi-réseaux.

### Stockage

- export NFS racine: `/srv/nfs/quantum-motors`
- export preprod: `/srv/nfs/quantum-motors/preprod/mariadb`
- export prod: `/srv/nfs/quantum-motors/prod/mariadb`
- stockage Loki: `/srv/loki`
- état Alloy par nœud: `/srv/alloy`
- stockage Grafana logs: `/srv/grafana`

Les manifests concernés sont:

- [`deploy/preprod.yml`](../deploy/preprod.yml)
- [`deploy/prod-db.yml`](../deploy/prod-db.yml)
- [`deploy/logging.yml`](../deploy/logging.yml)

### Matrice des services

| Service | Emplacement | Exposition | Source de déploiement |
| --- | --- | --- | --- |
| `Docker Swarm manager` | `vm1` | interne cluster | `ansible/playbooks/infrastructure.yml` |
| `Traefik` | `vm1` | HTTP `*:80` | `deploy/traefik.yml` |
| `MariaDB preprod/prod` | `vm2` | réseaux privés Swarm | `deploy/preprod.yml`, `deploy/prod-db.yml` |
| `SonarQube` | `vm3` | port `9000` inter-nœuds | rôle `SonarQube` |
| `Loki` | `vm3` | port `3100` interne/ops | `deploy/logging.yml` |
| `Grafana logs` | `vm3` | `logs.quantum.local` | `deploy/logging.yml` |
| `GitLab CE` | `vm4` | `http://172.16.248.236` | `ansible/playbooks/gitlab.yml` |
| `GitLab Registry` | `vm4` | `http://172.16.248.236:5050` | `install_gitlab` |
| `GitLab Runner` | `vm1`, `vm2`, `vm3` | exécution CI interne | `ansible/playbooks/runners.yml` |

## 5. Applications et dépendances

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
2. Traefik route la requête vers le service frontend sur `public`.
3. Le frontend appelle `/api/...`.
4. Le proxy Next.js route vers `API_URL_INTERNAL`.
5. Le backend accède à MariaDB via `preprod_net` ou `prod_net`.
6. Les logs des conteneurs sont lus localement par `Alloy`, poussés vers `Loki` via `logs_net`, puis consultables dans `Grafana`.

## 6. GitLab, registry et runners

### GitLab

- playbook: [`ansible/playbooks/gitlab.yml`](../ansible/playbooks/gitlab.yml)
- role principal: `install_gitlab`
- URL applicative: `http://172.16.248.236`
- registry: `http://172.16.248.236:5050`
- les nœuds Swarm déclarent cette registry comme `insecure registry` dans la configuration Docker

### Secrets Ansible

Les secrets ne sont pas stockés en clair dans les rôles.

Variables sensibles attendues:

- `vault_gitlab_root_password`
- `vault_gitlab_prof_password`
- `vault_gitlab_runner_registration_token`

Variables d'infrastructure importantes:

- `swarm_node_labels`
- `overlay_networks`
- `sonarqube_resources`
- `gitlab_admin_users` doit être renseigné avec les vrais logins des intervenants avant l'exécution de `gitlab.yml`

### Runners

- playbook: [`ansible/playbooks/runners.yml`](../ansible/playbooks/runners.yml)
- role: [`ansible/roles/gitlab_runner`](../ansible/roles/gitlab_runner)
- image runner: `gitlab/gitlab-runner:alpine`
- image docker par défaut: `docker:24.0.7`

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
3. déploiement de `preprod` avec remise à zéro du stockage MariaDB puis initialisation par le SQL de catalogue
4. smoke tests HTTP sur `preprod.quantum.local` et `api-preprod.quantum.local`
5. déploiement de la base `prod-db`, puis de `prod-green`
6. smoke tests HTTP sur `front-green.quantum.local` et `api-green.quantum.local`
7. bascule des domaines stables vers `prod-green` via `prod-green-live.yml`, puis suppression de la stack `prodgreen`

### Manifests de déploiement

- Traefik: [`deploy/traefik.yml`](../deploy/traefik.yml)
- Logging: [`deploy/logging.yml`](../deploy/logging.yml)
- Preprod: [`deploy/preprod.yml`](../deploy/preprod.yml)
- Base prod: [`deploy/prod-db.yml`](../deploy/prod-db.yml)
- Prod blue: [`deploy/prod-blue.yml`](../deploy/prod-blue.yml)
- Prod green: [`deploy/prod-green.yml`](../deploy/prod-green.yml)
- Prod live blue: [`deploy/prod-blue-live.yml`](../deploy/prod-blue-live.yml)
- Prod live green: [`deploy/prod-green-live.yml`](../deploy/prod-green-live.yml)

### Variables CI attendues

Variables GitLab CI à définir dans le projet:

- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`
- `REGISTRY_PULL_USER`
- `REGISTRY_PULL_PASSWORD`
- `PREPROD_DB_ROOT_PASSWORD`
- `PREPROD_DB_PASSWORD`
- `PROD_DB_ROOT_PASSWORD`
- `PROD_DB_PASSWORD`
- `BACKEND_ADMIN_PASSWORD`

Les jobs de build peuvent utiliser les credentials CI GitLab natifs. Les jobs de déploiement Swarm utilisent un credential registry durable afin que les nœuds puissent re-pull les images après la fin du job CI.

## 8. Procédures de déploiement

### Pré-requis de reproduction

Machine d'administration:

- `Ansible` installé localement
<<<<<<< HEAD
=======
- collections Ansible installees via `ansible/requirements.yml`
>>>>>>> develop
- accès SSH aux `4` VMs
- accès au fichier Vault ou aux secrets équivalentes
- client Docker disponible si vous souhaitez valider localement les manifests avec `docker compose config`

<<<<<<< HEAD
=======
Mode WSL recommande:

- procedure dediee: [`PROC-07-wsl-workflow.md`](./PROC-07-wsl-workflow.md)
- wrapper principal: `ansible/scripts/wsl-ansible.sh`
- lecteur Vault: `ansible/scripts/wsl-vault-pass.sh`
- ordre de controle: `requirements`, `vault-check`, `syntax-check`, `ping`
- note transparence IA: la procedure WSL a ete structuree avec l'aide d'un assistant IA et doit rester relue/validee par l'equipe avant soutenance.

>>>>>>> develop
Pré-requis réseau:

- résolution locale des domaines `*.quantum.local`, par exemple via `/etc/hosts`, vers l'IP exposée par `Traefik`
- accès HTTP à `vm4` pour l'instance GitLab

Pré-requis dépôt:

- inventaire `ansible/inventories/production/hosts.yml` renseigné
- variables `group_vars/all.yml` renseignées
- variables sensibles `group_vars/vault.yml` disponibles
- placeholders `gitlab_admin_users` remplacés par les vrais logins des intervenants

### Ordre minimal de reproduction

1. Configurer l'inventaire et les variables Ansible.
<<<<<<< HEAD
2. Exécuter `ansible-playbook playbooks/infrastructure.yml`.
3. Exécuter `ansible-playbook playbooks/gitlab.yml`.
4. Récupérer le token d'enregistrement GitLab Runner.
5. Exécuter `ansible-playbook playbooks/runners.yml`.
6. Déclarer les variables CI/CD du projet GitLab.
7. Pousser un commit sur la branche attendue pour lancer la chaîne CI/CD.
=======
2. Installer les collections avec `ansible-galaxy collection install -r ansible/requirements.yml` ou `bash ansible/scripts/wsl-ansible.sh requirements` depuis WSL.
3. Exécuter `ansible-playbook playbooks/infrastructure.yml`.
4. Exécuter `ansible-playbook playbooks/gitlab.yml`.
5. Récupérer le token d'enregistrement GitLab Runner.
6. Exécuter `ansible-playbook playbooks/runners.yml`.
7. Déclarer les variables CI/CD du projet GitLab.
8. Pousser un commit sur la branche attendue pour lancer la chaîne CI/CD.
>>>>>>> develop

### Provisionner le cluster

Depuis `ansible/`:

```bash
ansible-playbook playbooks/infrastructure.yml
```

Ce playbook:

- installe Docker sur `vm1`, `vm2`, `vm3`
- initialise Swarm
- crée les réseaux overlay
- prépare NFS
- déploie Traefik
- déploie `Loki`, `Grafana` et `Grafana Alloy`
- déploie SonarQube

### Installer GitLab sur VM4

```bash
ansible-playbook playbooks/gitlab.yml
```

### Déployer les runners GitLab

```bash
ansible-playbook playbooks/runners.yml
```

Pre-requis:

- `vault_gitlab_runner_registration_token` doit être défini

### Lancer la stack locale

Depuis la racine du dépôt:

```bash
docker compose up --build -d
```

La stack locale sert au développement et à la validation rapide de l'application, indépendamment du cluster.

## 9. Tests et validation

### Validation dépôt

Validation réalisée le `2026-04-04`:

- build frontend: OK
- lint frontend: OK
- build backend: OK
- lint backend: OK
- tests backend: `41/41` OK
- `ansible-playbook --syntax-check`: OK
- `ansible-lint`: OK
- `docker compose config` sur les manifests de deploiement: OK

Validation complémentaire réalisée le `2026-04-21`:

- build frontend: OK
- lint frontend: OK
- build backend: OK
- lint backend: OK
- `docker compose config` sur tous les manifests `deploy/*.yml`: OK
- `docker stack config` sur tous les manifests `deploy/*.yml`: OK
- liens Markdown `README.md` et `docs/*.md`: OK

### Validation live

Validation live réalisée le `2026-04-04`:

- `infrastructure.yml` rejogué avec succès sur `vm1`, `vm2`, `vm3`
- `runners.yml` rejoué avec succès sur `vm1`, `vm2`, `vm3`
- runners GitLab actifs:
  - `vm1-runner`
  - `vm2-runner`
  - `vm3-runner`

<<<<<<< HEAD
Point encore à faire pour la validation finale étape 2:

- exécuter un vrai pipeline GitLab sur un commit poussé
- vérifier les déploiements applicatifs live en préprod et en production green
- vérifier en environnement réel la remontée des logs dans `Loki` et leur consultation dans `Grafana` après déploiement du rôle `logging_stack`
=======
Validation HTTP live réalisée le `2026-04-21`:

- GitLab VM4 accessible sur `http://172.16.248.236/users/sign_in`
- registry GitLab accessible sur `http://172.16.248.236:5050/v2/` avec réponse `401 Unauthorized` attendue sans credentials
- SonarQube accessible sur `http://172.16.248.97:9000`
- Grafana logs accessible via Traefik avec `Host: logs.quantum.local`
- smoke test préproduction OK sur `preprod.quantum.local` et `api-preprod.quantum.local`
- smoke test production live OK sur `front.quantum.local` et `api.quantum.local`

Point encore à faire pour la validation finale étape 2:

- exécuter un vrai pipeline GitLab sur un commit poussé
- vérifier le statut des runners dans l'interface GitLab
- vérifier en environnement réel le contenu des logs dans `Loki` et leur consultation dans `Grafana` après exécution d'une pipeline applicative
>>>>>>> develop

## 10. Validation et points de controle

### Avant chaque demande de validation

Les points de contrôle à vérifier sont:

- le schéma `etape-0bis-schema-infrastructure.md` reflète bien l'état réel
- les nouvelles VMs, rôles, ports, domaines, réseaux et volumes sont documentés
- les nouvelles variables et secrets attendus sont listés
- la procédure de reproduction a été ajustée si nécessaire
- les manifests ou playbooks modifiés ont été validés localement quand c'est possible
- les écarts restants ou points non vérifiés sont explicitement notés

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
- Les manifests `prod-blue-live.yml` et `prod-green-live.yml` sont les seuls à porter les domaines stables `front.quantum.local` et `api.quantum.local`.
- Les services MariaDB Swarm montent le SQL de catalogue au premier démarrage pour disposer de données fonctionnelles en préprod et en prod. Ce SQL inclut aussi l'état attendu de `_prisma_migrations`.
- Le frontend ne doit pas être rebuild par environnement pour changer l'URL backend: le proxy `/api` évite ce couplage.
- `Grafana Alloy` lit les logs Docker via le socket local de chaque nœud et les enrichit avec les labels Swarm avant envoi vers `Loki`.
- L'accès anonyme à `Grafana` est acceptable pour le POC interne, mais doit être remplacé par une authentification avant une mise en production réelle.

## 13. Procédures de reproduction

Les fichiers `docs/PROC-*.md` contiennent les procédures **pas-à-pas** pour reproduire l'infrastructure complète.

### Index des procédures

| # | Fichier | Titre | Durée | Prérequis | Objectif |
|---|---------|-------|-------|-----------|----------|
<<<<<<< HEAD
| 0 | [PROC-00-check-prerequisites.md](../PROC-00-check-prerequisites.md) | Vérifier les prérequis système | 15 min | Poste local | Valider VMs, réseau, Ansible |
| 1 | [PROC-01-vault-setup.md](../PROC-01-vault-setup.md) | Initialisation Ansible Vault | 10 min | Ansible installé | Configurer les secrets |
| 2 | [PROC-02-gitlab-runner-token.md](../PROC-02-gitlab-runner-token.md) | Obtenir token GitLab Runner | 15 min | VM4 GitLab active | Enregistrer runners Swarm |
| 3 | [PROC-03-gitlab-ci-variables.md](../PROC-03-gitlab-ci-variables.md) | Variables CI/CD GitLab | 20 min | Dépôt GitLab créé | Configurer la pipeline |
| 4 | [PROC-04-hosts-setup.md](../PROC-04-hosts-setup.md) | DNS local /etc/hosts | 10 min | Accès réseau | Résoudre domaines *.quantum.local |
| 5 | [PROC-05-cicd-validation.md](../PROC-05-cicd-validation.md) | Validation CI/CD live | 30 min | Tous playbooks OK | Tester build & deploy |
=======
| 0 | [PROC-00-check-prerequisites.md](./PROC-00-check-prerequisites.md) | Vérifier les prérequis système | 15 min | Poste local | Valider VMs, réseau, Ansible |
| 1 | [PROC-01-vault-setup.md](./PROC-01-vault-setup.md) | Initialisation Ansible Vault | 10 min | Ansible installé | Configurer les secrets |
| 2 | [PROC-02-gitlab-runner-token.md](./PROC-02-gitlab-runner-token.md) | Obtenir token GitLab Runner | 15 min | VM4 GitLab active | Enregistrer runners Swarm |
| 3 | [PROC-03-gitlab-ci-variables.md](./PROC-03-gitlab-ci-variables.md) | Variables CI/CD GitLab | 20 min | Dépôt GitLab créé | Configurer la pipeline |
| 4 | [PROC-04-hosts-setup.md](./PROC-04-hosts-setup.md) | DNS local /etc/hosts | 10 min | Accès réseau | Résoudre domaines *.quantum.local |
| 5 | [PROC-05-cicd-validation.md](./PROC-05-cicd-validation.md) | Validation CI/CD live | 30 min | Tous playbooks OK | Tester build & deploy |
>>>>>>> develop

**Flux recommandé :**

1. Proc 0 : Vérifier prérequis
2. Proc 1 : Configurer Vault
3. Playbook `infrastructure.yml` (Ansible)
4. Playbook `gitlab.yml` (Ansible)
5. Proc 2 : Obtenir token runner
6. Playbook `runners.yml` (Ansible)
7. Proc 3 : Configurer CI/CD variables
8. Proc 4 : Configurer /etc/hosts
9. Proc 5 : Valider pipeline live

**Temps total :** ~1 heure pour reproduction complète

## 14. Modifications récentes (2026-04-13)

### Corrections apportées au dépôt

#### 1. Labels Swarm (docker_swarm/tasks/labels.yml)

**Problème :** Utilisation de `ansible_hostname` qui pouvait ne pas matcher les hostnames réels

**Correction :**
- Utilisation de `hostvars[item.key].ansible_hostname | default(item.key)` pour robustesse
- Ajout d'une validation post-application des labels
- La tâche décrit maintenant aussi l'erreur espérée si le matching échoue

#### 2. Placement MariaDB (deploy/prod-db.yml)

**Problème :** Hostname en dur (`TIC-CLO5-VM2`) - cassait le placement si hostname différent

**Correction :**
- Passage à `node.labels.db-node == true`
- Ajout du label `db-node: "true"` pour vm2 dans all.yml

#### 3. Placement MariaDB preprod (deploy/preprod.yml)

**Problème :** Hostname en dur pour placement

**Correction :** Idem prod-db.yml - utilisation label `db-node`

#### 4. Validation admin users (install_gitlab/tasks/configure.yml)

**Problème :** Placeholders `intervenant_1`, `intervenant_2` acceptés sans vérification

**Correction :**
- Assert en début de `configure.yml`
- Valide que les placeholders ont été remplacés par vrais usernames/emails
- Rejette le playbook si placeholders détectés

#### 5. Token runner (vault.yml)

**Problème :** Variable `vault_gitlab_runner_registration_token` manquait

**Correction :** Ajout de la variable au vault.yml (chiffrée)

### Fichiers crees (procedures)

- docs/PROC-00-check-prerequisites.md
- docs/PROC-01-vault-setup.md
- docs/PROC-02-gitlab-runner-token.md
- docs/PROC-03-gitlab-ci-variables.md
- docs/PROC-04-hosts-setup.md
- docs/PROC-05-cicd-validation.md
- docs/PROCEDURES.md (index master)
