# Procédure 1 : Initialisation Ansible Vault

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 10 min

## Objectif

Configurer le mot de passe Ansible Vault pour sécuriser les secrets du projet (mots de passe GitLab, tokens runners, etc.).

## Prérequis

- Ansible 2.10+ installé localement
- Clone du dépôt Quantum-Motors
- Accès en écriture au dépôt

## ⚠️ Important : Sécurité

**Ne commitez JAMAIS le fichier `.vault_pass`**. Ajoute-le à `.gitignore` :

```bash
echo ".vault_pass" >> .gitignore
git add .gitignore
git commit -m "chore: add vault_pass to gitignore"
```

---

## Étapes

### 1.1 — Crée le fichier password local

Sur ta machine locale (Windows WSL, Mac, Linux) :

```bash
# Crée le répertoire s'il n'existe pas
mkdir -p ~/.ansible

# Génère un mot de passe sécurisé (ou utilise une passphrase)
# Option A : Utilise une passphrase que tu mémorises
echo "TON_MOT_DE_PASSE_SECRET_ICI" > ~/.vault_pass
chmod 600 ~/.vault_pass

# Option B : Génère aléatoirement (puis sauvegarde dans un gestionnaire de secrets)
openssl rand -base64 32 > ~/.vault_pass
chmod 600 ~/.vault_pass
```

⚠️ **Partage ce mot de passe UNIQUEMENT via un canal sécurisé** (Bitwarden, LastPass, etc.)

### 1.2 — Configure Ansible

Ajoute au fichier `ansible/ansible.cfg` :

```ini
[defaults]
...
vault_password_file = ~/.vault_pass
```

Ou utilise l'option CLI à chaque fois :

```bash
ansible-playbook playbooks/infrastructure.yml \
  --vault-password-file=~/.vault_pass
```

### 1.3 — Édite le vault existant

```bash
cd /path/to/Quantum-Motors

# Édite le fichier vault (hashé automatiquement)
ansible-vault edit \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml
```

Cette commande :
- ✅ Déchiffre le fichier temporairement
- ✅ L'ouvre dans `$EDITOR` (nano, vim, etc.)
- ✅ Le re-chiffre à la fermeture

### 1.4 — Valide le contenu

```bash
# Affiche le contenu déchiffré (ne le commit PAS)
ansible-vault view \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml
```

Résultat attendu :

```yaml
vault_gitlab_root_password: MaPassePwd123!
vault_gitlab_prof_password: ProfPass456!
vault_gitlab_runner_registration_token: glrt_AbCd123XyZ...
```

---

## Ajouter une nouvelle variable au vault

```bash
# Édite le vault
ansible-vault edit \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml

# Ajoute une ligne (format YAML) :
vault_ma_nouvelle_variable: valeur_secrete

# Sauvegarde : Ctrl+D ou Ctrl+O puis Ctrl+X
```

Puis dans les playbooks, référence-la :

```yaml
- name: Utilise la variable
  debug:
    msg: "{{ vault_ma_nouvelle_variable }}"
  no_log: true  # Ne log pas la valeur
```

---

## Éditer en mode batch (Ansible playbook)

Au lieu d'éditer manuellement, tu peux mettre à jour en mode playbook :

```bash
# Crée un playbook temporaire
cat > /tmp/update_vault.yml << 'EOF'
- name: Update vault
  hosts: localhost
  gather_facts: false
  vars_files:
    - ansible/inventories/production/group_vars/vault.yml
  tasks:
    - name: Print current vault variables
      debug:
        var: vault_gitlab_root_password
      no_log: true
EOF

# Exécute avec vault password
ansible-playbook /tmp/update_vault.yml \
  --vault-password-file=~/.vault_pass
```

---

## Troubleshooting

### Erreur : "Vault password error"

```
ERROR! Vault password file could not be found at ~/.vault_pass
```

**Solution :**

```bash
# Créer le fichier s'il manque
echo "TON_PASSWORD" > ~/.vault_pass
chmod 600 ~/.vault_pass
```

### Erreur : "Bad decrypt"

```
ERROR! Bad vault password
```

**Solution :**

```bash
# Le mot de passe ne correspond pas au vault.yml
# Vérifie que tu utilises le MÊME mot de passe qu'avant
# Si c'est perdu : il faut re-encoder le vault

# Sauvegarde l'ancien vault (hashé)
cp ansible/inventories/production/group_vars/vault.yml \
   ansible/inventories/production/group_vars/vault.yml.bak

# Re-crée avec le nouveau password
ansible-vault rekey \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml

# Entrée le NEW password 2x
```

### Erreur : "command not found: ansible-vault"

```
Solution : Installe Ansible
pip install ansible
```

---

## Exportation pour un pair

Si tu dois partager les secrets avec un pair :

```bash
# Génère une clé symétrique sécurisée
openssl rand -base64 32

# Partage cette clé via Signal/Telegram, PAS via email/Slack
# Ton pair crée ~/.vault_pass avec cette clé
# Puis peut exécuter les playbooks Ansible
```

---

## Validation ✅

Exécute :

```bash
ansible-vault view \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml | grep vault_

# Résultat : toutes les variables vault visibles
```

Acceptation : Aucune erreur, contenu lisible ✅

---

## Références

- [Ansible Vault Documentation](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
- [Best Practices for Vault](https://docs.ansible.com/ansible/latest/user_guide/vault_securing_vault.html)
