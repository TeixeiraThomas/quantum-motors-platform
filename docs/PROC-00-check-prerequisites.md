# Procédure 0 : Vérifier les prérequis système

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 15 min

## Objectif

Valider que tous les prérequis système sont en place avant de lancer les playbooks Ansible.

---

## Checklist prérequis

### Infrastructure VMs

#### ✅ 4 VMs Debian 12 opérationnelles

```bash
# Depuis ta machine locale, teste la connectivité

# VM1 (manager Swarm)
ssh -v teixei_t@172.16.248.64 "lsb_release -a"
# Output : Debian GNU/Linux 12

# VM2 (worker Swarm)
ssh -v teixei_t@172.16.248.92 "lsb_release -a"

# VM3 (worker Swarm)
ssh -v touahr_s@172.16.248.97 "lsb_release -a"

# VM4 (GitLab)
ssh -v touahr_s@172.16.248.236 "lsb_release -a"
```

Acceptation ✅ : 4 connexions SSH réussies, Debian 12 confirmé.

#### ✅ Hostnames uniques et documentés

```bash
# Sur chaque VM, vérifie le hostname

ssh teixei_t@172.16.248.64 "hostname"
# Output exemple : TIC-CLO5-VM1

ssh teixei_t@172.16.248.92 "hostname"
# Output : TIC-CLO5-VM2

ssh touahr_s@172.16.248.97 "hostname"
# Output : TIC-CLO5-VM3

ssh touahr_s@172.16.248.236 "hostname"
# Output : TIC-CLO5-VM4
```

Ou définir les hostnames si nécessaire :

```bash
# Sur VM1, en tant que root ou sudo
ssh teixei_t@172.16.248.64 "sudo hostnamectl set-hostname TIC-CLO5-VM1"
ssh teixei_t@172.16.248.64 "sudo hostnamectl status"
```

Acceptation ✅ : Chaque VM a un hostname unique.

#### ✅ Accès sudo / root sans password

```bash
# Test sudo sans prompt password
ssh -v teixei_t@172.16.248.64 "sudo whoami"

# Si prompt password → configure sudoers
ssh teixei_t@172.16.248.64 "sudo visudo"
# Ajoute à la fin :
# teixei_t ALL=(ALL) NOPASSWD: ALL
# touahr_s ALL=(ALL) NOPASSWD: ALL
```

Ou, alternative : utilise `--ask-become-pass` dans Ansible.

#### ✅ Réseau 172.16.248.0/24 accessible

```bash
# Teste la connectivité réseau
ping 172.16.248.64
ping 172.16.248.92
ping 172.16.248.97
ping 172.16.248.236

# Si aucun ping : configure la route sur ta machine
# (dépend de ton hyperviseur : Hyper-V, KVM, VirtualBox, etc.)
```

Acceptation ✅ : Tous les pings réussissent.

#### ✅ Ports ouverts (firewall)

```bash
# Sur chaque VM, vérifie quels ports sont fermés/ouverts

ssh teixei_t@172.16.248.64 "sudo ufw status"

# Si rien n'est ouvert : configure UFW
ssh teixei_t@172.16.248.64 << 'EOSSH'
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP (Traefik)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw allow 2376/tcp  # Docker daemon SSL
  sudo ufw allow 2377/tcp  # Swarm manager
  sudo ufw allow 3306/tcp  # MySQL
  sudo ufw allow 5050/tcp  # GitLab Registry
  sudo ufw allow 9000/tcp  # SonarQube
  sudo ufw allow 3100/tcp  # Loki
  sudo ufw allow 3000/tcp  # Grafana
  sudo ufw enable
EOSSH
```

Acceptation ✅ : Ports 22, 80, 443, 2377, 3306, 5050 accessibles.

### Machine locale

#### ✅ Ansible 2.10+ installé

```bash
# MacOS
brew install ansible

# Linux (Debian/Ubuntu)
sudo apt install ansible

# Ou Python pip
pip install ansible==2.10.7  # min version

# Vérifie
ansible --version
# Output : ansible [core 2.14.3]
```

Acceptation ✅ : `ansible --version` retourne 2.10+

#### ✅ Collections Ansible installées

```bash
# Installe les collections requises par les roles du depot
ansible-galaxy collection install -r ansible/requirements.yml

# Vérifie
ansible-galaxy collection list | grep community.docker
```

Acceptation ✅ : Collection `community.docker` visible.

#### ✅ Python 3.8+ et modules

```bash
python --version
# Output : Python 3.8+

# Installe les modules requis
pip install docker PyYAML paramiko jinja2 netaddr

# Ou depuis requirements.txt
pip install -r requirements.txt  # si existant
```

Acceptation ✅ : `python --version` 3.8+, modules disponibles.

#### ✅ SSH key configuré (optionnel mais recommandé)

```bash
# Générer une clé SSH si absente
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copier la clé publique vers chaque VM
ssh-copy-id -i ~/.ssh/id_rsa.pub teixei_t@172.16.248.64
ssh-copy-id -i ~/.ssh/id_rsa.pub teixei_t@172.16.248.92
ssh-copy-id -i ~/.ssh/id_rsa.pub touahr_s@172.16.248.97
ssh-copy-id -i ~/.ssh/id_rsa.pub touahr_s@172.16.248.236

# TEST
ssh teixei_t@172.16.248.64 "hostname"
# Doit réussir WITHOUT password prompt
```

Acceptation ✅ : SSH sans password prompt vers toutes VMs.

#### ✅ Clonage du dépôt

```bash
# Clone le dépôt
git clone http://172.16.248.236/Quantum-Motors.git
cd Quantum-Motors

# Vérifie que les dossiers existent
ls -la ansible/
ls -la ansible/playbooks/
ls -la ansible/roles/
ls -la deploy/
```

Acceptation ✅ : Dépôt cloné, tous dossiers présents.

#### ✅ Git configuré (optionnel pour pull/push)

```bash
git config --global user.name "Ton Nom"
git config --global user.email "email@example.com"
```

---

## Checklist configuration Ansible

### ✅ Inventaire valide

```bash
cd /path/to/Quantum-Motors

# Valide la syntaxe
ansible-inventory -i ansible/inventories/production/hosts.yml --list | head -20

# Ping all hosts
ansible all -i ansible/inventories/production/hosts.yml -m ping

# Output attendu :
# vm1 | SUCCESS => { ... "ping": "pong" }
# vm2 | SUCCESS => { ... "ping": "pong" }
# ...
```

Acceptation ✅ : Ping réussit pour tous hosts.

### ✅ Variables d'inventaire

```bash
# Vérifie que toutes les variables existent

# Vérifie docker_packages
ansible all -i ansible/inventories/production/hosts.yml \
  -m debug -a "var=docker_packages" | grep -A10 "docker_packages"

# Vérifie overlay_networks
ansible all -i ansible/inventories/production/hosts.yml \
  -m debug -a "var=overlay_networks" | grep -A10 "overlay_networks"

# Vérifie gitlab_admin_users
ansible all -i ansible/inventories/production/hosts.yml \
  -m debug -a "var=gitlab_admin_users" | grep -A10 "gitlab_admin_users"
```

Acceptation ✅ : Toutes les variables présentes et non-nulles.

### ✅ Ansible Vault configuré

```bash
# Crée le fichier password (ou restaure depuis secrétaire)
echo "TON_PASSWORD_SECRET" > ~/.vault_pass
chmod 600 ~/.vault_pass

# Valide le accès vault
ansible-vault view \
  --vault-password-file=~/.vault_pass \
  ansible/inventories/production/group_vars/vault.yml | head -5

# Acceptation ✅ : Aucune erreur "Bad vault password"
```

#### Variante WSL

Depuis WSL, le depot fournit un wrapper qui evite les problemes de chemins Windows et de variable `VAULT_PASS` non transmise a WSL :

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors

bash ansible/scripts/wsl-ansible.sh vault-check
bash ansible/scripts/wsl-ansible.sh syntax-check
```

Le wrapper lit par defaut `/mnt/c/ETNA/MASTER2/VMS & SERVICES.txt`. Si le fichier est ailleurs :

```bash
QM_SECRETS_FILE=/mnt/c/chemin/vers/secrets.txt bash ansible/scripts/wsl-ansible.sh vault-check
```

---

## Checklist syntaxe Ansible

### ✅ Playbooks syntactiquement corrects

```bash
cd /path/to/Quantum-Motors

# Vérifie infrastructure.yml
ansible-playbook ansible/playbooks/infrastructure.yml \
  --syntax-check --vault-password-file=~/.vault_pass

# Output attendu :
# playbook: ansible/playbooks/infrastructure.yml
# (pas d'erreur)

# Vérifie gitlab.yml
ansible-playbook ansible/playbooks/gitlab.yml \
  --syntax-check --vault-password-file=~/.vault_pass

# Vérifie runners.yml
ansible-playbook ansible/playbooks/runners.yml \
  --syntax-check --vault-password-file=~/.vault_pass
```

Acceptation ✅ : Tous playbooks passe `--syntax-check`.

### ✅ Rôles syntactiquement corrects

```bash
# Option 1 : ansible-lint (si installé)
pip install ansible-lint
ansible-lint ansible/roles/

# Option 2 : Essai à sec
ansible-playbook ansible/playbooks/infrastructure.yml \
  --check \
  --vault-password-file=~/.vault_pass \
  -i ansible/inventories/production/hosts.yml

# Output : "changed=0" (idéal pour --check)
```

Acceptation ✅ : Pas d'erreur lint ou rôles invalides.

---

## Checklist réseau et domaines

### ✅ Accès HTTP/HTTPS

```bash
# Teste l'accès à GitLab VM4
curl -I http://172.16.248.236

# Output attendu :
# HTTP/1.1 302 Found  (redirect vers login)

# OU (si GitLab pas encore installé)
curl: (7) Failed to connect
# C'est OK, GitLab sera installé par Ansible
```

### ✅ /etc/hosts local configuré (optionnel avant déploiement)

```bash
# Ajoute les entrées test (ou une fois Traefik up)
sudo nano /etc/hosts

# Ajoute (exemple) :
172.16.248.64   traefik.quantum.local

# Sauvegarde
sudo systemctl restart systemd-resolved  # Linux
# OU macOS :
sudo dscacheutil -flushcache
```

---

## Résumé final

Crée un texte récap pour la soutenance :

```markdown
## Prérequis validés

Date : 2026-04-13

✅ Infrastructure
   - 4 VMs Debian 12 opérationnelles
   - Hostnames uniques : TIC-CLO5-VM1/2/3/4
   - Réseau 172.16.248.0/24 accessible
   - Ports firewall ouverts

✅ Machine locale
   - Ansible 2.10+ + community.docker
   - SSH key sans password vers toutes VMs
   - Dépôt cloné localement

✅ Configuration Ansible
   - Inventaire valide
   - Variables complètes
   - Vault password configuré
   - Playbooks + Rôles syntaxiquement OK

✅ Réseau
   - Accès HTTP/HTTPS à VMs
   - Domaines seront configurés après Traefik

### Status : ✅ READY FOR DEPLOYMENT
```

---

## Troubleshooting prérequis

### "SSH connection refused"

```
ssh_exception.NoValidConnectionsError: No addresses found for ...
```

**Cause :** IP VM inaccessible

**Solution :**

```bash
# Vérifie l'IP réelle
ping 172.16.248.64

# Ou adapte l'inventaire si IP différente
nano ansible/inventories/production/hosts.yml
```

### "ansible-galaxy: command not found"

```
Solution : pip install ansible
```

### "Vault password incorrect"

```
ERROR! Vault password provided is incorrect
```

**Cause :** Mauvais password fichier

**Solution :**

```bash
# Récupère le bon password depuis le gestionnaire de secrets
# Recrée ~/.vault_pass avec le bon password
echo "BON_PASSWORD" > ~/.vault_pass
```

### "Python 3 required"

```
Solution : pip install -r requirements.txt (ou pip3 install ...)
```

---

## Références

- [Ansible Installation](https://docs.ansible.com/ansible/latest/installation_guide/index.html)
- [Debian Firewall (UFW)](https://wiki.debian.org/UncomplicatedFirewall)
- [SSH Key Setup](https://www.ssh.com/ssh/keygen)
