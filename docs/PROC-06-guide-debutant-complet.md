# Guide debutant complet - Quantum Motors

## 1. A quoi sert ce document

Ce document explique le projet `Quantum Motors` comme si le lecteur partait de zero.

Il sert a repondre a 5 questions simples :

1. Qu'est-ce que ce projet fait ?
2. Comment il est organise ?
3. Qu'est-ce qui a ete verifie et valide ?
4. Comment relancer les verifications sans se perdre ?
5. Que faut-il montrer a un professeur, un tuteur ou un evaluateur ?

Ce guide n'est pas la source de verite technique ultime. La source de verite executable reste :

- `ansible/` pour l'infrastructure
- `deploy/` pour les stacks Docker Swarm
- `.gitlab-ci.yml` pour la CI/CD
- `clo5-backend-master/` pour l'API
- `clo5-front-main/` pour le frontend

## 2. Le projet en une phrase

`Quantum Motors` est une application de configuration de voitures electriques, avec :

- un frontend web
- un backend API
- une base de donnees MariaDB
- une infrastructure Docker Swarm
- une CI/CD GitLab
- une preproduction deployable automatiquement

## 3. Le projet en version tres simple

Imagine un site web qui permet de :

- afficher des modeles de voitures
- choisir une configuration
- calculer un prix

Pour faire cela, le projet est decoupe en plusieurs morceaux :

- le frontend affiche les pages
- le backend repond aux requetes et parle a la base
- la base stocke les modeles, couleurs, batteries, finitions et configurations
- GitLab lance automatiquement les tests et le deploiement
- Docker Swarm distribue les services sur plusieurs machines

## 4. Vocabulaire minimum a connaitre

### Frontend

C'est la partie visible par l'utilisateur dans le navigateur.

Dans ce projet :

- dossier : `clo5-front-main/`
- technologie : Next.js

### Backend

C'est la partie qui recoit les requetes HTTP, lit la base de donnees et renvoie des reponses JSON.

Dans ce projet :

- dossier : `clo5-backend-master/`
- technologie : Node.js + TypeScript + Express + Prisma

### Base de donnees

C'est l'endroit ou les donnees sont stockees.

Dans ce projet :

- technologie : MariaDB / MySQL

### Prisma

C'est l'outil qui permet au backend de parler proprement a la base de donnees.

### Docker

C'est l'outil qui permet d'executer les applications dans des conteneurs.

### Docker Swarm

C'est le mode d'orchestration qui permet de deployer plusieurs services sur plusieurs machines.

### Traefik

C'est le reverse proxy. Il recoit les requetes HTTP et les envoie au bon service.

### Ansible

C'est l'outil d'automatisation utilise pour configurer les serveurs.

### GitLab

C'est la plateforme qui heberge le depot, les runners, les pipelines et le registre d'images Docker.

### Runner GitLab

C'est un agent qui execute les jobs de pipeline.

### Pipeline CI/CD

C'est la suite automatique de jobs :

- test
- lint
- build
- deploy
- smoke test

### Preprod

C'est l'environnement de preproduction. Il sert a verifier qu'une version fonctionne avant une eventuelle production.

## 5. Structure du depot

Voici les dossiers importants :

- `ansible/`
  - inventories, playbooks et roles d'infrastructure
- `clo5-backend-master/`
  - API backend
- `clo5-front-main/`
  - application frontend
- `deploy/`
  - stacks Docker Swarm pour preprod, prod, Traefik et logging
- `docker/`
  - fichiers utilises pour l'environnement local
- `tests/functional/`
  - smoke tests HTTP executes dans la CI
- `docs/`
  - documentation projet

## 6. Architecture simplifiee

Le projet cible 4 machines virtuelles.

### VM1

Role principal :

- manager Docker Swarm
- Traefik
- point d'entree HTTP
- export NFS

### VM2

Role principal :

- worker Swarm
- noeud base de donnees

### VM3

Role principal :

- worker Swarm
- logging
- Grafana / Loki
- SonarQube

### VM4

Role principal :

- GitLab CE
- GitLab Container Registry

## 7. Ce qui a ete corrige

Cette section est importante si quelqu'un demande : "qu'est-ce qui etait casse ?"

### 7.1 Corrections applicatives

Les corrections principales ont ete :

- remise en coherence de la generation Prisma avec `@prisma/client`
- correction de l'environnement local pour que les tests backend passent correctement
- validation du frontend et du backend en local
- verification de la stack Docker locale

### 7.2 Corrections infrastructure / CI/CD

Les corrections principales ont ete :

- correction du role Ansible qui appliquait les labels Docker Swarm
- correction des manifests Docker Swarm
- correction de la stack logging
- correction de la configuration Loki
- validation des playbooks Ansible sur les vraies VMs
- validation des runners GitLab
- validation de la pipeline `develop`
- validation du deploiement preprod

## 8. Ce qui est valide aujourd'hui

Au moment de la redaction de ce document, les points suivants ont ete verifies avec succes.

### Application locale

- installation des dependances backend OK
- tests backend OK
- lint backend OK
- build backend OK
- installation des dependances frontend OK
- lint frontend OK
- build frontend OK
- `docker compose up -d --build` OK
- endpoints locaux critiques OK

### Infrastructure reelle

- playbook `infrastructure.yml` OK sur les vraies VMs
- rerun idempotent valide
- Swarm OK
- labels de noeuds OK
- reseaux overlay OK
- NFS OK
- Traefik OK
- logging OK
- SonarQube OK

### GitLab et CI/CD

- GitLab accessible
- runners GitLab en ligne
- branche `develop` presente dans le GitLab local
- pipeline `develop` validee jusqu'au deploiement preprod
- smoke tests preprod OK

### Services HTTP verifies

- preprod frontend OK
- preprod API OK
- logs / Grafana OK
- GitLab UI OK

## 9. URLs utiles

Ces URLs sont les plus utiles pour une demonstration.

### GitLab

- `http://172.16.248.236`

### Preprod

- frontend : `http://preprod.quantum.local`
- API : `http://api-preprod.quantum.local/health`

### Logs

- `http://logs.quantum.local`

### En local

- frontend : `http://127.0.0.1:4200`
- backend : `http://127.0.0.1:3000`

## 10. Ce qu'il faut montrer pendant une soutenance

Si quelqu'un ne connait pas le projet, voici la sequence la plus simple.

### Etape 1 : expliquer le but

Dire simplement :

"Quantum Motors est une application de configuration automobile avec frontend, backend, base de donnees, infrastructure automatisee et pipeline GitLab."

### Etape 2 : montrer GitLab

Montrer :

- le projet
- les runners en ligne
- une pipeline `develop` verte

### Etape 3 : montrer la preprod

Montrer :

- la page frontend preprod
- l'endpoint API `/health`

### Etape 4 : montrer que le deploiement est automatise

Expliquer :

- un push sur `develop` declenche tests, builds, deploiement preprod et smoke tests

### Etape 5 : montrer que l'infra est industrialisee

Expliquer :

- Ansible deploie l'infrastructure
- Docker Swarm orchestre les services
- Traefik route le trafic
- GitLab CI/CD automatise la livraison

## 11. Comment verifier le projet en local

### 11.1 Se placer a la racine

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
```

### 11.2 Backend

```bash
cd clo5-backend-master
corepack yarn install --immutable
corepack yarn test
corepack yarn lint
corepack yarn build
```

### 11.3 Frontend

```bash
cd ../clo5-front-main
corepack yarn install --frozen-lockfile
corepack yarn lint
corepack yarn build
```

### 11.4 Stack locale complete

```bash
cd ..
docker compose up -d --build
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/models
curl http://127.0.0.1:4200/api/models
curl -X POST http://127.0.0.1:3000/car/configure -H "Content-Type: application/json" -d '{"model":1}'
docker compose down
```

## 12. Comment verifier l'infrastructure reelle

### 12.1 Prerequis

Il faut :

- l'acces SSH aux VMs
- le bon mot de passe Ansible Vault
- les collections Ansible necessaires

### 12.2 Lancer l'infrastructure

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass
```

### 12.3 Verifier les runners

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass
```

### 12.4 Verifier les endpoints de preprod

```bash
curl -I http://172.16.248.64 -H 'Host: preprod.quantum.local'
curl http://172.16.248.64/health -H 'Host: api-preprod.quantum.local'
curl -I http://172.16.248.64 -H 'Host: logs.quantum.local'
```

## 13. Comment verifier la pipeline GitLab

### Ce qu'on doit voir

Sur une pipeline `develop`, l'ordre logique est :

1. `test_backend`
2. `lint_backend`
3. `lint_front`
4. `build_backend`
5. `build_frontend`
6. `deploy_preprod`
7. `test_preprod`

### Ce que cela signifie

- `test_*` : le code fonctionne
- `lint_*` : le code respecte les regles de qualite
- `build_*` : les applications peuvent etre construites
- `deploy_preprod` : la preprod est redeployee
- `test_preprod` : la preprod repond correctement apres deploiement

## 14. Variables CI/CD a connaitre

Les variables importantes documentees dans le projet sont :

- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`
- `REGISTRY_PULL_USER`
- `REGISTRY_PULL_PASSWORD`
- `PREPROD_DB_ROOT_PASSWORD`
- `PREPROD_DB_PASSWORD`
- `PROD_DB_ROOT_PASSWORD`
- `PROD_DB_PASSWORD`
- `BACKEND_ADMIN_PASSWORD`

Voir :

- [`PROC-03-gitlab-ci-variables.md`](./PROC-03-gitlab-ci-variables.md)

## 15. Ce qu'il ne faut pas faire

Cette section evite les erreurs classiques.

### Ne pas modifier le mauvais fichier Prisma

Il ne faut pas modifier :

- `clo5-backend-master/prisma/generated/prisma-client-js/schema.prisma`

La source de verite est :

- `clo5-backend-master/prisma/schema.prisma`

### Ne pas committer les secrets

Ne pas committer :

- `ansible/inventories/production/group_vars/vault.yml`
- mots de passe
- tokens GitLab
- variables sensibles

### Ne pas committer les fichiers temporaires

Par exemple :

- caches Yarn
- fichiers systeme locaux
- fichiers non suivis bizarres

### Ne pas supposer que Windows et WSL se comportent pareil

Le projet a ete principalement valide dans le contexte prevu par les commandes du projet, souvent via WSL pour les commandes Linux.

## 16. A propos du warning Web IDE

Un warning GitLab peut apparaitre a propos du Web IDE.

Ce warning n'est pas bloquant pour :

- les tests
- les builds
- le deploiement
- la preprod

Il signifie surtout que l'instance GitLab peut etre amelioree cote administration.

Concretement :

- ce n'est pas un bug du projet applicatif
- ce n'est pas un blocage CI/CD
- c'est une amelioration d'administration GitLab

## 17. A propos des comptes et de l'authentification

Le projet utilise plusieurs couches d'acces :

- acces Git au depot
- acces GitLab UI
- acces SSH aux VMs
- acces Ansible Vault
- acces Docker Registry GitLab

Si une commande echoue, il faut toujours se demander quelle couche d'acces manque.

Exemples :

- `git clone` qui echoue : probleme d'identifiants GitLab ou de token
- `ansible-playbook` qui echoue sur Vault : mauvais mot de passe Vault
- `git push` qui echoue en PowerShell : cle SSH non disponible dans ce shell

## 18. Comment savoir si tout est propre

Le critere le plus simple est :

```bash
git status
```

Le resultat attendu est :

```text
nothing to commit, working tree clean
```

## 19. Checklist finale ultra simple

Si quelqu'un ne devait retenir qu'une seule liste, c'est celle-ci.

### Le code

- backend OK
- frontend OK
- Docker local OK

### L'infrastructure

- Ansible OK
- Swarm OK
- Traefik OK
- logging OK
- SonarQube OK

### GitLab

- GitLab accessible
- runners online
- pipeline `develop` verte

### La preprod

- frontend OK
- API OK
- smoke tests OK

### Le depot

- push effectue
- `git status` propre

## 20. Reponse courte prete a dire a l'oral

Si quelqu'un te demande un resume en 20 secondes, tu peux dire :

"Le projet Quantum Motors est maintenant valide de bout en bout. Le backend, le frontend et Docker local fonctionnent. L'infrastructure Ansible sur les vraies VMs est validee, les runners GitLab sont operationnels, la pipeline `develop` passe jusqu'au deploiement preprod, les smoke tests reussissent, et le depot final est propre."

## 21. Documents a lire ensuite

Pour aller plus loin :

- [`PROCEDURES.md`](./PROCEDURES.md)
- [`PROC-03-gitlab-ci-variables.md`](./PROC-03-gitlab-ci-variables.md)
- [`PROC-04-hosts-setup.md`](./PROC-04-hosts-setup.md)
- [`PROC-05-cicd-validation.md`](./PROC-05-cicd-validation.md)
- [`etape-0bis-documentation-technique.md`](./etape-0bis-documentation-technique.md)
- [`etape-0bis-schema-infrastructure.md`](./etape-0bis-schema-infrastructure.md)
