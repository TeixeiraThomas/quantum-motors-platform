# Etape 0-bis - Schema d'infrastructure

Etat documente le `2026-04-09`.

## Statut du document

- ce schema Markdown/Mermaid est la representation courante de l'infrastructure
- les fichiers Draw.io et PNG de l'etape 0 sont conserves comme archive du schema initial
- toute evolution significative de l'infrastructure doit etre repercutee ici avant demande de validation

## Vue d'ensemble

```mermaid
flowchart LR
    Dev[Developpeurs] --> GitLab[VM4 GitLab CE and Registry]
    GitLab --> R1[VM1 Runner and Swarm manager]
    GitLab --> R2[VM2 Runner and Swarm worker]
    GitLab --> R3[VM3 Runner and Swarm worker]

    subgraph Swarm[Cluster Docker Swarm]
        VM1[VM1\nManager\nTraefik\nNFS server]
        VM2[VM2\nWorker\nMariaDB preprod or prod]
        VM3[VM3\nWorker\nSonarQube\nLoki\nGrafana]
    end

    TraefikHost[traefik.quantum.local\nfront.quantum.local\napi.quantum.local\npreprod.quantum.local\nlogs.quantum.local] --> VM1

    VM1 --> PublicNet[public overlay]
    VM1 --> PreprodNet[preprod_net]
    VM1 --> ProdNet[prod_net]
    VM1 --> LogsNet[logs_net]
    VM2 --> PreprodNet
    VM2 --> ProdNet
    VM2 --> LogsNet
    VM3 --> PublicNet
    VM3 --> LogsNet

    PublicNet --> FrontPreprod[front-preprod]
    PublicNet --> ApiPreprod[api-preprod]
    PublicNet --> FrontBlue[front-prod-blue]
    PublicNet --> ApiBlue[api-prod-blue]
    PublicNet --> FrontGreen[front-prod-green]
    PublicNet --> ApiGreen[api-prod-green]

    PreprodNet --> DbPreprod[mariadb-preprod]
    PreprodNet --> ApiPreprod
    PreprodNet --> FrontPreprod

    ProdNet --> DbProd[mariadb-prod]
    ProdNet --> ApiBlue
    ProdNet --> FrontBlue
    ProdNet --> ApiGreen
    ProdNet --> FrontGreen

    NFS[(NFS exports on VM1)] --> DbPreprod
    NFS --> DbProd

    LogsNet --> Alloy1[alloy global]
    LogsNet --> Alloy2[alloy global]
    LogsNet --> Alloy3[alloy global]
    LogsNet --> Loki[Loki log server]
    PublicNet --> GrafanaLogs[grafana-logs]
```

## Repartition des VMs

| VM | Role principal | Services |
| --- | --- | --- |
| `VM1` | Swarm manager | Traefik, runner GitLab, export NFS |
| `VM2` | Swarm worker | runner GitLab, MariaDB preprod/prod |
| `VM3` | Swarm worker | SonarQube, Loki, Grafana, runner GitLab |
| `VM4` | Hors cluster | GitLab CE, registry GitLab |

## Domaines utilises

- `preprod.quantum.local`
- `api-preprod.quantum.local`
- `front-blue.quantum.local`
- `api-blue.quantum.local`
- `front-green.quantum.local`
- `api-green.quantum.local`
- `front.quantum.local`
- `api.quantum.local`
- `traefik.quantum.local`
- `logs.quantum.local`

## Evolutions majeures par rapport a l'etape 0

- ajout du cluster `Docker Swarm` sur `VM1`, `VM2`, `VM3`
- ajout de `SonarQube` sur le cluster
- ajout de `GitLab CE` sur `VM4`
- ajout de `GitLab Runner` sur les noeuds Swarm
- ajout de `Traefik` pour l'entree HTTP et le blue/green
- ajout d'un stockage `NFS` pour la persistance MariaDB
- ajout d'une centralisation des logs via `Loki`, `Grafana` et `Grafana Alloy`
- ajout des environnements `preprod`, `prod blue` et `prod green`

## Regles de mise a jour

Mettre a jour ce schema a minima lors de l'un des changements suivants:

- nouvelle VM ou changement de role d'une VM
- ajout ou suppression d'un service
- ajout d'un nouveau reseau overlay ou d'un stockage partage
- changement du point d'entree HTTP ou des domaines exposes
- evolution du mode de deploiement applicatif
