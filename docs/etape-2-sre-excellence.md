# SPE-CLO5 / Quantum Motors - SRE Excellence Pack

Document date du `2026-05-26`.

## 1. Objectif

Passer d'un simple monitoring a un socle SRE presentable:

- SLI/SLO explicites
- alertes techniques utiles et priorisees
- supervision synthetique
- runbooks d'operation

## 2. SLI/SLO proposes

### SLO-1 Disponibilite Frontend

- `SLI`: taux de succes des probes HTTP frontend
- `Objectif`: `>= 99.5%` sur 30 jours
- `Mesure`: `probe_success` (blackbox probes)

### SLO-2 Disponibilite API

- `SLI`: taux de succes des probes HTTP API
- `Objectif`: `>= 99.5%` sur 30 jours
- `Mesure`: `probe_success` cible API

### SLO-3 Fiabilite plateforme

- `SLI`: absence d'alertes critiques `TargetDown`
- `Objectif`: aucune alerte critique > 15 min non accusee
- `Mesure`: serie `ALERTS{severity="critical", alertstate="firing"}`

## 3. Alertes implementees

Le fichier [`deploy/monitoring/rules.yml`](../deploy/monitoring/rules.yml) couvre:

1. `PrometheusTargetDown` (critical)
2. `BlackboxProbeFailed` (warning)
3. `NodeHighCPU` (warning)
4. `NodeHighMemory` (warning)
5. `NodeDiskPressureRoot` (warning)

## 4. Supervision synthetique

La stack monitoring inclut `blackbox-exporter`:

- config: [`deploy/monitoring/blackbox.yml`](../deploy/monitoring/blackbox.yml)
- probes: [`deploy/monitoring/prometheus.yml`](../deploy/monitoring/prometheus.yml), job `blackbox-http-probes`

Cette supervision detecte rapidement:

- indisponibilite composants monitoring
- regression de sante de Loki/Grafana/Uptime Kuma
- indisponibilite du routeur d'alertes (Alertmanager)

## 5. Notification d'alertes reelle

La stack inclut `Alertmanager`:

- endpoint: `alerts.quantum.local`
- routage configurable webhook et/ou email via variables Ansible
- template: [`ansible/roles/monitoring_stack/templates/alertmanager.yml.j2`](../ansible/roles/monitoring_stack/templates/alertmanager.yml.j2)

## 6. Tableau de bord technique (Grafana)

Le dashboard provisionne affiche en plus:

- statut global des probes synthetiques
- nombre d'alertes actives par type/severite

Fichier:

- [`deploy/logging/dashboard-quantum-observability.json`](../deploy/logging/dashboard-quantum-observability.json)

## 7. Backup et restauration

Role Ansible dedie:

- [`ansible/roles/backup_ops/tasks/main.yml`](../ansible/roles/backup_ops/tasks/main.yml)

Comportement:

- script backup installe sur chaque noeud
- retention automatique
- cron daily idempotent
- script de restoration avec validation explicite `--force`

## 8. Politique de priorite incident (P1/P2/P3)

1. `P1`:
- indisponibilite frontend prod
- indisponibilite API prod
- perte de donnees
- action: mitigation immediate, communication toutes 15 min

2. `P2`:
- degradation majeure perf
- indisponibilite preprod prolongee
- action: correction rapide, communication toutes 30 min

3. `P3`:
- alertes warning isolees
- action: traitement planifie, post-analyse hebdo

## 9. Evidence soutenance

Montrer en live:

1. Dashboard technique avec panels `Synthetic probes global status` et `Firing alerts by type`
2. Prometheus `/alerts` et regles actives
3. Alertmanager recevant les alertes et poussant webhook/email
4. Status page Uptime Kuma avec historique incidents
5. Rapport k6 de performance (latence p95, taux d'erreur, debit)
