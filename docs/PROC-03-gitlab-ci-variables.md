# Procédure 3 : Configuration des variables CI/CD GitLab

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 20 min  
**Prérequis :** Dépôt GitLab créé, accès Admin GitLab

## Objectif

Déclarer les **9 variables d'environnement** requises par le pipeline CI/CD dans GitLab pour permettre le build, push et déploiement automatiques sur les nœuds Swarm.

---

## Variables requises

| # | Variable | Type | Exemple | Source | Masking |
|---|----------|------|---------|--------|---------|
| 1 | `CI_REGISTRY_USER` | Registry Push | `ci_registry_push` | Deploy Token | ❌ OFF |
| 2 | `CI_REGISTRY_PASSWORD` | Registry Push | `gldt_abc123...` | Deploy Token | ✅ ON |
| 3 | `REGISTRY_PULL_USER` | Registry Pull (Read-only) | `ci_registry_pull` | Deploy Token | ❌ OFF |
| 4 | `REGISTRY_PULL_PASSWORD` | Registry Pull | `gldt_def456...` | Deploy Token | ✅ ON |
| 5 | `PREPROD_DB_ROOT_PASSWORD` | Preprod DB Root | `Secure123!@#` | Généré | ✅ ON |
| 6 | `PREPROD_DB_PASSWORD` | Preprod DB User | `Secure456!@#` | Généré | ✅ ON |
| 7 | `PROD_DB_ROOT_PASSWORD` | Prod DB Root | `ProdSec789!@#` | Généré | ✅ ON |
| 8 | `PROD_DB_PASSWORD` | Prod DB User | `ProdSec012!@#` | Généré | ✅ ON |
| 9 | `BACKEND_ADMIN_PASSWORD` | Backend Admin | `AdminSec345!@#` | Généré/Vault | ✅ ON |

---

## Étape 1 : Crée les Deploy Tokens GitLab

### 1.1 — Crée le token PUSH

**Chemin UI :** Admin (couronne) → Deploy Tokens

Ou URL directe : `http://172.16.248.236/admin/deploy_tokens`

1. Clique **"New deploy token"**
2. Configure comme suit :

```
Name                : ci_registry_push
Scopes (cocher)     :
  ☑ api
  ☑ write_registry
Expires in          : 365 days (1 an)
```

3. Clique **"Create deploy token"**
4. La page affiche :
   - **username** (ex: `deploy_token_123`)
   - **token** (ex: `gldt_abc123...`)

**COPIE les deux valeurs** → Tu les utiliseras à l'étape 2.

### 1.2 — Crée le token PULL (Read-only)

1. Clique à nouveau **"New deploy token"**
2. Configure comme suit :

```
Name                : ci_registry_pull
Scopes (cocher)     :
  ☑ read_registry
Expires in          : 365 days
```

3. Clique **"Create deploy token"**
4. **COPIE username et token**

---

## Étape 2 : Génère les mots de passe

Utilise openssl pour générer des mots de passe sécurisés de 16 caractères :

```bash
# Génère 5 mots de passe différents
openssl rand -base64 16  # PREPROD_DB_ROOT_PASSWORD
openssl rand -base64 16  # PREPROD_DB_PASSWORD
openssl rand -base64 16  # PROD_DB_ROOT_PASSWORD
openssl rand -base64 16  # PROD_DB_PASSWORD
openssl rand -base64 16  # BACKEND_ADMIN_PASSWORD
```

**Exemple de résultats :**

```
PREPROD_DB_ROOT: 7xK8mN2jP5qR9vL+
PREPROD_DB_USER: 3bCd9eQ2wT6xJ1kM+
PROD_DB_ROOT:    8xL3yQ1pM9bK5nR+
PROD_DB_USER:    2dR4sT9vJ8yL3mP+
BACKEND_ADMIN:   5eU2bK9nQ7xL1jP+
```

⚠️ **Sauvegarde ces mots de passe** dans un gestionnaire de secrets (Bitwarden, LastPass, 1Password).

---

## Étape 3 : Déclare les variables dans GitLab UI

**Chemin :** Dépôt GitLab → Settings → CI/CD → Variables

Ou URL directe : `http://172.16.248.236/Quantum-Motors/-/settings/ci_cd`

### 3.1 — Ajoute les 9 variables

Pour **chaque variable** ci-dessous :

1. Clique **"Add variable"**
2. Remplis le formulaire :

```
Key             : [Variable name from table above]
Value           : [Paste the value]
Protect         : ☐ OFF (sauf pour passwords)
Mask            : ☑ ON (pour tokens/passwords)
Expand          : ☑ ON
Scope           : All
```

3. Clique **"Add variable"**
4. Répète pour les 9

---

### Variable 1 : CI_REGISTRY_USER

```
Key      : CI_REGISTRY_USER
Value    : [username du Deploy Token PUSH, ex: deploy_token_123]
Protect  : ☐ OFF
Mask     : ❌ OFF (c'est un username)
```

### Variable 2 : CI_REGISTRY_PASSWORD

```
Key      : CI_REGISTRY_PASSWORD
Value    : [token du Deploy Token PUSH, ex: gldt_abc123...]
Protect  : ☐ OFF
Mask     : ✅ ON (c'est un token)
```

### Variable 3 : REGISTRY_PULL_USER

```
Key      : REGISTRY_PULL_USER
Value    : [username du Deploy Token PULL]
Protect  : ☐ OFF
Mask     : ❌ OFF
```

### Variable 4 : REGISTRY_PULL_PASSWORD

```
Key      : REGISTRY_PULL_PASSWORD
Value    : [token du Deploy Token PULL]
Protect  : ☐ OFF
Mask     : ✅ ON
```

### Variable 5 : PREPROD_DB_ROOT_PASSWORD

```
Key      : PREPROD_DB_ROOT_PASSWORD
Value    : [mot de passe généré à l'étape 2, ex: 7xK8mN2jP5qR9vL+]
Protect  : ☐ OFF
Mask     : ✅ ON
```

### Variable 6 : PREPROD_DB_PASSWORD

```
Key      : PREPROD_DB_PASSWORD
Value    : [mot de passe généré, ex: 3bCd9eQ2wT6xJ1kM+]
Protect  : ☐ OFF
Mask     : ✅ ON
```

### Variable 7 : PROD_DB_ROOT_PASSWORD

```
Key      : PROD_DB_ROOT_PASSWORD
Value    : [mot de passe généré, ex: 8xL3yQ1pM9bK5nR+]
Protect  : ☐ OFF
Mask     : ✅ ON
```

### Variable 8 : PROD_DB_PASSWORD

```
Key      : PROD_DB_PASSWORD
Value    : [mot de passe généré, ex: 2dR4sT9vJ8yL3mP+]
Protect  : ☐ OFF
Mask     : ✅ ON
```

### Variable 9 : BACKEND_ADMIN_PASSWORD

```
Key      : BACKEND_ADMIN_PASSWORD
Value    : [mot de passe généré, ex: 5eU2bK9nQ7xL1jP+]
Protect  : ☐ OFF
Mask     : ✅ ON
```

---

## Étape 4 : Validation

Récapitulatif dans GitLab UI (Settings → CI/CD → Variables) :

```
Key                         Type        Mask  Protect
------|----------------------------------------|------
CI_REGISTRY_USER            Variable      ❌     ❌
CI_REGISTRY_PASSWORD        Variable      ✅     ❌
REGISTRY_PULL_USER          Variable      ❌     ❌
REGISTRY_PULL_PASSWORD      Variable      ✅     ❌
PREPROD_DB_ROOT_PASSWORD    Variable      ✅     ❌
PREPROD_DB_PASSWORD         Variable      ✅     ❌
PROD_DB_ROOT_PASSWORD       Variable      ✅     ❌
PROD_DB_PASSWORD            Variable      ✅     ❌
BACKEND_ADMIN_PASSWORD      Variable      ✅     ❌
```

**Acceptation ✅ :** Toutes les 9 variables présentes et visibles.

---

## Étape 5 : Teste les variables en pipeline

Pousse un commit de test :

```bash
cd /path/to/Quantum-Motors

# Crée une branche de test
git checkout -b test/ci-variables

# Modifie un fichier arbitraire
echo "# Test $(date)" >> README.md

# Commit et push
git add README.md
git commit -m "test: validate CI/CD variables"
git push origin test/ci-variables
```

Puis, dans GitLab UI :

**Dépôt → CI/CD → Pipelines**

Observe les stages :
- `test` → doit voir les variables disponibles
- `build` → build images Docker avec registry credentials
- `deploy_preprod` → utilise les variables DB

**Acceptation ✅ :** Pipeline démarre, stages `test` et `build` réussissent.

---

## Rotations de secrets

### Quand changer les variables ?

- **Deploy Tokens** : tous les 365 jours (avant expiration)
- **DB Passwords** : après un incident de sécurité
- **Admin Password** : après un incident de sécurité

### Comment changer sans interruption ?

```bash
# 1. Génère nouveau password
openssl rand -base64 16

# 2. Mets à jour dans GitLab UI (Variables)
# 3. Redeploie manuellement la stack
docker stack deploy --with-registry-auth -c deploy/preprod.yml preprod

# 4. L'ancienne instance stop progressivement (rolling update)
# 5. La nouvelle démarre avec le nouveau password
```

---

## Troubleshooting

### Erreur : "Registry authentication failed"

```
ERROR: docker build failed: no auth token available
```

**Cause :** CI_REGISTRY_USER ou CI_REGISTRY_PASSWORD manquant/incorrect

**Solution :**

```bash
# 1. Vérifie dans GitLab UI que les variables existent
# 2. Copie à nouveau le token depuis Admin → Deploy Tokens
# 3. Mets à jour CI_REGISTRY_PASSWORD
# 4. Relance le pipeline (git push ou "Run pipeline")
```

### Erreur : "Database connection refused"

```
Database connection failed: access denied for user 'quantum'
```

**Cause :** DB password variables ne match pas le déploiement précédent

**Solution :**

```bash
# ⚠️ Attention : Les données existantes seront perdues

# 1. Supprime la stack
docker stack rm preprod

# 2. Mets à jour les variables CI/CD
# 3. Relance le déploiement (git push)
# Le SQL de seed s'exécutera automatiquement
```

### Erreur : "Variable not expanded"

```
Variable ${PROD_DB_PASSWORD} not found in scope
```

**Cause :** La variable n'est pas déclarée globalement

**Solution :**

```bash
# Dans GitLab UI, vérifie que :
# - La variable est déclarée au niveau du PROJET (pas du groupe)
# - Scope : "All" (pas limité à une branche)
# - Expand : ☑ ON
```

---

## Références

- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
- [Deploy Tokens](https://docs.gitlab.com/ee/user/project/deploy_tokens/)
- [Docker Registry Authentication](https://docs.gitlab.com/ee/user/packages/container_registry/)
