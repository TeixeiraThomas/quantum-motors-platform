# SPE-CLO5 / Quantum Motors  
## Étape 0 — Schéma d’infrastructure

---

## 1. Présentation du projet

Dans le cadre du projet **Quantum Motors**, notre équipe doit reprendre une application web existante dans une logique **DevOps** afin de moderniser une infrastructure devenue vieillissante, peu flexible et difficilement scalable.

Le sujet met en avant plusieurs problématiques :

- une infrastructure historique insuffisante face à une montée en charge
- un versionnement ancien basé sur **SVN**
- un besoin d’industrialisation du déploiement
- une nécessité de séparer les environnements de travail
- un besoin de supervision, de centralisation des logs et de validation automatisée
- une volonté d’automatiser la mise en production à partir d’un commit sur une branche précise

L’objectif global est donc de concevoir une **architecture moderne, cohérente, automatisable et évolutive**, capable d’héberger le configurateur Quantum Motors dans de bonnes conditions.

Cette **étape 0** consiste à proposer un **schéma d’infrastructure complet**, fondé sur les besoins exprimés par le client, et servant de base de travail pour toutes les étapes suivantes du projet.

---

## 2. Objectifs de l’étape 0

Cette première étape a pour but de :

- analyser le besoin fonctionnel et technique du sujet
- identifier les composants nécessaires à l’infrastructure cible
- définir une architecture réaliste et industrialisable
- répartir les rôles entre les différentes machines virtuelles
- prévoir une logique de cluster, de CI/CD, de supervision et d’automatisation
- produire un schéma clair permettant de guider les phases de mise en œuvre futures

Cette étape est structurante, car elle conditionne la cohérence des choix techniques qui seront mis en place ensuite.

---

## 3. Rappel des contraintes du sujet

Le sujet impose ou recommande les éléments suivants :

- utilisation de **Docker**
- utilisation de **GitLab** et **GitLab-CI**
- automatisation avec **Ansible**
- déploiement sur un **cluster**
- séparation entre **preprod** et **prod**
- déploiement continu à partir d’un **commit sur une branche précise**
- déploiement des services **frontend** et **API**
- mise en place de **tests fonctionnels**
- centralisation des **logs**
- exécution des **runners GitLab-CI** sous forme de conteneurs Docker
- exploitation des VMs mises à disposition
- possibilité d’utiliser **Docker Swarm** ou **Kubernetes**

Le livrable attendu à cette étape est un **schéma d’infrastructure cohérent** rendu dans le dépôt Git.

---

## 4. Analyse du besoin

Après lecture du sujet, nous identifions les besoins majeurs suivants :

### 4.1 Besoin d’orchestration
L’application ne doit plus être déployée manuellement sur un simple serveur isolé.  
Il faut désormais prévoir une architecture **clusterisée**, capable de répartir et d’orchestrer plusieurs services.

### 4.2 Besoin de séparation des environnements
L’entreprise souhaite une logique **multi-environnement**, avec au minimum :

- un environnement **preprod**
- un environnement **prod**

Cette séparation est indispensable pour tester les évolutions avant mise en production.

### 4.3 Besoin d’intégration continue et de déploiement continu
L’infrastructure doit permettre, à partir d’un commit sur une branche donnée :

- le lancement automatique des pipelines
- la construction des images Docker
- l’exécution des tests
- le déploiement sur l’environnement cible

### 4.4 Besoin de supervision et d’observabilité
Le sujet mentionne explicitement la nécessité de rediriger les logs vers un serveur de traitement.  
Il faut donc prévoir une solution de collecte et de consultation des journaux d’exécution.

### 4.5 Besoin d’automatisation
La mise en place du cluster, des outils DevOps et des services doit être automatisée à l’aide d’**Ansible** afin de garantir la reproductibilité de l’infrastructure.

### 4.6 Besoin de cohérence avec les technologies fournies
L’application fournie s’appuie sur une architecture web classique avec :

- un **frontend**
- une **API**
- une **base de données**

Le schéma doit donc représenter explicitement ces composants et leurs relations.

---

## 5. Choix d’architecture

---

## 5.1 Choix de l’orchestrateur : Docker Swarm

Le sujet autorise le choix entre **Docker Swarm** et **Kubernetes**.

Dans le cadre de ce POC, nous avons choisi **Docker Swarm** pour les raisons suivantes :

- mise en place plus simple et plus rapide
- administration plus légère dans un environnement de taille réduite
- bonne intégration avec l’écosystème Docker
- cohérence avec l’objectif de démonstration DevOps
- adaptation au nombre limité de machines disponibles
- simplicité d’automatisation avec Ansible

Kubernetes aurait été envisageable, mais représenterait une complexité supplémentaire peu pertinente pour cette étape de cadrage et pour un POC réalisé dans un temps limité.

### Conclusion sur ce choix
**Docker Swarm** représente ici le meilleur compromis entre :
- simplicité
- clarté d’architecture
- faisabilité
- cohérence technique

---

## 5.2 Choix de la plateforme DevOps : GitLab

Nous retenons **GitLab CE privé** pour centraliser :

- le code source
- les branches
- les pipelines CI/CD
- le registre d’images Docker
- les automatisations de build et de déploiement

Ce choix est cohérent avec le sujet, qui impose explicitement GitLab et GitLab-CI.

---

## 5.3 Choix de la solution de logs

Pour répondre au besoin de centralisation des journaux d’exécution, nous retenons une pile légère et adaptée à un POC :

- **Promtail** pour la collecte
- **Loki** pour le stockage
- **Grafana** pour la visualisation

Ce choix permet :
- une mise en place plus simple que des stacks plus lourdes
- une bonne intégration avec les logs conteneurisés
- une visualisation claire pour le debug et la supervision

---

## 5.4 Choix de l’organisation réseau

L’architecture sépare logiquement les environnements applicatifs à travers :

- un réseau **preprod_net**
- un réseau **prod_net**

Cette séparation facilite :
- l’isolation logique
- la lisibilité de l’architecture
- la maîtrise des flux entre services
- la préparation de règles de sécurité plus strictes pour la suite du projet

---

## 6. Architecture générale proposée

L’architecture cible s’articule autour de **quatre machines virtuelles** :

- **VM1** : point central du cluster, reverse proxy et rôle de manager
- **VM2** : nœud worker participant à l’environnement preprod
- **VM3** : nœud worker participant à l’environnement prod
- **VM4** : outils DevOps, CI/CD, tests et services transverses

L’ensemble repose sur un **cluster Docker Swarm** permettant de piloter les services applicatifs déployés en conteneurs.

Les utilisateurs accèdent à la plateforme via un **reverse proxy / ingress**, qui oriente les requêtes vers l’environnement approprié selon le domaine utilisé.

Les déploiements sont pilotés par **GitLab CI/CD**, via des **GitLab Runner(s) Docker**, capables d’exécuter les pipelines de build, de test et de déploiement.

Les logs sont collectés de manière centralisée, et les tests d’intégration / fonctionnels sont intégrés au cycle CI/CD.

---

## 7. Répartition des rôles par VM

---

## 7.1 VM1 — Docker Swarm Manager + Reverse Proxy / Ingress

### Rôle principal
La VM1 joue un rôle central dans l’infrastructure.  
Elle héberge :

- le **manager Docker Swarm**
- le **reverse proxy / ingress**
- le point d’entrée principal du trafic utilisateur

### Responsabilités
- initialisation et gestion du cluster Swarm
- supervision logique des services déployés
- réception du trafic entrant
- routage des requêtes vers les bons services frontend
- préparation à l’exposition future sécurisée en HTTPS

### Intérêt architectural
Cette VM centralise la logique de pilotage du cluster ainsi que l’exposition des services, ce qui simplifie la lisibilité du schéma et la gestion globale de la plateforme.

---

## 7.2 VM2 — Docker Swarm Worker

### Rôle principal
La VM2 participe au cluster en tant que **worker**.

### Responsabilités
- hébergement des conteneurs liés à l’environnement **preprod**
- exécution des services applicatifs assignés par l’orchestrateur
- participation à la répartition de charge du cluster

### Services concernés
- Frontend Preprod
- API Preprod
- éventuellement composants complémentaires selon les besoins futurs

---

## 7.3 VM3 — Docker Swarm Worker

### Rôle principal
La VM3 participe également au cluster en tant que **worker**.

### Responsabilités
- hébergement des conteneurs liés à l’environnement **prod**
- exécution des services applicatifs assignés par l’orchestrateur
- participation à l’architecture distribuée du cluster

### Services concernés
- Frontend Prod
- API Prod
- éventuellement composants complémentaires selon la stratégie de placement des services

---

## 7.4 VM4 — Outils DevOps

### Rôle principal
La VM4 regroupe l’ensemble des briques DevOps nécessaires au cycle de livraison continue.

### Services hébergés
- **GitLab CE privé**
- **GitLab Runner(s) Docker**
- **Container Registry GitLab**
- **Tests d’intégration / fonctionnels**

### Responsabilités
- hébergement des dépôts source
- exécution des pipelines CI/CD
- construction et stockage des images Docker
- lancement des tests automatiques
- déclenchement des déploiements vers le cluster

### Intérêt architectural
Isoler ces outils sur une VM dédiée améliore :
- la lisibilité
- la séparation des responsabilités
- la maintenabilité
- la cohérence DevOps de l’architecture

---

## 8. Organisation des environnements

L’infrastructure distingue explicitement deux environnements :

---

## 8.1 Environnement Preprod

### Objectif
La preproduction sert à :
- valider les nouvelles versions
- exécuter les tests d’intégration / tests fonctionnels
- vérifier le comportement de l’application avant déploiement en production

### Services déployés
- **Frontend Preprod**
- **API Preprod**
- **MariaDB Preprod**

### Accès
Exemple de domaine :
- `preprod.quantum-motors.local`

### Intérêt
Cet environnement permet d’éviter toute mise en production directe d’une version non validée.

---

## 8.2 Environnement Prod

### Objectif
La production héberge la version stable et validée de l’application.

### Services déployés
- **Frontend Prod**
- **API Prod**
- **MariaDB Prod**

### Accès
Exemple de domaine :
- `prod.quantum-motors.local`

### Intérêt
Cet environnement représente la version finale accessible aux utilisateurs.

---

## 9. Flux applicatifs

Les flux logiques sont les suivants :

### 9.1 Flux utilisateur
Les utilisateurs accèdent à l’application via :
- `preprod.quantum-motors.local`
- `prod.quantum-motors.local`

Ces flux arrivent sur le **Reverse Proxy / Ingress**, qui redirige les requêtes vers le frontend correspondant.

### 9.2 Flux applicatifs
Pour chaque environnement :
- le **frontend** communique avec l’**API**
- l’**API** communique avec la **base MariaDB**

Ce modèle s’applique à la fois à **preprod** et à **prod**.

### 9.3 Flux CI/CD
Les développeurs poussent leur code dans GitLab.  
Le pipeline est ensuite déclenché automatiquement selon la branche visée.

### 9.4 Flux de logs
Les services applicatifs envoient leurs logs vers la brique de collecte, qui les centralise dans **Loki** et les rend consultables via **Grafana**.

---

## 10. Chaîne CI/CD prévue

L’un des objectifs majeurs du sujet est de permettre un déploiement continu à partir d’un commit sur une branche précise.

Nous avons donc prévu la logique suivante :

---

## 10.1 Branche `develop`

Un commit sur la branche `develop` déclenche :

1. récupération du code source
2. exécution du pipeline CI/CD
3. build des images Docker
4. exécution des tests d’intégration / fonctionnels
5. déploiement automatique en **Preprod**

### Objectif
Valider les évolutions avant promotion éventuelle en production.

---

## 10.2 Branche `main`

Un commit sur la branche `main` déclenche :

1. récupération du code source
2. exécution du pipeline CI/CD
3. build des images Docker
4. exécution des validations nécessaires
5. déploiement automatique en **Prod**

### Objectif
Mettre en ligne une version maîtrisée et validée de l’application.

---

## 10.3 Rôle des GitLab Runner(s)

Les **GitLab Runner(s) Docker** sont responsables de :

- l’exécution des jobs CI/CD
- la construction des images
- l’exécution des tests
- l’interaction avec le registry
- le déclenchement du déploiement sur le cluster

Ils constituent donc le lien opérationnel entre :
- le code source
- les tests
- les images Docker
- l’environnement de déploiement

---

## 11. Gestion des logs et observabilité

Le sujet précise que les logs d’exécution doivent pouvoir être redirigés vers un serveur de traitement.

Nous prévoyons donc une brique de **collecte centralisée des logs**.

### Solution retenue
- **Promtail** : collecte des logs
- **Loki** : stockage
- **Grafana** : visualisation

### Objectifs couverts
- consultation centralisée des journaux
- diagnostic simplifié en cas d’erreur
- aide au suivi du fonctionnement applicatif
- préparation à une supervision plus avancée

Cette brique ne se limite pas à une exigence technique : elle répond à un besoin opérationnel réel dans une logique de production industrialisée.

---

## 12. Tests d’intégration / fonctionnels

Le sujet demande explicitement la mise en place de tests fonctionnels dans les dépôts de l’application.

Notre architecture intègre donc une phase de test au sein du pipeline CI/CD.

### Types de tests prévus
- **tests d’intégration**
- **tests fonctionnels**

### Objectifs
- vérifier la cohérence des composants
- valider le bon comportement de l’application
- détecter les régressions avant déploiement
- sécuriser les mises en production

### Positionnement dans l’architecture
Les tests sont exécutés via les **GitLab Runner(s)** et participent à la validation avant déploiement sur l’environnement cible.

---

## 13. Place d’Ansible dans la suite du projet

Même si cette étape porte principalement sur le schéma d’infrastructure, notre architecture est pensée pour être automatisée ensuite avec **Ansible**.

### Ansible sera utilisé pour :
- installer Docker sur les VMs
- configurer les prérequis système
- initialiser le cluster Swarm
- joindre les workers au cluster
- déployer les composants nécessaires
- préparer les fichiers de configuration
- industrialiser la mise en place de l’infrastructure

### Intérêt
Ce choix garantit :
- la reproductibilité
- la réduction des actions manuelles
- la cohérence entre les environnements
- une vraie logique DevOps

---

## 14. Justification globale des choix

Notre proposition d’architecture répond aux besoins du sujet pour plusieurs raisons :

### Simplicité
Le choix de Docker Swarm permet de conserver une architecture lisible et réaliste pour un POC.

### Séparation des environnements
La distinction entre **preprod** et **prod** permet de sécuriser le cycle de livraison.

### Industrialisation
L’intégration de GitLab CI/CD, des runners, du registry et d’Ansible prépare une vraie chaîne de déploiement continue.

### Observabilité
La collecte centralisée des logs permet de répondre à un besoin opérationnel indispensable.

### Cohérence
Chaque composant représenté dans le schéma a un rôle précis et directement lié aux attentes du sujet.

---

## 15. Contenu du livrable

Pour cette étape 0, nous rendons :

- un **schéma d’infrastructure au format image**
- un **fichier source modifiable du schéma**
- ce **README explicatif**

### Arborescence du dépôt
```text
README.md
docs/
├── etape-0-schema-infrastructure-quantum-motors.png
└── etape-0-schema-infrastructure-quantum-motors.drawio