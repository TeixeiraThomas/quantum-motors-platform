# Procédure 2 : Obtenir le token d'enregistrement GitLab Runner

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 15 min  
**Prérequis :** VM4 (GitLab) accessible, Ansible Vault configuré

## Objectif

Créer un runner instance dans GitLab et récupérer le token d'enregistrement à stocker dans Ansible Vault.

---

## Configuration attendue

| Élément | Valeur |
|---------|--------|
| **Adresse GitLab** | `http://172.16.248.236` |
| **Type de runner** | Instance Runner |
| **Exécuteur** | `docker` |
| **Nœuds cibles** | vm1, vm2, vm3 (Swarm cluster) |
| **Stockage du token** | `vault_gitlab_runner_registration_token` dans `vault.yml` |

---

## Étapes

### 2.1 — Accède à l'interface GitLab

1. Ouvre un navigateur
2. Va à : `http://172.16.248.236`
3. Login avec **root**
4. Mot de passe → dans le vault : `vault_gitlab_root_password`

Commande pour voir le mot de passe :

```bash
ansible-vault view \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml | grep vault_gitlab_root_password
```

---

### 2.2 — Navigue vers la création de Runner

**Chemin :** Admin (couronne en haut) → CI/CD → Runners

Ou URL directe : `http://172.16.248.236/admin/runners`

---

### 2.3 — Crée un nouveau Runner

1. Clique bouton **"Create runner"**
2. Configure comme suit :

#### **Sélection du type**

- **Where will the runner execute code?** → `Linux` ✅
- **Architecture** → `x86_64` ✅
- Clique **"Create runner"**

#### **Enregistrement du runner**

La page affiche un token d'enregistrement (ex: `glrt_AbCd123XyZ...`).

⚠️ **COPIE IMMÉDIATEMENT ce token** — Il n'apparaîtra plus après !

---

### 2.4 — Stocke le token dans Ansible Vault

Depuis ta machine locale :

```bash
cd /path/to/Quantum-Motors

# Édite le vault
ansible-vault edit \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml
```

Ajoute ou mets à jour cette variable :

```yaml
vault_gitlab_runner_registration_token: glrt_AbCd123XyZ...
```

(Remplace `glrt_...` par le token copié à l'étape 2.3)

Sauvegarde et quitte (Ctrl+D ou Ctrl+O → Ctrl+X).

---

### 2.5 — Valide le token stocké

```bash
# Affiche uniquement la variable
ansible-vault view \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml | grep vault_gitlab_runner_registration_token

# Résultat attendu :
# vault_gitlab_runner_registration_token: glrt_AbCd123XyZ...
```

**Acceptation ✅ :** La variable est présente et n'est pas vide.

---

### 2.6 — Enregistre les runners de cluster

Une fois le vault mis à jour, exécute le playbook runners :

```bash
cd /path/to/Quantum-Motors

ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass
```

**Acceptation ✅ :** 
- Aucune erreur
- 3 runners créés (vm1, vm2, vm3)

Valide dans GitLab UI → Admin → CI/CD → Runners :

```
Status       Description        Tags
------------ ------------------ -----------
✅ online    vm1-runner         swarm-manager, swarm, docker
✅ online    vm2-runner         swarm-worker, swarm, docker
✅ online    vm3-runner         swarm-worker, swarm, docker
```

---

## Re-générer un token expiré

### En UI GitLab

1. Admin → CI/CD → Runners
2. Récupère les runners existants
3. Clique sur un runner → "Reset authentication token"
4. Copie le NOUVEAU token
5. Mets à jour le vault comme en **2.4**

### Via API GitLab (avancé)

```bash
# Liste les runners
curl -H "PRIVATE-TOKEN: root_password" \
  http://172.16.248.236/api/v4/runners

# Reset token d'un runner
curl -X POST \
  -H "PRIVATE-TOKEN: root_password" \
  http://172.16.248.236/api/v4/runners/1/reset_authentication_token
```

---

## Troubleshooting

### Erreur : "Runner failed to authenticate"

```
ERROR: Runner failed to register: error HTTP 401 / invalid token
```

**Cause :** Token expiré ou incorrect

**Solution :**

```bash
# 1. Crée un nouveau token en UI
# 2. Mets à jour le vault
ansible-vault edit \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml

# 3. Re-exécute le playbook runners
ansible-playbook \
  -i ansible/inventories/production/hosts.yml \
  ansible/playbooks/runners.yml \
  --vault-password-file=~/.vault_pass
```

### Erreur : "Runner registration locked"

```
GitLab CE avec trop de runners non confirmés
```

**Solution :**

Accède à Admin → CI/CD → Runners et supprime les runners offline/defunct.

### Erreur : "docker socket: permission denied"

N'apparaît PAS — le playbook configure les permissions correctement.

### Runner en ligne mais pas de jobs

**Vérification :**

```bash
# Sur vm1 (SSH)
ssh teixei_t@172.16.248.64

# Vérifie que le container runner tourne
docker ps | grep gitlab-runner
# Résultat : container gitlab-runner   (En cours)

# Logs
docker logs gitlab-runner

# Redémarre
docker restart gitlab-runner
```

---

## Validation finale ✅

Effectue une vérification complète :

```bash
# 1. Token dans vault
ansible-vault view --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml | grep gitlab_runner

# OUTPUT : vault_gitlab_runner_registration_token: glrt_...

# 2. Runners enregistrés dans Swarm
ssh teixei_t@172.16.248.64 "docker node ls"

# OUTPUT :
# ID                            HOSTNAME      STATUS    AVAILABILITY  MANAGER STATUS
# abc123...                     vm1           Ready     Active        Leader
# def456...                     vm2           Ready     Active
# ghi789...                     vm3           Ready     Active

# 3. Runners en ligne dans GitLab UI
# Accès : http://172.16.248.236/admin/runners
# Vérification : 3 runners avec statut ✅ online
```

**Acceptation générale ✅ :**
- Token stocké dans vault
- 3 runners actifs et en ligne
- Pas d'erreurs d'authentification

---

## Références

- [GitLab Runners Documentation](https://docs.gitlab.com/ee/ci/runners/)
- [Docker Executor](https://docs.gitlab.com/runner/executors/docker.html)
- [Runner Registration](https://docs.gitlab.com/runner/register/)
