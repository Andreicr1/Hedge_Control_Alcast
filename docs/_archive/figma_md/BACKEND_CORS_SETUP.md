# 🔧 Configuração de CORS no Backend FastAPI

Para que o frontend consiga se comunicar com o backend, é necessário configurar **CORS (Cross-Origin Resource Sharing)** no FastAPI.

---

## 📝 Configuração Necessária

Adicione o seguinte código no arquivo `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Alcast Hedge Control API",
    description="API para gestão de POs, SOs, RFQs e MTM",
    version="1.0.0"
)

# ========================================
# CONFIGURAÇÃO DE CORS
# ========================================
# Lista de origens permitidas
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://localhost:3000",      # Possível outro frontend
    "http://127.0.0.1:5173",      # Alternativa localhost
    "https://hedge-control.vercel.app",  # Produção (ajuste conforme necessário)
]

# Adicionar middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Origens permitidas
    allow_credentials=True,         # Permitir cookies/auth
    allow_methods=["*"],            # Permitir todos os métodos (GET, POST, etc.)
    allow_headers=["*"],            # Permitir todos os headers
)

# ... resto do código
```

---

## 🎯 Explicação

### `allow_origins`
Lista de URLs do frontend que podem acessar a API.

**Desenvolvimento:**
```python
origins = ["http://localhost:5173"]
```

**Produção:**
```python
origins = [
    "https://meu-frontend.vercel.app",
    "https://alcast.com",
]
```

### `allow_credentials=True`
Permite envio de cookies e headers de autenticação (JWT).

### `allow_methods=["*"]`
Permite todos os métodos HTTP:
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

### `allow_headers=["*"]`
Permite todos os headers, incluindo:
- `Authorization` (para JWT)
- `Content-Type`
- Custom headers

---

## ✅ Exemplo Completo (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.database import engine
from app import models

# Criar tabelas no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Alcast Hedge Control API",
    description="Sistema de gestão de hedge de alumínio",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ========================================
# CORS Configuration
# ========================================
origins = [
    "http://localhost:5173",      # Vite dev
    "http://localhost:3000",      # Alternative port
    "http://127.0.0.1:5173",      # Alternative localhost
    # Adicione aqui a URL de produção quando fizer deploy
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# Include Routers
# ========================================
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Alcast Hedge Control API",
        "version": "1.0.0",
        "docs": "/docs",
    }
```

---

## 🔍 Testando CORS

### 1. Iniciar Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Iniciar Frontend
```bash
npm run dev
# Frontend roda em http://localhost:5173
```

### 3. Testar no Browser
Abra as DevTools (F12) e vá na aba **Network**:

- ✅ **Requisições devem aparecer com status 200**
- ✅ **Headers devem incluir `Access-Control-Allow-Origin`**
- ❌ Se aparecer erro de CORS, verifique a configuração

---

## 🚨 Erros Comuns

### Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: Middleware de CORS não está configurado ou URL do frontend não está na lista.

**Solução**:
```python
origins = [
    "http://localhost:5173",  # ← Adicione esta linha
]
```

### Erro: "CORS policy: The value of the 'Access-Control-Allow-Credentials' header"

**Causa**: Frontend está enviando cookies/auth mas backend não permite.

**Solução**:
```python
allow_credentials=True,  # ← Adicione esta linha
```

### Erro: "Method OPTIONS is not allowed"

**Causa**: Backend não está permitindo requisições OPTIONS (preflight).

**Solução**:
```python
allow_methods=["*"],  # ← Adicione esta linha
```

---

## 🌐 CORS em Produção

### Desenvolvimento
```python
# Liberado para testes locais
origins = ["*"]  # ⚠️ NÃO USE EM PRODUÇÃO!
```

### Produção
```python
# Apenas origens específicas
origins = [
    "https://alcast.com",
    "https://app.alcast.com",
    "https://hedge-control.vercel.app",
]
```

---

## 📚 Referências

- **FastAPI CORS**: https://fastapi.tiangolo.com/tutorial/cors/
- **MDN CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Starlette Middleware**: https://www.starlette.io/middleware/

---

## ✅ Checklist de Configuração

- [ ] Adicionar middleware de CORS no `main.py`
- [ ] Incluir `http://localhost:5173` nas origens permitidas
- [ ] Definir `allow_credentials=True`
- [ ] Definir `allow_methods=["*"]`
- [ ] Definir `allow_headers=["*"]`
- [ ] Reiniciar o backend
- [ ] Testar requisição do frontend
- [ ] Verificar headers de CORS no Network tab

---

**Pronto! Seu backend agora aceita requisições do frontend! 🎉**
