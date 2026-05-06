# SPE-CLO5 / Quantum Motors

Ce depot contient l'infrastructure, les applications et la documentation du projet `Quantum Motors`.

## Documentation

- [Guide debutant complet - comprendre, verifier et presenter le projet](./docs/PROC-06-guide-debutant-complet.md)
- [Documentation technique vivante - Etape 0-bis](./docs/etape-0bis-documentation-technique.md)
- [Schema d'infrastructure mis a jour](./docs/etape-0bis-schema-infrastructure.md)
- [Fonctionnement via WSL](./docs/PROC-07-wsl-workflow.md)
- [Schema historique stage 0 - Draw.io](./docs/etape-0-schema-infrastructure-quantum-motors.drawio)
- [Schema historique stage 0 - PNG](./docs/etape-0-schema-infrastructure-quantum-motors.drawio.png)

## Parcours de lecture recommande

1. Lire le guide debutant complet pour comprendre le projet sans prerequis.
2. Lire ensuite le schema d'infrastructure courant pour visualiser la repartition des VMs et des flux.
3. Lire la documentation technique vivante pour les choix d'architecture, les variables, les procedures et la validation.
4. Consulter enfin `ansible/`, `deploy/` et `.gitlab-ci.yml`, qui sont la source de verite executable du projet.

## Contenu du depot

- `ansible/`: inventories, playbooks et roles d'infrastructure
- `clo5-backend-master/`: API Node.js + Prisma
- `clo5-front-main/`: frontend Next.js
- `deploy/`: manifests Swarm pour preprod, prod blue/green, Traefik et logging
- `tests/functional/`: smoke tests HTTP utilises par la CI
- `docker/`: initialisation MariaDB pour l'environnement local

## Architecture cible

- `VM1`: Docker Swarm manager, Traefik, point d'entree HTTP, export NFS
- `VM2`: worker Swarm, base de donnees MariaDB preprod/prod via volumes NFS
- `VM3`: worker Swarm, SonarQube, Loki, Grafana, runner GitLab
- `VM4`: GitLab CE en bare metal, registry GitLab

La description detaillee, les choix techniques, les procedures et les variables attendues sont documentes dans [`docs/etape-0bis-documentation-technique.md`](./docs/etape-0bis-documentation-technique.md).

Avant de lancer `ansible/playbooks/gitlab.yml`, pensez a remplacer les placeholders de `gitlab_admin_users` par les vrais logins des intervenants dans [`ansible/inventories/production/group_vars/all.yml`](./ansible/inventories/production/group_vars/all.yml).

## Commandes Ansible

Toutes les commandes Ansible doivent être exécutées depuis la racine du dépôt avec la configuration appropriée :

### Usage WSL recommande

Depuis WSL, utilise le wrapper du depot. Il lit automatiquement le mot de passe Vault dans `/mnt/c/ETNA/MASTER2/VMS & SERVICES.txt`, juste apres le marqueur `mdp vault`, en ignorant les lignes vides.

Cette section WSL a ete structuree avec l'aide d'un assistant IA afin de rendre le flux reproductible et verifiable. Le detail complet est dans [`docs/PROC-07-wsl-workflow.md`](./docs/PROC-07-wsl-workflow.md).

```bash
cd /mnt/c/ETNA/MASTER2/Quantum-Motors

bash ansible/scripts/wsl-ansible.sh requirements
bash ansible/scripts/wsl-ansible.sh vault-check
bash ansible/scripts/wsl-ansible.sh syntax-check
bash ansible/scripts/wsl-ansible.sh ping

# Deploiements
bash ansible/scripts/wsl-ansible.sh infrastructure
bash ansible/scripts/wsl-ansible.sh gitlab
bash ansible/scripts/wsl-ansible.sh runners
```

Note : le token d'enregistrement runner GitLab n'est requis que si `/srv/gitlab-runner/config.toml` n'existe pas encore sur les VMs. Pour recreer des runners depuis zero, recupere un nouveau token GitLab et remets `vault_gitlab_runner_registration_token` dans Vault avec la procedure 2.

Si ton fichier de secrets est ailleurs :

```bash
QM_SECRETS_FILE=/mnt/c/chemin/vers/secrets.txt bash ansible/scripts/wsl-ansible.sh vault-check
```

### Commandes manuelles

```bash
# Exemple de syntaxe correcte
cd /mnt/c/ETNA/MASTER2/Quantum-Motors  # ou votre chemin local
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-galaxy collection install -r ansible/requirements.yml
ANSIBLE_CONFIG=ansible/ansible.cfg ansible-playbook ansible/playbooks/infrastructure.yml --syntax-check
```

Voir [`docs/PROCEDURES.md`](./docs/PROCEDURES.md) pour le guide complet de déploiement.

## Maintenance documentaire

La documentation de `docs/` doit etre mise a jour a chaque evolution significative:

- ajout ou suppression d'un service
- changement de role sur une VM
- ajout d'un reseau, volume ou domaine
- changement de procedure de deploiement ou de CI/CD
- ajout d'un composant d'observabilite, de reverse proxy ou de registry

## Execution locale

Pour lancer la stack locale:

```powershell
docker compose up --build -d
```

Points d'acces:

- frontend: `http://127.0.0.1:4200`
- backend: `http://127.0.0.1:3000`

Pour arreter la stack:

```powershell
docker compose down
```
