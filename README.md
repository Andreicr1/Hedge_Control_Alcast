# Alcast Hedge Control

## Overview

Corporate platform for managing purchase and sales orders (PO/SO),
risk exposures, RFQs, hedging decisions and MTM valuation.

The system is designed to support financial governance,
risk visibility and decision-making in commodities operations,
with clear separation of responsibilities between
Purchases, Sales and Finance.

## Core Capabilities

- PO/SO lifecycle management.
- Automatic generation of passive (PO) and active (SO) exposures.
- Time-based exposure consolidation by commodity and period.
- Manual, governed hedging with partial or total coverage.
- Net exposure calculation.
- Mark-to-Market (MTM) with immutable historical snapshots.
- RFQ management and multi-counterparty quote comparison.
- Role-based access control (RBAC).

## Architecture

- Backend: FastAPI, SQLAlchemy, PostgreSQL.
- Frontend: React (Vite).
- Authentication: JWT with RBAC.
- Persistence: Relational database with migrations.

## Environments

The system supports isolated environments (dev, stage, prod),
with environment-specific configuration and secrets.

Runtime setup, environment variables and operational procedures
are documented outside this README.

## Documentation Governance

The following files are the ONLY authoritative sources of truth:

- README.md — project overview (this file)
- AI_CONTEXT.md — rules for development and AI agents
- PROJECT_STATE.md — current product state and completed milestones
- SPRINTS.md — sprint history and closed decisions

All other documentation must be considered non-authoritative
unless explicitly referenced.

## Development & Operations

Detailed setup instructions, environment variables,
deployment procedures, backups and operational runbooks
are intentionally excluded from this README.

Refer to the appropriate documentation under `/docs`
or to the files listed above.

## Contribution Rules

- Follow the principles defined in `AI_CONTEXT.md`.
- Do not introduce demo-only behavior without explicit documentation.
- Do not commit secrets or environment-specific credentials.
- Keep domain logic and product behavior consistent across environments.
