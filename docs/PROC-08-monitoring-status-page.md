# PROC-08 - Monitoring & Status Page (Partie 2)

Date: `2026-05-26`

## 1. Objectif

Verifier et demontrer:

- une vue non-technique de disponibilite type GitHub Status
- une vue technique centralisee logs + ressources cluster

## 2. Composants deploies

- `monitoring` stack:
  - `prometheus`
  - `node-exporter` (global)
  - `cadvisor` (global)
  - `uptime-kuma`
- `logging` stack:
  - `loki`
  - `alloy`
  - `grafana-logs`

## 3. Deploiement

Depuis WSL (recommande):

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
bash ansible/scripts/wsl-ansible.sh infrastructure
```

Le playbook `infrastructure.yml` deploie maintenant aussi le role `monitoring_stack`.

## 4. Verifications techniques rapides

Sur le manager Swarm (VM1):

```bash
sudo docker service ls
```

Services attendus:

- `monitoring_prometheus`
- `monitoring_uptime-kuma`
- `monitoring_blackbox-exporter`
- `monitoring_node-exporter` (global)
- `monitoring_cadvisor` (global)
- `logging_loki`
- `logging_alloy` (global)
- `logging_grafana-logs`

## 5. Endpoints de demo

- Status page: `http://status.quantum.local`
- Grafana (logs + metrics): `http://logs.quantum.local`
- Prometheus (optionnel demo technique): `http://prometheus.quantum.local`
- Alertmanager (optionnel demo alerting): `http://alerts.quantum.local`

## 6. Initialiser la status page Uptime Kuma

Au premier lancement:

1. Ouvrir `http://status.quantum.local`
2. Creer le compte admin Uptime Kuma
3. Ajouter des monitors HTTP:
- `front.quantum.local`
- `api.quantum.local`
- `preprod.quantum.local`
- `api-preprod.quantum.local`
- `logs.quantum.local`
4. Creer une Status Page publique et y associer les monitors

Note:
- l'historique des incidents est conserve dans Uptime Kuma (bonus).

## 7. Dashboard technique Grafana

Dans `http://logs.quantum.local`, ouvrir:

- `Quantum Monitoring / Quantum Motors - Service & Infrastructure Monitoring`

Le dashboard fournit:

- CPU par node
- RAM par node
- disque root par node
- charge CPU conteneurs par service
- volume de logs `5xx` par service
- volume de logs erreurs/exceptions par service
- statut global des probes synthetiques
- alertes actives par type/severite

## 8. Jeux de tests de demo

1. Lancer un smoke test pour generer du trafic:

```bash
sh tests/functional/smoke.sh \
  http://172.16.248.64 front.quantum.local api.quantum.local
```

2. Verifier la remontee des logs:

```bash
sh tests/functional/log_queries.sh \
  http://172.16.248.64:3100 prod-live
```

3. Montrer les courbes Grafana qui evoluent en direct.

## 9. Idempotence Ansible

Le role `monitoring_stack` est idempotent:

- copie des manifests dans `/opt/quantum-motors/deploy`
- calcul d'un hash de deploiement
- recreation de stack uniquement si manifest/config a change

Le role `logging_stack` suit la meme logique pour les nouveaux fichiers Grafana.

## 10. Verifier les alertes Prometheus

Ouvrir:

- `http://prometheus.quantum.local/alerts`

Alertes preconfigurees:

- `PrometheusTargetDown`
- `BlackboxProbeFailed`
- `NodeHighCPU`
- `NodeHighMemory`
- `NodeDiskPressureRoot`
