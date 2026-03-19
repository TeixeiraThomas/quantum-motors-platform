# SPE-CLO5 / Quantum Motors  
## Étape 0 — Schéma d’infrastructure

---

## 1. Contexte

Dans le cadre du projet **Quantum Motors**, nous devons reprendre une application web existante dans une logique **DevOps** afin de moderniser une infrastructure vieillissante et préparer son industrialisation.

L’objectif est de concevoir une architecture capable de :

- déployer les services **frontend** et **API**
- fonctionner sur un **cluster**
- séparer les environnements **preprod** et **prod**
- intégrer **GitLab** et **GitLab CI/CD**
- automatiser les déploiements
- centraliser les **logs**
- intégrer des **tests** et une **analyse qualité**
- garantir la **persistance des données**

Cette étape 0 consiste à proposer un **schéma d’infrastructure cohérent** répondant aux contraintes du sujet.

---

## 2. Objectif de l’étape

Cette étape a pour but de :

- analyser les besoins techniques du sujet
- identifier les composants nécessaires
- proposer une architecture réaliste et exploitable
- préparer les futures étapes de déploiement et d’automatisation

Le livrable principal attendu est un **schéma d’infrastructure**, accompagné d’une explication des choix retenus.

---

## 3. Technologies retenues

Pour répondre aux besoins du projet, nous avons retenu les technologies suivantes :

- **Docker** pour la conteneurisation
- **Docker Swarm** pour l’orchestration du cluster
- **Traefik** comme reverse proxy / ingress
- **GitLab CE** pour l’hébergement du code et la gestion CI/CD
- **GitLab Runner(s) Docker** pour l’exécution des pipelines
- **SonarQube** pour l’analyse qualité
- **Node.js / Express** pour l’API
- **Next.js** pour le frontend
- **MariaDB** pour la base de données
- **NFS** pour la persistance des volumes
- **Loki / Promtail / Grafana** pour la collecte et la consultation des logs
- **Ansible** pour l’automatisation de l’infrastructure dans la suite du projet

---

## 4. Choix d’architecture

Nous avons choisi **Docker Swarm** comme orchestrateur.

Ce choix se justifie par :

- une mise en place plus simple qu’un cluster Kubernetes dans le cadre d’un POC
- une bonne intégration avec Docker
- une architecture lisible et adaptée au sujet
- une mise en œuvre compatible avec l’automatisation future via Ansible

L’architecture repose sur :

- un **cluster Docker Swarm**
- un point d’entrée **Traefik**
- deux environnements : **Preprod** et **Prod**
- une instance **GitLab CE privée**
- des **GitLab Runner(s) Docker** déployés dans le cluster
- **SonarQube** déployé dans le cluster
- une solution de **stockage persistant NFS**
- une solution de **centralisation des logs**

---

## 5. Répartition des rôles

### VM1
- **Docker Swarm Manager**
- participation au cluster
- rôle de gestion du cluster

### VM2
- **Docker Swarm Worker**
- participation au cluster
- exécution de services orchestrés

### VM3
- **Docker Swarm Worker**
- participation au cluster
- exécution de services orchestrés

### VM4
- **GitLab CE privé**
- **NFS Server / Stockage persistant**

Cette organisation permet de séparer :
- les nœuds du cluster
- les outils DevOps externes au cluster
- le stockage persistant utilisé par les bases de données

---

## 6. Organisation du cluster

Le **cluster Docker Swarm** contient :

### Composants transverses
- **Traefik**
- **GitLab Runner(s) Docker**
- **SonarQube**
- **Collecte des logs**

### Environnement Preprod
- **Frontend Preprod**
- **API Preprod**
- **MariaDB Preprod**

### Environnement Prod
- **Frontend Prod**
- **API Prod**
- **MariaDB Prod**

Les environnements **Preprod** et **Prod** sont représentés comme des **stacks du cluster**.  
Ils ne sont pas affectés à un worker précis : l’objectif est de **mutualiser les ressources** et de laisser l’orchestrateur répartir les services selon la disponibilité et la charge.

---

## 7. Reverse proxy

Le reverse proxy imposé dans le cadre du projet est **Traefik**.

Traefik est déployé dans le cluster et assure le routage des requêtes vers les environnements applicatifs :

- `preprod.quantum-motors.local`
- `prod.quantum-motors.local`

Il joue donc le rôle de point d’entrée principal de l’application.

---

## 8. CI/CD

L’architecture prévoit une chaîne CI/CD basée sur **GitLab CE** et **GitLab Runner(s) Docker**.

### Fonctionnement prévu

#### Branche `develop`
Un commit sur la branche `develop` déclenche :

- le pipeline CI/CD
- le build
- le déploiement en **Preprod**

#### Branche `main`
Un commit sur la branche `main` déclenche :

- le pipeline CI/CD
- le build
- le déploiement en **Prod**

### Rôle des composants
- **GitLab CE privé** héberge le code source et pilote les pipelines
- **GitLab Runner(s) Docker)** exécutent les jobs CI/CD dans le cluster
- **SonarQube** permet d’intégrer l’analyse qualité dans la chaîne de livraison

---

## 9. Analyse qualité

Le schéma intègre **SonarQube** dans le cluster.

Son rôle est de permettre :
- l’analyse de la qualité du code
- la détection de problèmes techniques
- l’intégration d’un contrôle qualité dans le pipeline CI/CD

SonarQube est bien représenté comme un **service déployé dans le cluster**, conformément aux attentes du sujet.

---

## 10. Persistance des données

Afin de garantir la persistance des bases de données en cas de redémarrage ou de crash, nous avons retenu une solution de **stockage persistant NFS**.

### Technologie retenue
- **NFS Server / Stockage persistant** hébergé sur **VM4**

### Utilisation
Les bases :
- **MariaDB Preprod**
- **MariaDB Prod**

utilisent des volumes persistants s’appuyant sur ce stockage NFS.

Ce choix permet de répondre explicitement à la problématique de persistance soulevée dans le retour de correction.

---

## 11. Logs et supervision

Le sujet demande la redirection des logs vers un serveur de traitement.

Nous avons donc prévu une chaîne de collecte centralisée composée de :

- **Promtail**
- **Loki**
- **Grafana**

### Objectifs
- centraliser les logs des services
- faciliter le diagnostic
- améliorer la lisibilité du fonctionnement applicatif
- préparer la supervision de la plateforme

La collecte des logs est représentée comme un composant transverse relié aux environnements **Preprod** et **Prod**.

---

## 12. Flux principaux

Le schéma met en évidence les flux suivants :

### Accès utilisateur
- Utilisateurs
- domaines `preprod.quantum-motors.local` et `prod.quantum-motors.local`
- passage par **Traefik**
- routage vers les services de l’environnement cible

### Flux CI/CD
- **GitLab CE privé** vers les **GitLab Runner(s) Docker**
- exécution des pipelines
- analyse qualité via **SonarQube**
- déploiement vers **Preprod** ou **Prod**

### Flux applicatifs
Pour chaque environnement :
- **Frontend** → **API** → **MariaDB**

### Flux de persistance
- **MariaDB Preprod** → **NFS**
- **MariaDB Prod** → **NFS**

### Flux de logs
- services applicatifs → **Collecte des logs**
- collecte → **Loki / Promtail / Grafana**

---

## 13. Justification des corrections apportées

Suite au retour de correction, plusieurs ajustements ont été intégrés au schéma :

- ajout explicite de **Traefik**
- ajout de **SonarQube** dans le cluster
- positionnement des **GitLab Runner(s) Docker** dans le cluster
- retrait de l’affectation d’un worker à un environnement spécifique
- ajout d’une solution de **persistance NFS**
- clarification de la logique de mutualisation du cluster

Ces corrections permettent d’aligner l’architecture proposée avec les attentes exprimées dans le sujet et dans le retour de validation.

---

## 14. Livrables

Pour cette étape 0, nous rendons :

- le schéma d’infrastructure au format image
- le fichier source modifiable du schéma
- ce README explicatif

### Arborescence
```text
README.md
docs/
├── etape-0-schema-infrastructure-quantum-motors.png
└── etape-0-schema-infrastructure-quantum-motors.drawio