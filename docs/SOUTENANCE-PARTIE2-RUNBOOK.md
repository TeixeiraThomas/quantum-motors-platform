# SPE-CLO5 - Runbook Soutenance Partie 2 (5-7 min)

Date: `2026-05-26`

## 1. Intro (30 sec)

- Objectif: passer d'un configurateur "monolithique" a une plateforme mondiale fiable.
- Axe Partie 2: `evolutions architecture + monitoring pour equipes tech et non-tech`.

## 2. Existant et faiblesses (1 min)

- API backend unique + base unique.
- Scalabilite globale, pas par domaine metier.
- Risque de panne transversale.
- Visibilite metier insuffisante sur la disponibilite.

## 3. Nouvelle architecture microservices (2 min)

Presenter le schema de [`etape-2-architecture-microservices.md`](./etape-2-architecture-microservices.md):

- domaines: identity, catalog, configurator, configuration-library, order, payment, fleet, maintenance, CRM, notification
- API Gateway + BFF + Event Bus
- database per service
- benefices: HA, scalabilite selective, securite et blast radius reduit

## 4. Demo monitoring (2 min)

### 4.1 Vue non-technique (status)

- ouvrir `http://status.quantum.local`
- montrer etat des services (UP/DOWN)
- montrer historique disponibilite (bonus incidents)

### 4.2 Vue technique (Grafana)

- ouvrir `http://logs.quantum.local`
- dashboard `Quantum Motors - Service & Infrastructure Monitoring`
- montrer:
  - CPU/RAM/disque des nodes
  - charge services conteneurises
  - erreurs applicatives (logs 5xx / exceptions)
  - statut synthetique global (`probe_success`)
  - alertes actives (`ALERTS`)

### 4.3 Alerting et excellence ops (option 60-90 sec)

- ouvrir `http://alerts.quantum.local`
- montrer la route Alertmanager (webhook/email)
- montrer un backup node planifie (cron) + un rapport k6 existant

Option demo trafic:

- lancer `smoke.sh` puis montrer evolution des graphes/logs.

## 5. Conclusion (30 sec)

- Partie 2 validee avec 2 niveaux de lecture:
  - business/status pour non-tech
  - observabilite detaillee pour tech
- trajectoire claire pour extraction microservices progressive sans rupture.

## 6. Q/A (3 min)

Questions probables:

1. Pourquoi Swarm et pas Kubernetes?
- simplicite operationnelle dans le cadre du module, livraison plus rapide.

2. Pourquoi Uptime Kuma pour la status page?
- rapide a mettre en place, lisible non-tech, historique d'incidents integre.

3. Comment garantir l'idempotence Ansible?
- roles `logging_stack` et `monitoring_stack` avec hash de configuration et redeploiement conditionnel.

4. Qu'avez-vous ajoute en plus du minimum?
- supervision synthetique Blackbox
- alertes Prometheus preconfigurees
- cadre SRE (SLI/SLO + priorite incidents)
- notification reelle via Alertmanager
- backup/restore automatise
- tests de charge k6 avec rapport
