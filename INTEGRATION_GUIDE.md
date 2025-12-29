# 🚀 Guia de Integração - Alcast Hedge Control

## Visão Geral

Este frontend foi **100% integrado** com o backend FastAPI/Python que você já possui no repositório [HEDGE_CONTROL](https://github.com/Andreicr1/HEDGE_CONTROL).

---

## 📁 Estrutura Criada

```
/src
├── contexts/
│   ├── AuthContext.tsx          # Gerencia autenticação JWT
│   ├── DataContextAPI.tsx       # Gerencia dados com API real + fallback mock
│   └── mockData.ts              # Dados mockados para desenvolvimento
├── services/
│   ├── api.ts                   # Cliente HTTP Axios configurado
│   ├── purchaseOrdersService.ts # Serviço de POs
│   ├── salesOrdersService.ts    # Serviço de SOs
│   ├── suppliersService.ts      # Serviço de Fornecedores
│   ├── customersService.ts      # Serviço de Clientes
│   ├── rfqsService.ts           # Serviço de RFQs
│   ├── hedgesService.ts         # Serviço de Hedges
│   ├── counterpartiesService.ts # Serviço de Contrapartes
│   └── locationsService.ts      # Serviço de Localizações
├── hooks/
│   ├── usePurchaseOrders.ts     # Hook personalizado para POs
│   └── useSalesOrders.ts        # Hook personalizado para SOs
└── types/
    └── api.ts                   # Tipos TypeScript alinhados com backend
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Edite o arquivo `/.env`:

```env
# URL do seu backend FastAPI
VITE_API_URL=http://localhost:8000

# Usar dados mockados (desenvolvimento)
VITE_USE_MOCK_DATA=true
```

**Quando o backend estiver rodando:**
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false  # ← Mudar para false
```

---

## 🎯 Como Funciona

### Modo Mock (Desenvolvimento)
- ✅ **`VITE_USE_MOCK_DATA=true`**
- Usa dados mockados em `mockData.ts`
- Não precisa do backend rodando
- Perfeito para desenvolvimento do frontend

### Modo Produção (API Real)
- ✅ **`VITE_USE_MOCK_DATA=false`**
- Conecta ao backend FastAPI
- Todas as chamadas vão para `http://localhost:8000`
- Autenticação JWT ativa

---

## 🔐 Autenticação

### Como funciona:
1. Usuário faz login na tela `/login`
2. Credenciais são enviadas para `POST /auth/token`
3. Backend retorna JWT token
4. Token é salvo em `localStorage`
5. Token é enviado em **todas** as requisições via header `Authorization: Bearer <token>`
6. Se token expirar (401), usuário é redirecionado para login automaticamente

### Dados de Login (Backend):
Configure usuários no backend conforme a documentação do repositório Python.

Exemplo de estrutura esperada:
```json
{
  "email": "admin@alcast.com",
  "password": "senha123",
  "role": {
    "name": "admin"
  }
}
```

---

## 📡 Endpoints Integrados

Todos os endpoints seguem a estrutura do seu backend:

### Autenticação
- `POST /auth/token` - Login com JWT
- `GET /auth/me` - Buscar dados do usuário logado

### Purchase Orders
- `GET /purchase-orders` - Listar todas as POs
- `GET /purchase-orders/{id}` - Buscar PO por ID
- `POST /purchase-orders` - Criar nova PO
- `POST /purchase-orders/{id}/status` - Atualizar status da PO

### Sales Orders
- `GET /sales-orders` - Listar todas as SOs
- `GET /sales-orders/{id}` - Buscar SO por ID
- `POST /sales-orders` - Criar nova SO
- `POST /sales-orders/{id}/status` - Atualizar status da SO

### Fornecedores/Clientes
- `GET /suppliers` - Listar fornecedores
- `GET /customers` - Listar clientes

### RFQs
- `GET /rfqs` - Listar RFQs
- `POST /rfqs` - Criar nova RFQ
- `POST /rfq-send/{id}/send` - Enviar RFQ

### Hedges
- `GET /hedges` - Listar hedges
- `GET /hedges/by-purchase-order/{po_id}` - Hedges por PO
- `GET /hedges/by-sales-order/{so_id}` - Hedges por SO

### Contrapartes
- `GET /counterparties` - Listar contrapartes

### Localizações
- `GET /locations` - Listar localizações de armazém

---

## 💻 Como Usar nos Componentes

### Exemplo 1: Usando Hooks (Recomendado)
```tsx
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';

function MeuComponente() {
  const { 
    purchaseOrders, 
    loading, 
    error, 
    createPurchaseOrder,
    updateStatus 
  } = usePurchaseOrders();

  const handleCreate = async (data) => {
    try {
      await createPurchaseOrder({
        code: 'PO-2024-001',
        supplier_id: 1,
        quantity_tons: 1000,
        aluminum_type: 'P1020',
        currency: 'USD',
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {purchaseOrders.map(po => (
        <div key={po.id}>{po.code}</div>
      ))}
    </div>
  );
}
```

### Exemplo 2: Usando DataContext
```tsx
import { useData } from '../contexts/DataContextAPI';

function OutroComponente() {
  const { 
    purchaseOrders, 
    loadingPOs, 
    fetchPurchaseOrders 
  } = useData();

  return (
    <div>
      {purchaseOrders.map(po => (
        <div key={po.id}>{po.code}</div>
      ))}
    </div>
  );
}
```

### Exemplo 3: Chamada Direta ao Serviço
```tsx
import { purchaseOrdersService } from '../services/purchaseOrdersService';

async function criarPO() {
  try {
    const novaPO = await purchaseOrdersService.create({
      code: 'PO-2024-001',
      supplier_id: 1,
      quantity_tons: 1000,
      aluminum_type: 'Alumínio Primário',
      currency: 'USD',
    });
    console.log('PO criada:', novaPO);
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

---

## 🔄 Fluxo Completo de Integração

### 1. Iniciar Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate     # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Configurar Frontend
```bash
# Editar .env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

### 3. Iniciar Frontend
```bash
npm install
npm run dev
```

### 4. Testar
1. Acesse `http://localhost:5173`
2. Faça login com credenciais do backend
3. Token JWT será automaticamente gerenciado
4. Todas as operações usarão API real

---

## 🎨 Funcionalidades Implementadas

### ✅ Autenticação
- Login JWT com backend
- Logout com limpeza de token
- Redirecionamento automático baseado em role
- Proteção de rotas (PrivateRoute)

### ✅ Purchase Orders
- Listar POs com dados do backend
- Criar nova PO via API
- Atualizar status da PO
- Formulário profissional com validação

### ✅ Sales Orders
- Listar SOs com dados do backend
- Criar nova SO via API
- Vincular SOs com POs existentes
- Atualizar status da SO

### ✅ Outros Módulos
- Fornecedores (read-only da API)
- Clientes (read-only da API)
- Contrapartes (read-only da API)
- RFQs (listar e criar via API)
- Hedges (listar via API)
- Localizações (read-only da API)

---

## 🐛 Troubleshooting

### Erro: "Network Error"
- ✅ Verifique se o backend está rodando em `http://localhost:8000`
- ✅ Verifique CORS no backend (deve permitir `http://localhost:5173`)

### Erro: "401 Unauthorized"
- ✅ Token expirado - faça login novamente
- ✅ Verifique se o token está sendo enviado corretamente

### Modo Mock não funciona
- ✅ Verifique se `VITE_USE_MOCK_DATA=true` no `.env`
- ✅ Reinicie o servidor de desenvolvimento (`npm run dev`)

### Dados não aparecem
- ✅ Abra DevTools → Network e veja se requisições estão sendo feitas
- ✅ Verifique console do browser para erros
- ✅ Verifique logs do backend

---

## 📚 Próximos Passos

### Backend (FastAPI)
1. ✅ Garantir que endpoints retornam dados conforme tipos TypeScript
2. ✅ Configurar CORS para aceitar `http://localhost:5173`
3. ✅ Criar seed data para testes
4. ✅ Implementar refresh token (opcional)

### Frontend (React)
1. ✅ Testar todos os fluxos com backend real
2. ✅ Adicionar mais validações nos formulários
3. ✅ Implementar loading states em todas as telas
4. ✅ Adicionar tratamento de erros mais robusto

---

## 🚀 Deploy

### Backend
```bash
# Docker
docker build -t hedge-control-backend .
docker run -p 8000:8000 hedge-control-backend
```

### Frontend
```bash
# Build de produção
npm run build

# Servir estático
npm install -g serve
serve -s dist -p 3000
```

### Variáveis de Produção
```env
VITE_API_URL=https://api.alcast.com
VITE_USE_MOCK_DATA=false
```

---

## 📞 Suporte

- **GitHub Backend**: https://github.com/Andreicr1/HEDGE_CONTROL
- **Documentação Backend**: `http://localhost:8000/docs` (FastAPI Swagger)
- **Frontend**: Layout bonito + Backend robusto = Sistema completo! 🎉

---

**Desenvolvido com ❤️ para Alcast Hedge Control**
