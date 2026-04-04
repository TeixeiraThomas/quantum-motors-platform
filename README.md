# SPE-CLO5 / Quantum Motors

Ce depot contient l'infrastructure, les applications et la documentation du projet `Quantum Motors`.

## Documentation

- [Documentation technique vivante - Etape 0-bis](./docs/etape-0bis-documentation-technique.md)
- [Schema d'infrastructure mis a jour](./docs/etape-0bis-schema-infrastructure.md)
- [Schema historique stage 0 - Draw.io](./docs/etape-0-schema-infrastructure-quantum-motors.drawio)
- [Schema historique stage 0 - PNG](./docs/etape-0-schema-infrastructure-quantum-motors.drawio.png)

## Contenu du depot

- `ansible/`: inventories, playbooks et roles d'infrastructure
- `clo5-backend-master/`: API Node.js + Prisma
- `clo5-front-main/`: frontend Next.js
- `deploy/`: manifests Swarm pour preprod, prod blue/green et Traefik
- `tests/functional/`: smoke tests HTTP utilises par la CI
- `docker/`: initialisation MariaDB pour l'environnement local

## Architecture cible

- `VM1`: Docker Swarm manager, Traefik, point d'entree HTTP, export NFS
- `VM2`: worker Swarm, base de donnees MariaDB preprod/prod via volumes NFS
- `VM3`: worker Swarm, SonarQube, runner GitLab
- `VM4`: GitLab CE en bare metal, registry GitLab

La description detaillee, les choix techniques, les procedures et les variables attendues sont documentes dans [`docs/etape-0bis-documentation-technique.md`](./docs/etape-0bis-documentation-technique.md).

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
