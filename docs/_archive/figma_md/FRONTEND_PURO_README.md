# 🎯 Frontend 100% Puro - Sem Supabase

## ✅ CONFIRMAÇÃO

**Este frontend está TOTALMENTE LIMPO e NÃO depende do Supabase!**

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND PURO (React)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Camada de Apresentação                   │  │
│  │  - React Components                                       │  │
│  │  - Tailwind CSS                                           │  │
│  │  - Radix UI                                               │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                  Camada de Lógica                         │  │
│  │  - AuthContext (JWT genérico)                            │  │
│  │  - DataContext (API genérica)                            │  │
│  │  - Hooks customizados                                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                  Camada de Serviços                       │  │
│  │  - api.ts (Axios genérico)                               │  │
│  │  - purchaseOrdersService.ts                              │  │
│  │  - salesOrdersService.ts                                 │  │
│  │  - counterpartiesService.ts                              │  │
│  │  - rfqsService.ts                                        │  │
│  │  - hedgesService.ts                                      │  │
│  │  - suppliersService.ts                                   │  │
│  │  - customersService.ts                                   │  │
│  │  - locationsService.ts                                   │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │                  Camada de Configuração                   │  │
│  │  - config/env.ts (lê .env)                               │  │
│  │  - types/api.ts (TypeScript)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      │ HTTP REST API
                                      │ (Axios com JWT)
                                      │
                        ┌─────────────▼──────────────┐
                        │   SEU BACKEND FASTAPI      │
                        │                            │
                        │  - JWT Authentication      │
                        │  - REST Endpoints          │
                        │  - PostgreSQL/MongoDB      │
                        │  - CORS habilitado         │
                        └────────────────────────────┘
```

---

## 🗂️ Estrutura de Arquivos

### ✅ **Código Frontend (Limpo)**

```
/src
├── config/
│   └── env.ts                    # Configuração genérica (.env)
│
├── services/                     # Camada de comunicação com API
│   ├── api.ts                    # Cliente Axios base (JWT)
│   ├── purchaseOrdersService.ts
│   ├── salesOrdersService.ts
│   ├── counterpartiesService.ts
│   ├── rfqsService.ts
│   ├── hedgesService.ts
│   ├── suppliersService.ts
│   ├── customersService.ts
│   └── locationsService.ts
│
├── contexts/                     # Estado global
│   ├── AuthContext.tsx           # Autenticação JWT genérica
│   ├── DataContext.tsx           # Dados da aplicação (API)
│   └── mockData.ts               # Dados mock para desenvolvimento
│
├── types/
│   └── api.ts                    # Tipos TypeScript completos
│
├── hooks/                        # Hooks customizados
│   ├── usePurchaseOrders.ts
│   └── useSalesOrders.ts
│
└── app/
    ├── components/               # Componentes React
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   ├── DebugPanel.tsx
    │   └── ui/                   # Radix UI components
    │
    └── pages/                    # Páginas da aplicação
        ├── Login.tsx
        ├── Signup.tsx
        ├── Estoque.tsx
        ├── compras/
        │   ├── POs.tsx
        │   └── Fornecedores.tsx
        ├── vendas/
        │   ├── SOs.tsx
        │   └── Clientes.tsx
        └── financeiro/
            ├── RFQs.tsx
            ├── NovoRFQ.tsx
            ├── MTM.tsx
            ├── Contrapartes.tsx
            ├── Inbox.tsx
            └── Relatorios.tsx
```

---

### ⚠️ **Arquivos Ignorados (Figma Make)**

```
/supabase/                        # ← IGNORADO (específico Figma Make)
/utils/supabase/                  # ← IGNORADO (específico Figma Make)
```

**Nota:** Esses arquivos **existem** mas são **ignorados pelo Git** e **NÃO são usados** pelo frontend.

---

## 🔧 Configuração

### **1. Variáveis de Ambiente**

Crie `/.env`:

```env
# URL do backend (local ou produção)
VITE_API_URL=http://localhost:8000

# Modo mock (true = dados fake, false = API real)
VITE_USE_MOCK_DATA=false
```

---

### **2. Cliente HTTP (Axios)**

```typescript
// /src/services/api.ts
import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiUrl,  // Lê do .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erro 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### **3. Exemplo de Serviço**

```typescript
// /src/services/purchaseOrdersService.ts
import api from './api';
import { PurchaseOrder } from '../types/api';

export const purchaseOrdersService = {
  // GET /purchase-orders
  getAll: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get('/purchase-orders');
    return response.data;
  },

  // POST /purchase-orders
  create: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },

  // PUT /purchase-orders/:id
  update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  // DELETE /purchase-orders/:id
  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },
};
```

---

## 🔐 Autenticação

### **Como Funciona**

```typescript
// /src/contexts/AuthContext.tsx

const login = async (credentials: LoginRequest) => {
  // 1. Fazer login no backend
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await api.post('/auth/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token } = response.data;

  // 2. Salvar token
  setToken(access_token);
  localStorage.setItem('token', access_token);

  // 3. Buscar dados do usuário
  const userResponse = await api.get('/auth/me');
  setUser(userResponse.data);
  localStorage.setItem('user', JSON.stringify(userResponse.data));
};
```

---

## 🧪 Modo Mock

### **Para Desenvolvimento SEM Backend**

```env
VITE_USE_MOCK_DATA=true
```

O sistema usa dados brasileiros simulados de `/src/contexts/mockData.ts`:

```typescript
export const mockData = {
  purchaseOrders: [
    {
      id: 1,
      po_number: 'PO-2024-001',
      supplier: { name: 'Alcoa Corporation' },
      total_quantity_mt: 500.0,
      // ... dados completos
    }
  ],
  salesOrders: [...],
  counterparties: [...],
  // ... demais dados
};
```

---

## 📦 Tecnologias

### **Core**
- ⚛️ **React 18** - Framework UI
- 📘 **TypeScript** - Tipagem estática
- ⚡ **Vite** - Build tool

### **UI/UX**
- 🎨 **Tailwind CSS** - Estilização
- 🧩 **Radix UI** - Componentes acessíveis
- 🎭 **Lucide Icons** - Ícones

### **HTTP/API**
- 🌐 **Axios** - Cliente HTTP
- 🔒 **JWT** - Autenticação

### **Routing**
- 🚦 **React Router** - Navegação

---

## 🚀 Deploy

### **1. Build**

```bash
npm run build
```

Gera arquivos otimizados em `/dist`.

---

### **2. Configurar URL de Produção**

```env
VITE_API_URL=https://api.alcast.com.br
VITE_USE_MOCK_DATA=false
```

---

### **3. Servir Arquivos**

#### **Opção 1: Backend FastAPI Serve Frontend**

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="dist", html=True), name="static")
```

#### **Opção 2: Nginx**

```nginx
server {
  listen 80;
  server_name alcast.com.br;

  location / {
    root /var/www/alcast/dist;
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:8000;
  }
}
```

#### **Opção 3: CDN (Vercel, Netlify)**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

---

## 📋 Checklist de Integração

### **Frontend**
- [x] Código limpo (sem Supabase)
- [x] Serviços com Axios genérico
- [x] Tipos TypeScript completos
- [x] Modo mock funcional
- [ ] `.env` configurado
- [ ] Testar em modo mock

### **Backend**
- [ ] Endpoints REST implementados
- [ ] CORS habilitado
- [ ] JWT funcionando
- [ ] Respostas JSON corretas
- [ ] PostgreSQL/MongoDB configurado

### **Integração**
- [ ] `.env` apontando para backend
- [ ] Login funcionando
- [ ] Listagem de dados
- [ ] Criar/Editar/Deletar
- [ ] Tratamento de erros
- [ ] Deploy em produção

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** | ⭐ Guia completo de integração com backend |
| **[PROJECT_CLEANUP.md](./PROJECT_CLEANUP.md)** | Detalhes da limpeza do Supabase |
| **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** | Resumo da limpeza |
| **[START_HERE.md](./START_HERE.md)** | Quick start para desenvolvimento |
| **[GIT_COMMIT_GUIDE.md](./GIT_COMMIT_GUIDE.md)** | Como fazer commit das mudanças |

---

## ✅ Próximos Passos

### **1. Finalizar Limpeza Local**

```bash
# Desinstalar Supabase
npm uninstall @supabase/supabase-js

# Verificar
grep -r "supabase" src/
# (deve estar vazio)
```

---

### **2. Commitar para GitHub**

```bash
git add .
git commit -m "chore: remover Supabase e preparar para backend próprio"
git push
```

---

### **3. Desenvolver Backend**

Consulte **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** para ver:
- ✅ Endpoints esperados
- ✅ Formato de requisições/respostas
- ✅ Autenticação JWT
- ✅ Configuração CORS

---

### **4. Testar Integração**

```bash
# Backend rodando: http://localhost:8000

# Frontend .env:
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false

# Rodar
npm run dev
```

---

## 🎉 RESULTADO FINAL

**Frontend 100% PURO e AGNÓSTICO ao backend!**

✅ Sem código específico de Supabase  
✅ Totalmente genérico e flexível  
✅ Pronto para qualquer API REST  
✅ Documentação completa  
✅ Código organizado e tipado  

**Basta conectar ao SEU backend FastAPI! 🚀**
