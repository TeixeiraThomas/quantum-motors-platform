# Quantum Motors Platform

A complete infrastructure and application platform for the Quantum Motors project. The repository brings together the web applications, deployment automation, observability stack and the technical documentation required to operate the platform.

## Repository Overview

- `ansible/`: infrastructure inventories, playbooks and roles
- `clo5-backend-master/`: Node.js API with Prisma and database integration
- `clo5-front-main/`: Next.js frontend
- `deploy/`: Docker Swarm deployment manifests for pre-production and blue/green production environments
- `docker/`: local database initialization assets
- `docs/`: architecture, procedures, CI/CD and operations runbooks
- `tests/`: functional and smoke-test tooling

## Architecture

The documented target architecture uses Docker Swarm, Traefik, MariaDB, GitLab CI/CD, a container registry and an observability layer built around monitoring and centralized logging. The deployment model separates application workloads, data services, CI runners and platform services.

## Local Stack

Requirements: Docker and Docker Compose.

```bash
docker compose up --build -d
```

Typical local endpoints:

- Frontend: `http://127.0.0.1:4200`
- Backend: `http://127.0.0.1:3000`

Stop the stack with:

```bash
docker compose down
```

## Infrastructure Workflow

Ansible procedures, Vault setup, CI/CD configuration, monitoring and production runbooks are documented in `docs/`. Read the prerequisite and security procedures before running any playbook against a real environment.

## Configuration and Security

Copy the provided example environment files and supply secrets through a secure local mechanism. Real `.env` files, credentials, Vault passwords, private keys and production configuration must never be committed.

## Status

Academic infrastructure and full-stack engineering project developed as part of the ETNA curriculum.