# Etape 0-bis - Schema d'infrastructure

Etat documente le `2026-04-04`.

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
        VM3[VM3\nWorker\nSonarQube]
    end

    TraefikHost[traefik.quantum.local\nfront.quantum.local\napi.quantum.local\npreprod.quantum.local] --> VM1

    VM1 --> PublicNet[public overlay]
    VM1 --> PreprodNet[preprod_net]
    VM1 --> ProdNet[prod_net]
    VM2 --> PreprodNet
    VM2 --> ProdNet
    VM3 --> PublicNet

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
```

## Repartition des VMs

| VM | Role principal | Services |
| --- | --- | --- |
| `VM1` | Swarm manager | Traefik, runner GitLab, export NFS |
| `VM2` | Swarm worker | runner GitLab, MariaDB preprod/prod |
| `VM3` | Swarm worker | SonarQube, runner GitLab |
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

## Evolutions majeures par rapport a l'etape 0

- ajout du cluster `Docker Swarm` sur `VM1`, `VM2`, `VM3`
- ajout de `SonarQube` sur le cluster
- ajout de `GitLab CE` sur `VM4`
- ajout de `GitLab Runner` sur les noeuds Swarm
- ajout de `Traefik` pour l'entree HTTP et le blue/green
- ajout d'un stockage `NFS` pour la persistance MariaDB
- ajout des environnements `preprod`, `prod blue` et `prod green`
