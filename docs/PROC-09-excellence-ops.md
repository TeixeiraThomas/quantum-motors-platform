# PROC-09 - Excellence Ops (Alerting, Backups, Load Test)

Date: `2026-05-26`

## 1. Objectif

Passer au niveau "au-dessus du sujet" avec:

1. alerting actif (webhook/email)
2. backup/restore automatises
3. test de charge reproductible + rapport

## 2. Alerting actif (Prometheus -> Alertmanager)

### 2.1 Endpoints

- Prometheus: `http://prometheus.quantum.local`
- Alertmanager: `http://alerts.quantum.local`

### 2.2 Configuration webhook/email

Le role `monitoring_stack` rend automatiquement la configuration Alertmanager depuis:

- [`ansible/roles/monitoring_stack/templates/alertmanager.yml.j2`](../ansible/roles/monitoring_stack/templates/alertmanager.yml.j2)

Variables supportees:

- `alertmanager_webhook_url`
- `alertmanager_email_to`
- `alertmanager_email_from`
- `alertmanager_smtp_smarthost`
- `alertmanager_smtp_auth_username`
- `alertmanager_smtp_auth_password`

Recommandation:

- stocker les credentials SMTP dans `group_vars/vault.yml`
- garder les adresses de destination dans `group_vars/all.yml`

### 2.3 Deploiement

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
bash ansible/scripts/wsl-ansible.sh infrastructure
```

### 2.4 Verification

1. Ouvrir `http://prometheus.quantum.local/alerts`
2. Ouvrir `http://alerts.quantum.local`
3. Forcer une alerte simple (ex: stopper un service monitoré) et verifier la notification webhook/email.

## 3. Backup/Restore automatise

Le role `backup_ops` installe sur chaque noeud:

- `/usr/local/bin/quantum-backup-node.sh`
- `/usr/local/bin/quantum-restore-node.sh`
- cron daily backup root

### 3.1 Verification cron

Sur un noeud:

```bash
sudo crontab -l | grep "Quantum Motors node backup"
```

### 3.2 Lancer un backup manuel

```bash
sudo /usr/local/bin/quantum-backup-node.sh
```

### 3.3 Restaurer un backup

```bash
sudo /usr/local/bin/quantum-restore-node.sh \
  /srv/backups/quantum-motors/<hostname>/<timestamp> \
  / --force
```

## 4. Test de charge + rapport

Fichiers:

- script k6: [`tests/performance/k6-platform.js`](../tests/performance/k6-platform.js)
- runner: [`tests/performance/run_k6.sh`](../tests/performance/run_k6.sh)
- générateur rapport: [`tests/performance/generate_report.py`](../tests/performance/generate_report.py)

### 4.1 Execution

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
bash tests/performance/run_k6.sh \
  http://172.16.248.64 \
  front.quantum.local \
  api.quantum.local
```

### 4.2 Sorties

Le script crée:

- `tests/performance/reports/<timestamp>/k6-summary.json`
- `tests/performance/reports/<timestamp>/k6-report.md`

Ce rapport est utilisable directement en soutenance pour objectiver:

- taux d'erreur
- latence moyenne/p95/p99
- volume de requetes

## 5. Checklist "excellent+"

1. Alertes visibles dans Prometheus et Alertmanager
2. Notification webhook/email reçue
3. Backup manuel et backup cron validés
4. Un restore test (en préprod) validé
5. Rapport k6 archivé et comparé à un run précédent
