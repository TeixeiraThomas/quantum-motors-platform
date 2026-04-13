# Guide complet : Déploiement Quantum Motors

**Date :** 2026-04-13  
**Dernière mise à jour :** 2026-04-13

## Guide de déploiement rapide

Ce dossier contient les procédures détaillées pour reproduire l'infrastructure complète du projet Quantum Motors.

### 📋 Procédures (index)

| # | Procédure | Durée | Prérequis | Objectif |
|---|-----------|-------|-----------|----------|
| 0 | [Configuration Ansible Vault](PROC-00-check-prerequisites.md) | 5 min | Poste local | Vérifier prérequis système |
| 1 | [Initialisation Ansible Vault](PROC-01-vault-setup.md) | 10 min | Ansible installé | Configurer les secrets |
| 2 | [Obtenir token GitLab Runner](PROC-02-gitlab-runner-token.md) | 15 min | VM4 GitLab active | Enregistrer runners |
| 3 | [Variables CI/CD GitLab](PROC-03-gitlab-ci-variables.md) | 20 min | Dépôt GitLab créé | Configurer la pipeline |
| 4 | [DNS local /etc/hosts](PROC-04-hosts-setup.md) | 10 min | Accès réseau | Résoudre domaines |
| 5 | [Validation CI/CD live](PROC-05-cicd-validation.md) | 30 min | Tous playbooks OK | Tester build & deploy |

---

## 📦 Ordre de déploiement

### Phase 1 — Préparation (machine locale)

```bash
# 1. Cloner le dépôt
git clone http://172.16.248.236/Quantum-Motors.git
cd Quantum-Motors

# 2. Installer Ansible localement
pip install ansible

# 3. Installer les collections Ansible
ansible-galaxy collection install community.docker

# 4. Générer le password Ansible Vault
echo "TON_PASSWORD_SECRET" > ~/.vault_pass
chmod 600 ~/.vault_pass

# 5. Valider la syntaxe Ansible
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook ansible/playbooks/infrastructure.yml --syntax-check
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook ansible/playbooks/gitlab.yml --syntax-check
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook ansible/playbooks/runners.yml --syntax-check
```

### Phase 2 — Infrastructure (VMs)

```bash
# Depuis : machine locale avec Ansible

# 6. Déployer Swarm, NFS, Traefik, Logging, SonarQube
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass

# Durée : ~10 min
# Acceptation : aucune erreur, tous hosts OK

# 7. Rejoner pour valider idempotence
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass
# Acceptation : changed=0
```

### Phase 3 — GitLab (VM4)

```bash
# 8. Installer GitLab CE
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/gitlab.yml \
  --vault-password-file=~/.vault_pass

# Durée : ~5 min
# Acceptation : GitLab accessible à http://172.16.248.236
```

### Phase 4 — Configuration (GitLab UI + Vault)

```bash
# Depuis : GitLab UI (http://172.16.248.236)

# 9. Obtenir token runner (Procédure 2)
#    Ajouter au vault.yml

# 10. Déployer runners (VM1, VM2, VM3)
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass

# Durée : ~2 min
# Acceptation : 3 runners online dans GitLab UI
```

### Phase 5 — Pipeline CI/CD

```bash
# Depuis : GitLab UI (Settings → CI/CD → Variables)

# 11. Créer Deploy Tokens (Admin → Deploy Tokens)
# 12. Déclarer 9 variables CI/CD (Procédure 3)

# Durée : ~10 min
# Acceptation : 9 variables visibles dans GitLab UI
```

### Phase 6 — Configuration locale

```bash
# Depuis : machine locale

# 13. Configurer /etc/hosts (Procédure 4)
# 14. Vérifier résolution DNS

# 15. Lancer la validation pipeline (Procédure 5)
git checkout develop
echo "# Test" >> README.md
git commit -am "trigger: CI/CD validation"
git push origin develop

# Durée : ~3 min push + attendre ~5 min pipeline
# Acceptation : tous stages ✅ jusqu'à test_preprod
```

---

## ⏱️ Temps total estimé

| Phase | Durée | Notes |
|-------|-------|-------|
| Préparation (local) | 15 min | Ansible, Vault config |
| Infrastructure (Swarm) | 10 min | Docker, NFS, Traefik, etc. |
| GitLab (bare-metal) | 5 min | Installation CE |
| GitLab Runners | 2 min | Enregistrement 3 runners |
| CI/CD setup | 10 min | Variables, Deploy Tokens |
| Validation live | 10 min | Pipeline test |
| **TOTAL** | **52 min** | ✅ Infra complète |

---

## 🔐 Checklist pre-deployment

Avant de lancer les playbooks, vérifie :

- [ ] Inventaire `ansible/inventories/production/hosts.yml` à jour (IPs, users)
- [ ] Mots de passe dans `ansible/inventories/production/group_vars/vault.yml`
- [ ] Variables dans `ansible/inventories/production/group_vars/all.yml` complètes
- [ ] Placeholder `intervenant_1`, `intervenant_2` remplacés par vrais noms
- [ ] SSH key setup pour accès passwordless (ou ansible_ask_pass)
- [ ] 4 VMs Debian 12 opérationnelles avec hostnames uniques
- [ ] Réseau 172.16.248.0/24 accessible
- [ ] Ports 22, 80, 443, 2377, 3306 ouverts (firewall)

---

## 🐛 Troubleshooting rapide

### Erreur Ansible : "Unreachable"

```
UNREACHABLE! => {
    "changed": false,
    "msg": "Failed to connect by the requested method."
}
```

**Solution :**

```bash
# Vérifie SSH
ssh -v teixei_t@172.16.248.64 "hostname"

# Force password prompt
ansible-playbook ... --ask-pass

# Ou configure SSH key
ssh-copy-id -i ~/.ssh/id_rsa.pub teixei_t@172.16.248.64
```

### Erreur : "Vault password incorrect"

```
ERROR! Vault password error
```

**Solution :**

```bash
# Vérifie le fichier
cat ~/.vault_pass

# Ou régénère (perdra les anciens secrets)
ansible-vault rekey \
  ansible/inventories/production/group_vars/vault.yml
```

### Service stuck "0/1"

```
docker service ls
# OUTPUT: preprod_api-preprod  0/1  ...  (0/1 ready)
```

**Solution :**

```bash
# Sur VM1 manager
ssh teixei_t@172.16.248.64

# Vérifier les logs
docker service logs preprod_api-preprod

# Forcer un redéploiement
docker service update --force preprod_api-preprod
```

---

## 📖 Documentation de référence

| Document | Contenu |
|----------|---------|
| [etape-0bis-documentation-technique.md](etape-0bis-documentation-technique.md) | Architecture, choix tech, variables |
| [etape-0bis-schema-infrastructure.md](etape-0bis-schema-infrastructure.md) | Diagram Mermaid VMs + réseaux |
| [../../.gitlab-ci.yml](../../.gitlab-ci.yml) | Pipeline CI/CD complète |
| [../../ansible/playbooks/](../../ansible/playbooks/) | Playbooks Ansible |
| [../../ansible/roles/](../../ansible/roles/) | Rôles Ansible |
| [../../deploy/](../../deploy/) | Manifests Docker Swarm |

---

## 🎯 Points de contrôle par étape

### Après Phase 2 (Infrastructure)

```bash
# Sur VM1
ssh teixei_t@172.16.248.64

# Vérifie Swarm
docker swarm ca

# Vérifie réseaux
docker network ls | grep -E "public|preprod|prod|logs"

# Vérifie NFS
mount | grep nfs

# Vérifie Traefik
docker service ls | grep traefik
```

### Après Phase 3 (GitLab)

```bash
# Accès GitLab
curl http://172.16.248.236/users/sign_in

# Vérifier users
curl -H "PRIVATE-TOKEN: root_password" \
  http://172.16.248.236/api/v4/users
```

### Après Phase 4 (Runners)

```bash
# GitLab UI → Admin → CI/CD → Runners
# Vérification : 3 runners ✅ online
```

### Après Phase 5 (CI/CD)

```bash
# GitLab UI → Dépôt → Settings → CI/CD → Variables
# Vérification : 9 variables ✅
```

### Après Phase 6 (Validation)

```bash
# Tests locaux
curl http://preprod.quantum.local
curl http://api-preprod.quantum.local/health
curl http://logs.quantum.local
```

---

## 🚀 Prochaines étapes post-validation

Une fois tout validé :

1. **Archive les secrets** dans un gestionnaire (Bitwarden, Vault, etc.)
2. **Sauvegarde le Vault password** dans un endroit sûr
3. **Documenta les changements** dans un changelog
4. **Prépa la soutenance** (voir [SOUTENANCE.md](SOUTENANCE.md))

---

## 📞 Support & Escalade

En cas de problème :

1. Consulte le troubleshooting de la procédure correspondante
2. Vérifie les logs : `docker service logs [nom_service]`
3. Relance le playbook correspondant avec `-vvv` pour debug
4. Relie la doc 0-bis pour les choix d'architecture

---

## ✨ Validations

| Elément | Status | Date |
|---------|--------|------|
| Syntaxe Ansible | ✅ | 2026-04-13 |
| Infrastructure complète | ⏳ | À faire |
| GitLab up | ⏳ | À faire |
| Runners registered | ⏳ | À faire |
| Pipeline develop OK | ⏳ | À faire |
| Pipeline main OK (blue/green) | ⏳ | À faire |
| Live test preprod | ⏳ | À faire |
| Live test prod | ⏳ | À faire |

---

**Bonne chance! 🎯**
