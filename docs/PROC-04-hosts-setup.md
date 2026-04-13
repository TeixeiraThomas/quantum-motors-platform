# Procédure 4 : Configuration locale /etc/hosts ou DNS

**Date :** 2026-04-13  
**Auteur :** DevOps Setup  
**Durée estimée :** 10 min  
**Prérequis :** VM1 accessible (Traefik sur 172.16.248.64)

## Objectif

Configurer la résolution des domaines `*.quantum.local` vers l'adresse IP de Traefik (VM1) pour permettre l'accès aux services via leurs noms de domaine.

---

## Domaines à résoudre

L'infrastructure expose les domaines suivants (tous pointent vers la même IP, Traefik en gère le routage) :

| Domaine | Service | Port |
|---------|---------|------|
| `traefik.quantum.local` | Traefik Dashboard | 80 |
| `front.quantum.local` | Frontend Prod (live) | 80 |
| `api.quantum.local` | Backend Prod (live) | 80 |
| `front-green.quantum.local` | Frontend Prod Green | 80 |
| `api-green.quantum.local` | Backend Prod Green | 80 |
| `front-blue.quantum.local` | Frontend Prod Blue (standby) | 80 |
| `api-blue.quantum.local` | Backend Prod Blue (standby) | 80 |
| `preprod.quantum.local` | Frontend Preprod | 80 |
| `api-preprod.quantum.local` | Backend Preprod | 80 |
| `logs.quantum.local` | Grafana Logs | 80 |

---

## Option A : Configuration /etc/hosts (Windows, Linux, Mac)

### A.1 — Windows (WSL2 ou Hyper-V)

**Ouvre l'éditeur de host en administrateur :**

```powershell
# Ouvre Notepad en admin
Start-Process notepad -ArgumentList "C:\Windows\System32\drivers\etc\hosts" -Verb RunAs
```

**Ajoute les lignes suivantes à la fin du fichier :**

```
# Quantum Motors - Docker Swarm
172.16.248.64   quantum.local traefik.quantum.local
172.16.248.64   front.quantum.local api.quantum.local
172.16.248.64   front-green.quantum.local api-green.quantum.local
172.16.248.64   front-blue.quantum.local api-blue.quantum.local
172.16.248.64   preprod.quantum.local api-preprod.quantum.local
172.16.248.64   logs.quantum.local
```

**Sauvegarde :** Ctrl+S

**Ferme l'éditeur.**

### A.2 — Linux / macOS

**Ouvre le terminal :**

```bash
# macOS / Linux
sudo nano /etc/hosts

# OU utilise vi
sudo vi /etc/hosts
```

**Ajoute à la fin du fichier :**

```
# Quantum Motors - Docker Swarm
172.16.248.64   quantum.local traefik.quantum.local
172.16.248.64   front.quantum.local api.quantum.local
172.16.248.64   front-green.quantum.local api-green.quantum.local
172.16.248.64   front-blue.quantum.local api-blue.quantum.local
172.16.248.64   preprod.quantum.local api-preprod.quantum.local
172.16.248.64   logs.quantum.local
```

**Sauvegarde :**
- nano : Ctrl+O → Enter → Ctrl+X
- vi : Échap → `:wq` → Enter

---

## Option B : Configuration DNS dynamique (dnsmasq - optionnel)

Pour un setup plus robuste/permanent, utilise dnsmasq :

### B.1 — Installation (Linux uniquement)

```bash
# Ubuntu/Debian
sudo apt install dnsmasq

# macOS
brew install dnsmasq
```

### B.2 — Configuration

Crée un fichier de conf dédié :

```bash
# Linux
sudo nano /etc/dnsmasq.d/quantum-motors.conf

# macOS
sudo nano /usr/local/etc/dnsmasq.conf
```

Ajoute :

```
# Quantum Motors - Docker Swarm
address=/.quantum.local/172.16.248.64
```

### B.3 — Redémarre dnsmasq

```bash
# Linux (Systemd)
sudo systemctl restart dnsmasq

# macOS (Homebrew)
brew services restart dnsmasq
```

### B.4 — Configure le resolver (macOS uniquement)

```bash
# macOS : pointe vers dnsmasq
sudo mkdir -p /etc/resolver
sudo tee /etc/resolver/quantum.local > /dev/null << EOF
nameserver 127.0.0.1
EOF
```

---

## Validation

### Test 1 : Résolution DNS

Depuis ton terminal local (Windows WSL, Linux, macOS) :

```bash
# Windows CMD / PowerShell
nslookup traefik.quantum.local

# Linux / macOS
nslookup traefik.quantum.local
# OU
host traefik.quantum.local
# OU
getent hosts traefik.quantum.local
```

**Output attendu :**

```
Name:    traefik.quantum.local
Address: 172.16.248.64
```

### Test 2 : Ping

```bash
ping traefik.quantum.local

# Output attendu :
# PING traefik.quantum.local (172.16.248.64) 56(84) bytes of data.
# 64 bytes from 172.16.248.64: icmp_seq=1 ttl=64 time=2.34 ms
```

### Test 3 : Connexion HTTP

```bash
# Windows / Mac / Linux
curl http://traefik.quantum.local

# OU avec curl verbose
curl -v http://traefik.quantum.local

# Output attendu :
# HTTP/1.1 200 OK
# Content-Type: text/html
# <html>...</html> (Traefik dashboard)
```

### Test 4 : Navigateur

Ouvre un navigateur et va à :

```
http://traefik.quantum.local
```

Acceptation ✅ : Accès aux pages sans erreur DNS.

---

## Test complet (après déploiement stack)

Una fois que les playbooks Ansible sont exécutés et la stack applicative déployée :

```bash
# Test frontend preprod
curl http://preprod.quantum.local

# Test API preprod
curl http://api-preprod.quantum.local/health

# Test logs
curl http://logs.quantum.local
```

**Output attendu :** Réponses HTTP 200/301 (pas de "Host unreachable").

---

## Troubleshooting

### Erreur : "Cannot resolve host"

```
curl: (6) Could not resolve host: traefik.quantum.local
```

**Cause possible :**
- Entrées `/etc/hosts` non sauvegardées
- Cache DNS non rafraîchi
- WSL2 utilise la bonne IP réseau

**Solutions :**

#### Windows WSL2

```powershell
# Redémarre WSL
wsl --shutdown

# Puis relance WSL
```

#### Linux

```bash
# Rafraîchit le cache (si systemd-resolved)
sudo systemctl restart systemd-resolved

# Ou flush manuellement
sudo resolvectl flush-caches
```

#### macOS

```bash
# Rafraîchit le cache DNS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Erreur : "Connection timed out"

```
curl: (7) Failed to connect to traefik.quantum.local port 80
```

**Cause :** L'IP 172.16.248.64 n'est pas accessible

**Solutions :**

1. **Vérifie la connectivité réseau :**
   ```bash
   ping 172.16.248.64
   ```

2. **Vérifie que Traefik tourne :**
   ```bash
   ssh teixei_t@172.16.248.64 "docker service ls | grep traefik"
   ```

3. **Vérifie le firewall :**
   ```bash
   # Sur VM1
   sudo ufw status
   sudo ufw allow 80/tcp
   ```

### Erreur : "Bad gateway" (502)

```
HTTP/1.1 502 Bad Gateway
```

**Cause :** Traefik accessible mais pas de service backend correspondant

**Solution :** Attends que la stack soit déployée (playbooks Ansible terminés)

---

## Nettoyage / Reset

Si tu dois supprimer les entrées :

### Windows

- Notepad Admin → `C:\Windows\System32\drivers\etc\hosts`
- Supprime les 6 lignes Quantum Motors
- Ctrl+S

### Linux / macOS

```bash
# Avec nano
sudo nano /etc/hosts
# Supprimer les lignes Quantum Motors

# Ou avec sed (script)
sudo sed -i '/Quantum Motors/,+5d' /etc/hosts
```

---

## Références

- [Windows Hosts File](https://support.microsoft.com/en-us/help/15086/windows-file-locations-hosts)
- [Linux Hosts File](https://linux.die.net/man/5/hosts)
- [dnsmasq Documentation](http://www.thekelleys.org.uk/dnsmasq/doc.html)
- [Traefik DNS Setup](https://doc.traefik.io/traefik/routing/overview/)
