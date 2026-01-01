# 🔌 Integração com Backend

## 📋 Visão Geral

Este frontend **NÃO depende do Supabase** e está pronto para se conectar ao **SEU backend único**.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ AuthContext  │◄────────┤ Login/Signup │                 │
│  └──────┬───────┘         └──────────────┘                 │
│         │                                                   │
│         │                                                   │
│  ┌──────▼───────┐         ┌──────────────┐                 │
│  │ DataContext  │◄────────┤   Pages      │                 │
│  └──────┬───────┘         └──────────────┘                 │
│         │                                                   │
│         │                                                   │
│  ┌──────▼───────────────────────────────┐                  │
│  │         Services Layer               │                  │
│  │  ┌────────────────────────────────┐  │                  │
│  │  │  api.ts (Axios Instance)       │  │                  │
│  │  └────────────────────────────────┘  │                  │
│  │  ┌────────────────────────────────┐  │                  │
│  │  │  purchaseOrdersService.ts      │  │                  │
│  │  │  salesOrdersService.ts         │  │                  │
│  │  │  counterpartiesService.ts      │  │                  │
│  │  │  rfqsService.ts                │  │                  │
│  │  │  hedgesService.ts              │  │                  │
│  │  │  suppliersService.ts           │  │                  │
│  │  │  customersService.ts           │  │                  │
│  │  │  locationsService.ts           │  │                  │
│  │  └────────────────────────────────┘  │                  │
│  └───────────────────────┬──────────────┘                  │
└────────────────────────────┼──────────────────────────────┘
                             │
                             │ HTTP (REST API)
                             │
                     ┌───────▼────────┐
                     │  SEU BACKEND   │
                     │   (FastAPI)    │
                     └────────────────┘
```

---

## 🔧 Configuração

### 1️⃣ **Variáveis de Ambiente**

Crie o arquivo `/.env` na raiz do projeto:

```env
# URL do seu backend
VITE_API_URL=http://localhost:8000

# Modo mock (true = usa dados fake, false = usa API real)
VITE_USE_MOCK_DATA=false
```

**Importante:**
- Em **desenvolvimento local**: `VITE_API_URL=http://localhost:8000`
- Em **produção**: `VITE_API_URL=https://api.alcast.com.br`

---

### 2️⃣ **Arquivo de Configuração**

O frontend lê as variáveis em `/src/config/env.ts`:

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
```

---

## 🌐 Endpoints Esperados

### **Autenticação**

#### `POST /auth/token`
Login de usuário (OAuth2 com form-data)

**Request:**
```
Content-Type: application/x-www-form-urlencoded

username=usuario@alcast.com
password=123456
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

#### `GET /auth/me`
Obter dados do usuário logado

**Request:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "email": "usuario@alcast.com",
  "name": "João Silva",
  "active": true,
  "role": {
    "id": 1,
    "name": "admin",
    "description": "Administrador"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

#### `POST /auth/signup`
Criar novo usuário

**Request:**
```json
{
  "email": "novo@alcast.com",
  "password": "senha123",
  "name": "Maria Santos",
  "role": "financeiro"
}
```

**Response:**
```json
{
  "id": 2,
  "email": "novo@alcast.com",
  "name": "Maria Santos",
  "active": true,
  "role": {
    "id": 2,
    "name": "financeiro",
    "description": "Financeiro"
  },
  "created_at": "2024-01-15T11:00:00Z"
}
```

---

### **Purchase Orders (POs)**

#### `GET /purchase-orders`
Listar todas as POs

**Response:**
```json
[
  {
    "id": 1,
    "po_number": "PO-2024-001",
    "supplier_id": 1,
    "supplier": {
      "id": 1,
      "name": "Alcoa Corporation",
      "code": "ALC001"
    },
    "total_quantity_mt": 500.0,
    "pricing_type": "monthly_average",
    "lme_premium": 150.0,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### `POST /purchase-orders`
Criar nova PO

**Request:**
```json
{
  "po_number": "PO-2024-002",
  "supplier_id": 1,
  "total_quantity_mt": 1000.0,
  "pricing_type": "monthly_average",
  "lme_premium": 200.0,
  "notes": "Entrega em parcelas mensais"
}
```

---

#### `PUT /purchase-orders/{id}`
Atualizar PO existente

---

#### `DELETE /purchase-orders/{id}`
Deletar PO

---

### **Sales Orders (SOs)**

#### `GET /sales-orders`
Listar todas as SOs

**Response:**
```json
[
  {
    "id": 1,
    "so_number": "SO-2024-001",
    "customer_id": 1,
    "customer": {
      "id": 1,
      "name": "Embraer S.A.",
      "code": "EMB001"
    },
    "total_quantity_mt": 300.0,
    "pricing_type": "monthly_average",
    "lme_premium": 250.0,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### `POST /sales-orders`
Criar nova SO

---

#### `PUT /sales-orders/{id}`
Atualizar SO

---

#### `DELETE /sales-orders/{id}`
Deletar SO

---

### **Contrapartes (Bancos e Corretoras)**

#### `GET /counterparties`
Listar todas as contrapartes

**Response:**
```json
[
  {
    "id": 1,
    "name": "Itaú BBA",
    "type": "bank",
    "contact_name": "Carlos Silva",
    "contact_email": "carlos.silva@itau.com.br",
    "contact_phone": "+55 11 98765-4321",
    "active": true
  },
  {
    "id": 2,
    "name": "XP Investimentos",
    "type": "broker",
    "contact_name": "Ana Costa",
    "contact_email": "ana.costa@xpi.com.br",
    "contact_phone": "+55 11 91234-5678",
    "active": true
  }
]
```

---

#### `POST /counterparties`
Criar contraparte

---

#### `PUT /counterparties/{id}`
Atualizar contraparte

---

#### `DELETE /counterparties/{id}`
Deletar contraparte

---

### **RFQs (Request for Quote)**

#### `GET /rfqs`
Listar todos os RFQs

**Response:**
```json
[
  {
    "id": 1,
    "rfq_number": "RFQ-2024-001",
    "so_id": 1,
    "quantity_mt": 200.0,
    "period": "2024-02",
    "status": "pending",
    "counterparty_quotes": [
      {
        "id": 1,
        "counterparty_id": 1,
        "counterparty_name": "Itaú BBA",
        "quote_price": 2450.00,
        "status": "quoted",
        "quoted_at": "2024-01-15T14:30:00Z"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

#### `POST /rfqs`
Criar novo RFQ

---

#### `POST /rfqs/{id}/send`
Enviar RFQ para contrapartes

---

#### `PUT /rfqs/{id}`
Atualizar RFQ

---

### **Hedges (MTM - Mark to Market)**

#### `GET /hedges`
Listar todos os hedges

**Response:**
```json
[
  {
    "id": 1,
    "so_id": 1,
    "counterparty_id": 1,
    "quantity_mt": 100.0,
    "contract_price": 2500.00,
    "current_market_price": 2450.00,
    "mtm_value": -5000.00,
    "period": "2024-02",
    "status": "active"
  }
]
```

---

#### `POST /hedges`
Criar novo hedge

---

### **Fornecedores**

#### `GET /suppliers`
Listar fornecedores

---

#### `POST /suppliers`
Criar fornecedor

---

### **Clientes**

#### `GET /customers`
Listar clientes

---

#### `POST /customers`
Criar cliente

---

### **Localizações (Estoque)**

#### `GET /locations`
Listar localizações de estoque

**Response:**
```json
[
  {
    "id": 1,
    "name": "Porto de Santos",
    "type": "porto",
    "current_stock_mt": 1200.5,
    "capacity_mt": 5000.0
  }
]
```

---

## 🔒 Autenticação

### **Como Funciona**

1. **Login** → Frontend envia credenciais para `POST /auth/token`
2. **Token** → Backend retorna `access_token` JWT
3. **Storage** → Frontend salva token no `localStorage`
4. **Requests** → Todas as chamadas incluem header:
   ```
   Authorization: Bearer {access_token}
   ```

### **Implementação no Frontend**

```typescript
// src/services/api.ts
import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: trata erro 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📝 Tipos TypeScript

Todos os tipos esperados estão em `/src/types/api.ts`:

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  active: boolean;
  role: Role;
  created_at: string;
}

export interface Role {
  id: number;
  name: RoleName;
  description: string;
}

export enum RoleName {
  ADMIN = 'admin',
  COMPRAS = 'compras',
  VENDAS = 'vendas',
  FINANCEIRO = 'financeiro',
  ESTOQUE = 'estoque',
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  total_quantity_mt: number;
  pricing_type: PricingType;
  lme_premium: number;
  status: OrderStatus;
  created_at: string;
  // ... outros campos
}

// ... demais tipos
```

---

## 🧪 Modo Mock (Desenvolvimento)

Para desenvolver **SEM backend**, configure:

```env
VITE_USE_MOCK_DATA=true
```

O sistema usará dados brasileiros simulados de `/src/contexts/mockData.ts`.

### **Quando Usar Mock:**
- ✅ Desenvolvimento de UI/UX
- ✅ Testes de fluxo
- ✅ Backend ainda não está pronto

### **Quando Usar API Real:**
- ✅ Integração com backend
- ✅ Testes de integração
- ✅ Produção

---

## 🚀 Deploy

### **1. Build do Frontend**

```bash
npm run build
```

Gera arquivos otimizados em `/dist`.

---

### **2. Configurar URL do Backend**

Antes do build, defina:

```env
VITE_API_URL=https://api.alcast.com.br
VITE_USE_MOCK_DATA=false
```

---

### **3. Servir Arquivos Estáticos**

O backend pode servir o frontend:

```python
# FastAPI
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="dist", html=True), name="static")
```

Ou usar Nginx/Apache/CDN.

---

## ✅ Checklist de Integração

### **Backend**
- [ ] Endpoints REST implementados conforme documentação
- [ ] CORS configurado para aceitar requisições do frontend
- [ ] JWT funcionando para autenticação
- [ ] Respostas JSON no formato esperado

### **Frontend**
- [ ] `.env` configurado com URL do backend
- [ ] `VITE_USE_MOCK_DATA=false`
- [ ] Testar login
- [ ] Testar listagem de dados
- [ ] Testar criação/edição/exclusão

---

## 🐛 Troubleshooting

### **Erro CORS**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solução:** Configurar CORS no backend:

```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### **Erro 404 "Not Found"**

**Possíveis causas:**
1. Backend não está rodando
2. URL da API está errada no `.env`
3. Endpoint não implementado

**Solução:**
1. Verificar se backend está rodando: `curl http://localhost:8000`
2. Verificar logs do console do browser (F12)
3. Verificar logs do backend

---

### **Token Expirado (401)**

O frontend **automaticamente** redireciona para `/login` quando recebe erro 401.

---

## 📚 Estrutura de Arquivos Importantes

```
/src
├── config/
│   └── env.ts                    # Configuração de ambiente
├── services/
│   ├── api.ts                    # Cliente Axios base
│   ├── purchaseOrdersService.ts  # Serviço de POs
│   ├── salesOrdersService.ts     # Serviço de SOs
│   ├── counterpartiesService.ts  # Serviço de Contrapartes
│   ├── rfqsService.ts            # Serviço de RFQs
│   ├── hedgesService.ts          # Serviço de Hedges
│   ├── suppliersService.ts       # Serviço de Fornecedores
│   ├── customersService.ts       # Serviço de Clientes
│   └── locationsService.ts       # Serviço de Localizações
├── contexts/
│   ├── AuthContext.tsx           # Contexto de autenticação
│   └── DataContext.tsx           # Contexto de dados (API)
├── types/
│   └── api.ts                    # Tipos TypeScript
└── app/
    └── pages/                    # Páginas da aplicação
```

---

## 🎯 Próximos Passos

1. ✅ **Implemente os endpoints** no seu backend FastAPI
2. ✅ **Configure CORS** para aceitar requisições
3. ✅ **Teste cada endpoint** com Postman/Insomnia
4. ✅ **Configure `.env`** no frontend
5. ✅ **Teste integração** completa

---

## 💡 Dicas

- **Use o modo mock** enquanto desenvolve o backend
- **Verifique sempre os logs** do console (F12)
- **Teste autenticação primeiro** antes de outros endpoints
- **Use ferramentas** como Postman para testar API isoladamente

---

## 🆘 Suporte

Se tiver dúvidas sobre:
- **Endpoints esperados** → Ver seção "Endpoints Esperados"
- **Tipos de dados** → Ver `/src/types/api.ts`
- **CORS** → Ver seção "Troubleshooting"
- **Autenticação** → Ver seção "Autenticação"

---

**Frontend 100% pronto para integração! 🚀**
