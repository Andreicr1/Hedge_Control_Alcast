# Alcast Hedge Control – README Corporativo

## Visão geral
Plataforma corporativa para gestão de POs/SOs, RFQs, hedges (MTM), contrapartes e KYC/KYP. Backend em FastAPI + PostgreSQL, frontend em React/Vite, com perfis RBAC (admin, compras, vendas, financeiro, estoque) e autenticação JWT.

## Stack
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL (SQLite apenas para testes), JWT.
- Frontend: React 18, Vite, Tailwind/Radix/MUI.

## Ambientes
- Dev: uso local com Docker Postgres (porta 5433) e `.env` próprio.
- Stage/Prod: `.env` separados, secrets fortes, CORS restrito, mocks desativados.

## Backend
### Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --port 8000
```

### Variáveis (.env)
- DATABASE_URL=postgresql+psycopg://user:password@host:5433/alcast_db
- SECRET_KEY=<valor forte>
- API_V1_STR=/api/v1
- BACKEND_CORS_ORIGINS=["http://localhost:5173","https://<seu-dominio>"]
- STORAGE_DIR=storage

### Logs
- Logging básico estruturado (startup, RFQ criação/envio, root health).
- Exceções via uvicorn; ajustar nível via LOGGING config se necessário.

### Migrações
- Aplicar: `cd backend && alembic upgrade head`
- Seeds: criar usuários via `/auth/signup` (role admin para gerir). Documente seeds usados em ambientes compartilhados.

## Frontend
### Setup
```bash
npm install
npm run dev -- --host --port 5173
```

### Variáveis (.env)
- VITE_API_URL=http://localhost:8000
- VITE_API_PREFIX=/api/v1
- VITE_USE_MOCK_DATA=false (true apenas para demos sem backend)

### Comandos
- Dev: `npm run dev -- --host --port 5173`
- Build: `npm run build`
- Teste smoke: `npm run test`

## Execução conjunta
```bash
bash run-dev.sh
```

## Mocks x Produção
- Frontend: `VITE_USE_MOCK_DATA=true` usa `src/contexts/mockData.ts` e ignora backend (não usar em prod).
- Backend: KYC/credit check é mock (documentar ao negócio).

## Backups e retenção (recomendação mínima)
- Banco: backup diário (pg_dump) com retenção de 30 dias; armazenar em bucket seguro.
- Storage uploads: snapshots semanais do diretório `storage/` (ou volume) com retenção de 30 dias.

## Observabilidade
- Logs estruturados básicos; health em `GET /`.
- Sem tracing distribuído; adicionar se requerido pelo ambiente.

## Dependências
- Backend: `requirements.txt` + `pytest` (tests). Considerar lockfile para produção (pip-tools/poetry) se a política exigir.
- Frontend: package.json com scripts e Vitest para smoke; rodar `npm install` consistente (usar lockfile do gerenciador escolhido).

## Políticas e governança
- Siga `AI_CONTEXT.md` para regras de contribuição e decisões.
- Não exponha secrets em commits.
- Mantenha migrações sincronizadas entre ambientes (dev/stage/prod).

## Contatos e handover
- Documentar credenciais de serviços (em vault seguro) e endpoints usados por ambiente.
- Checklist de handover: `.env` de cada ambiente, comandos de deploy, política de backup, seeds de usuários admin.
