# Procedure 7 : Fonctionnement via WSL

**Date :** 2026-04-22  
**Perimetre :** execution Ansible depuis WSL sur un depot stocke cote Windows  
**Note transparence IA :** cette procedure a ete structuree avec l'aide d'un assistant IA. Elle est volontairement explicite et orientee verification pour rendre les commandes auditables.

## Objectif

Cette procedure explique comment utiliser le projet Quantum Motors depuis WSL sans melanger les chemins Windows, les chemins Linux et les fichiers temporaires Vault.

Le but est de pouvoir executer les controles Ansible et les playbooks depuis WSL avec une commande stable :

```bash
bash ansible/scripts/wsl-ansible.sh <commande>
```

## Pourquoi passer par WSL

Le projet Ansible cible des VMs Debian/Linux. WSL evite plusieurs problemes rencontres depuis PowerShell :

- chemins Windows incompatibles avec certains outils Linux
- fichier Vault temporaire cree cote Windows et interprete comme executable par Ansible
- variable PowerShell `VAULT_PASS` non transmise automatiquement a WSL
- differences entre fins de ligne Windows `CRLF` et Linux `LF`
- comportement plus proche de l'environnement CI/Linux

## Scripts disponibles

Deux scripts gerent le fonctionnement WSL :

| Script | Role |
| --- | --- |
| `ansible/scripts/wsl-vault-pass.sh` | lit le mot de passe Vault depuis le fichier de secrets local |
| `ansible/scripts/wsl-ansible.sh` | configure Ansible, cree le fichier Vault temporaire Linux et lance les commandes |

Le lecteur Vault cherche par defaut le fichier :

```text
/mnt/c/ETNA/MASTER2/VMS & SERVICES.txt
```

Puis il prend la premiere ligne non vide apres le marqueur :

```text
mdp vault
```

## Commandes de preparation

Depuis WSL :

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors
```

Installer ou verifier les collections Ansible :

```bash
bash ansible/scripts/wsl-ansible.sh requirements
```

Verifier que le mot de passe Vault est lisible et que les secrets GitLab principaux se dechiffrent :

```bash
bash ansible/scripts/wsl-ansible.sh vault-check
```

Verifier la syntaxe des playbooks sans rien deployer :

```bash
bash ansible/scripts/wsl-ansible.sh syntax-check
```

## Commandes de controle reseau

Verifier que l'inventaire Ansible est parse correctement :

```bash
bash ansible/scripts/wsl-ansible.sh inventory
```

Verifier que WSL peut se connecter aux VMs par SSH :

```bash
bash ansible/scripts/wsl-ansible.sh ping
```

Si `ping` echoue, ne pas lancer les playbooks de deploiement. Corriger d'abord :

- l'acces reseau aux IPs `172.16.248.*`
- la cle SSH ou le mot de passe SSH
- le user Ansible dans `ansible/inventories/production/hosts.yml`
- le firewall ou l'etat de la VM

## Commandes de deploiement

Ces commandes modifient les VMs. Elles doivent etre lancees seulement apres `vault-check`, `syntax-check` et `ping` OK.

Provisionner le cluster Swarm, NFS, Traefik, logging et SonarQube :

```bash
bash ansible/scripts/wsl-ansible.sh infrastructure
```

Installer ou rejouer la configuration GitLab sur VM4 :

```bash
bash ansible/scripts/wsl-ansible.sh gitlab
```

Installer ou relancer les runners GitLab :

```bash
bash ansible/scripts/wsl-ansible.sh runners
```

## Token runner GitLab

Le token `vault_gitlab_runner_registration_token` n'est necessaire que si un runner doit etre enregistre pour la premiere fois.

Cas ou le token n'est pas requis :

- `/srv/gitlab-runner/config.toml` existe deja sur la VM
- le runner est deja enregistre dans GitLab
- on veut seulement s'assurer que le conteneur `gitlab-runner` tourne

Cas ou le token est requis :

- nouvelle VM
- suppression de `/srv/gitlab-runner/config.toml`
- suppression ou reset du runner dans GitLab
- recreation complete des runners

Dans ce cas, suivre `docs/PROC-02-gitlab-runner-token.md`, recuperer un nouveau token dans GitLab, puis le remettre dans `ansible/inventories/production/group_vars/vault.yml` avec Ansible Vault.

## Variables configurables

Changer le chemin du fichier de secrets :

```bash
QM_SECRETS_FILE=/mnt/c/chemin/vers/secrets.txt bash ansible/scripts/wsl-ansible.sh vault-check
```

Changer le marqueur de recherche du mot de passe Vault :

```bash
QM_VAULT_MARKER="mdp vault" bash ansible/scripts/wsl-ansible.sh vault-check
```

## Ordre recommande

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors

bash ansible/scripts/wsl-ansible.sh requirements
bash ansible/scripts/wsl-ansible.sh vault-check
bash ansible/scripts/wsl-ansible.sh syntax-check
bash ansible/scripts/wsl-ansible.sh ping

bash ansible/scripts/wsl-ansible.sh infrastructure
bash ansible/scripts/wsl-ansible.sh gitlab
bash ansible/scripts/wsl-ansible.sh runners
```

## Resultat attendu

Avant de deployer :

- `requirements` ne retourne pas d'erreur
- `vault-check` retourne `Vault OK`
- `syntax-check` affiche les trois playbooks sans erreur
- `ping` retourne `SUCCESS` pour `vm1`, `vm2`, `vm3`, `vm4`

Apres deploiement :

- Swarm est actif sur `vm1`, `vm2`, `vm3`
- GitLab est accessible sur `http://172.16.248.236`
- Traefik route les domaines `*.quantum.local`
- SonarQube, Loki et Grafana sont deployes
- les runners sont visibles dans GitLab si le token runner est configure
