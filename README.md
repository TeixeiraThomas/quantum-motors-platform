# SPE-CLO5 / Quantum Motors  
## Étape 1 — Infrastructure

## 1. Objectif

L’objectif de cette étape est de mettre en place une infrastructure de base pour le projet **Quantum Motors** dans une logique DevOps.

Nous devions :

- créer les 4 VMs fournies par ETNACloud
- mettre en place un cluster d’orchestration
- automatiser l’infrastructure avec **Ansible**
- déployer **SonarQube** sur le cluster
- installer **GitLab CE** sur la **VM4 en bare-metal**

---

## 2. Choix techniques

Pour cette étape, nous avons retenu les technologies suivantes :

- **Debian 12**
- **Docker**
- **Docker Swarm**
- **Ansible**
- **SonarQube**
- **GitLab CE**

Nous avons choisi **Docker Swarm** car il est plus simple à mettre en place qu’un cluster Kubernetes dans le cadre de ce POC, tout en restant cohérent avec les besoins du projet et les ressources limitées des machines.

---

## 3. Architecture mise en place

La répartition retenue est la suivante :

### VM1
- **Docker Swarm Manager**

### VM2
- **Docker Swarm Worker**

### VM3
- **Docker Swarm Worker**
- hébergement du service **SonarQube**

### VM4
- **GitLab CE**
- installation en **bare-metal**, conformément aux consignes du sujet

---

## 4. Cluster Docker Swarm

Le cluster Swarm a été déployé sur **VM1, VM2 et VM3** via **Ansible**.

### Organisation
- **VM1** : manager
- **VM2** : worker
- **VM3** : worker

### Réseaux overlay créés
- `preprod_net`
- `prod_net`

Ces réseaux serviront dans les prochaines étapes au déploiement des environnements de **préproduction** et de **production**.

---

## 5. Déploiement de SonarQube

Nous avons créé un rôle Ansible dédié afin de déployer **SonarQube** sur le cluster Swarm.

Le service a été :

- déployé comme **service Swarm**
- limité à **une seule instance**
- placé sur **VM3**
- exposé sur le **port 9000**

### Vérification
L’interface web de SonarQube est accessible sur :

- `http://172.16.248.64:9000`

---

## 6. Installation de GitLab CE

Nous avons créé un playbook Ansible distinct pour installer **GitLab CE** sur **VM4**.

Cette installation est réalisée :

- sur une machine dédiée
- **hors cluster**
- en **natif / bare-metal**

Ce choix respecte la consigne du sujet, qui impose une installation GitLab sur la VM4 sans conteneur Docker.

### Vérification
L’interface web GitLab est accessible sur :

- `http://172.16.248.236`

---

## 7. Automatisation Ansible

L’infrastructure a été automatisée avec **Ansible** à l’aide des éléments suivants :

- `playbooks/infrastructure.yml`
- `playbooks/gitlab.yml`
- rôle `docker_swarm`
- rôle `SonarQube`
- rôle `install_gitlab`

Cette organisation permet de séparer :

- le déploiement du cluster
- l’installation de SonarQube
- l’installation de GitLab

---

## 8. Structure du projet

```text
Quantum-Motors/
├── README.md
├── ansible/
│   ├── inventories/
│   │   └── production/
│   │       ├── hosts.yml
│   │       └── group_vars/
│   │           └── all.yml
│   ├── playbooks/
│   │   ├── infrastructure.yml
│   │   └── gitlab.yml
│   └── roles/
│       ├── docker_swarm/
│       ├── SonarQube/
│       └── install_gitlab/
├── clo5-backend-master/
├── clo5-front-main/
└── docs/