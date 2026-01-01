# 📁 Estrutura do Projeto - Frontend Puro

## 🎯 Visão Geral

```
alcast-hedge-control/
│
├── 📚 DOCUMENTAÇÃO (Leia primeiro!)
│   ├── LEIA_ISTO_PRIMEIRO.md        ⭐ COMECE AQUI
│   ├── COMANDOS_FINAIS.md           ⭐ Comandos para executar
│   ├── BACKEND_INTEGRATION.md       ⭐ Integração com backend
│   ├── PROJECT_CLEANUP.md           Limpeza do Supabase
│   ├── CLEANUP_SUMMARY.md           Resumo da limpeza
│   ├── FRONTEND_PURO_README.md      Docs técnicas completas
│   ├── README.md                    Visão geral
│   ├── START_HERE.md                Quick start
│   ├── GIT_COMMIT_GUIDE.md          Guia de commit
│   ├── LOGIN_FIX.md                 Fix erro 404
│   └── CONTEXT_ERROR_FIX.md         Fix erro context
│
├── 🔧 CONFIGURAÇÃO
│   ├── .env                         ← VOCÊ DEVE CRIAR
│   ├── .gitignore                   ✅ Ignora Supabase
│   ├── package.json                 Dependências
│   ├── vite.config.ts               Config Vite
│   ├── tsconfig.json                Config TypeScript
│   └── tailwind.config.js           Config Tailwind
│
├── 📦 SRC (Código Frontend)
│   ├── config/
│   │   └── env.ts                   ✅ Configuração genérica (.env)
│   │
│   ├── services/                    ✅ Comunicação com API
│   │   ├── api.ts                   ✅ Cliente Axios base (JWT)
│   │   ├── purchaseOrdersService.ts
│   │   ├── salesOrdersService.ts
│   │   ├── counterpartiesService.ts
│   │   ├── rfqsService.ts
│   │   ├── hedgesService.ts
│   │   ├── suppliersService.ts
│   │   ├── customersService.ts
│   │   └── locationsService.ts
│   │
│   ├── contexts/                    ✅ Estado global
│   │   ├── AuthContext.tsx          ✅ JWT genérico
│   │   ├── DataContext.tsx          ✅ API genérica
│   │   ├── DataContextAPI.tsx       (backup)
│   │   └── mockData.ts              ✅ Dados mock
│   │
│   ├── types/
│   │   └── api.ts                   ✅ Tipos TypeScript
│   │
│   ├── hooks/
│   │   ├── usePurchaseOrders.ts
│   │   └── useSalesOrders.ts
│   │
│   ├── app/
│   │   ├── App.tsx                  ✅ Componente principal
│   │   │
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DebugPanel.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   │
│   │   │   └── ui/                  Radix UI components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── table.tsx
│   │   │       └── ... (30+ componentes)
│   │   │
│   │   └── pages/
│   │       ├── Login.tsx            ✅ Corrigido
│   │       ├── Signup.tsx           ✅ Corrigido (sem Supabase)
│   │       ├── Estoque.tsx
│   │       │
│   │       ├── compras/
│   │       │   ├── POs.tsx
│   │       │   └── Fornecedores.tsx
│   │       │
│   │       ├── vendas/
│   │       │   ├── SOs.tsx
│   │       │   └── Clientes.tsx
│   │       │
│   │       └── financeiro/
│   │           ├── RFQs.tsx
│   │           ├── NovoRFQ.tsx
│   │           ├── MTM.tsx
│   │           ├── Contrapartes.tsx
│   │           ├── Inbox.tsx
│   │           └── Relatorios.tsx
│   │
│   └── styles/
│       ├── index.css
│       ├── tailwind.css
│       ├── theme.css
│       └── fonts.css
│
├── ⚠️ IGNORADOS (Figma Make - NÃO USAR)
│   ├── /supabase/                   ← IGNORAR (específico Figma Make)
│   └── /utils/supabase/             ← IGNORAR (específico Figma Make)
│
└── 🗑️ DELETADOS
    └── /src/lib/supabase.ts         ❌ DELETADO
```

---

## ✅ Arquivos IMPORTANTES

### **🔥 Configuração**

#### **`.env`** (VOCÊ DEVE CRIAR)
```env
# URL do backend
VITE_API_URL=http://localhost:8000

# Modo mock (true = dados fake, false = API real)
VITE_USE_MOCK_DATA=true
```

#### **`/src/config/env.ts`**
```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
```

---

### **🌐 Cliente HTTP**

#### **`/src/services/api.ts`**
```typescript
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

// Trata erro 401
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

### **🔐 Autenticação**

#### **`/src/contexts/AuthContext.tsx`**
```typescript
const login = async (credentials: LoginRequest) => {
  // Verifica modo mock
  if (config.useMockData) {
    // Login mockado
    const mockToken = 'mock-jwt-token-' + Date.now();
    const mockUser = { /* ... */ };
    setToken(mockToken);
    setUser(mockUser);
    return;
  }

  // Login real
  const response = await api.post('/auth/token', formData);
  const { access_token } = response.data;
  setToken(access_token);

  // Buscar usuário
  const userResponse = await api.get('/auth/me');
  setUser(userResponse.data);
};
```

---

### **📊 Serviços**

#### **Exemplo: `/src/services/purchaseOrdersService.ts`**
```typescript
import api from './api';
import { PurchaseOrder } from '../types/api';

export const purchaseOrdersService = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get('/purchase-orders');
    return response.data;
  },

  create: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },
};
```

---

### **📝 Tipos**

#### **`/src/types/api.ts`**
```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  active: boolean;
  role: Role;
  created_at: string;
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
}

// ... mais tipos
```

---

## ⚠️ ARQUIVOS IGNORADOS

### **Pasta `/supabase`**
```
/supabase/
├── functions/
│   └── server/
│       ├── index.tsx       ← IGNORAR (Figma Make)
│       └── kv_store.tsx    ← IGNORAR (Figma Make)
```

### **Pasta `/utils/supabase`**
```
/utils/supabase/
└── info.tsx                ← IGNORAR (Figma Make)
```

**Por quê ignorar?**
- São arquivos **protegidos** do ambiente Figma Make
- **NÃO são necessários** para o seu backend FastAPI
- **NÃO são usados** pelo frontend
- Estão no `.gitignore`

---

## 🗑️ ARQUIVO DELETADO

### **`/src/lib/supabase.ts`** ❌ **DELETADO**

**Antes:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0c296f9f`;
```

**Agora:** NÃO EXISTE MAIS! ✅

**Substituído por:**
```typescript
// /src/config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};
```

---

## 📦 Dependências

### **Principais**
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "@radix-ui/react-*": "^1.x",
    "tailwindcss": "^4.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

**NÃO INCLUI:**
- ❌ `@supabase/supabase-js` → **REMOVIDO**

---

## 🔧 Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## 📋 CHECKLIST

### **Código**
- [x] `/src/lib/supabase.ts` deletado
- [x] `Signup.tsx` corrigido (usa `config.apiUrl`)
- [x] `api.ts` usa Axios genérico
- [x] Todos os serviços usam `api.ts`
- [x] Tipos TypeScript completos
- [x] Modo mock funcional

### **Configuração**
- [x] `.gitignore` ignora `/supabase` e `/utils/supabase`
- [ ] `.env` criado localmente (VOCÊ DEVE CRIAR)
- [ ] `npm uninstall @supabase/supabase-js` executado

### **Documentação**
- [x] `LEIA_ISTO_PRIMEIRO.md` criado
- [x] `COMANDOS_FINAIS.md` criado
- [x] `BACKEND_INTEGRATION.md` criado
- [x] `PROJECT_CLEANUP.md` criado
- [x] `CLEANUP_SUMMARY.md` criado
- [x] `FRONTEND_PURO_README.md` criado

---

## 🚀 PRÓXIMOS PASSOS

### **1. Executar Comandos**
Consulte: **[COMANDOS_FINAIS.md](./COMANDOS_FINAIS.md)**

### **2. Integrar Backend**
Consulte: **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)**

---

## ✅ RESULTADO FINAL

**Frontend 100% puro, limpo e pronto para SEU backend FastAPI!** 🎉

**Estrutura clara, código organizado, documentação completa!** 🚀
