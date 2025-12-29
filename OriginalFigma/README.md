# 🏦 Alcast Hedge Control - Frontend

> ## 📢 **LEIA ISTO PRIMEIRO:** [LEIA_ISTO_PRIMEIRO.md](./LEIA_ISTO_PRIMEIRO.md)
>
> **🔥 IMPORTANTE:**
> - ✅ Frontend **100% LIMPO** - SEM Supabase
> - ✅ Pronto para **SEU backend FastAPI**
> - ✅ Execute: **[COMANDOS_FINAIS.md](./COMANDOS_FINAIS.md)**
> - ✅ Integre: **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)**
>
> ---
>
> **🚀 NOVO USUÁRIO?** Comece aqui: **[START_HERE.md](./START_HERE.md)**
> 
> **❌ TEM ERROS?** Veja: **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

Sistema completo de gestão de Purchase Orders (POs), Sales Orders (SOs), estoque, RFQs e Mark-to-Market (MTM) para operações de hedge com alumínio.

## 🎯 **Frontend 100% Puro**

✅ **NÃO usa Supabase** - Frontend agnóstico ao backend  
✅ **Pronto para qualquer API REST** - Configuração via `.env`  
✅ **Modo Mock** - Desenvolvimento sem backend  
✅ **Totalmente Tipado** - TypeScript com tipos completos

## ✨ Características

### 🎨 **Layout Bonito e Moderno**
- Design corporativo profissional com Tailwind CSS
- Componentes Radix UI de alta qualidade
- Interface responsiva e intuitiva
- Cores corporativas azuis (#0c4a6e)
- Navegação lateral colapsável

### 🔐 **Autenticação e Segurança**
- Login JWT com backend FastAPI/Python
- RBAC (Role-Based Access Control) com 5 perfis:
  - **Admin** - Acesso total
  - **Compras** - Gestão de POs e fornecedores
  - **Vendas** - Gestão de SOs e clientes
  - **Financeiro** - RFQs, MTM, contrapartes
  - **Estoque** - Gestão de inventário
- Rotas protegidas por autenticação
- Logout automático em caso de token expirado

### 📊 **Módulos Implementados**

#### Compras
- ✅ Purchase Orders com precificação profissional (Fixo, TBF, Monthly Average)
- ✅ Gestão de fornecedores
- ✅ Volumes de grande escala (100-12.000 MT)
- ✅ Integração com backend API

#### Vendas
- ✅ Sales Orders com mesma precificação profissional
- ✅ Gestão de clientes
- ✅ Vinculação de SOs com POs existentes
- ✅ Integração com backend API

#### Financeiro
- ✅ RFQs (Request for Quotation) profissionais
- ✅ Gestão de contrapartes (Bancos e Corretoras)
- ✅ Mark-to-Market (MTM) em tempo real
- ✅ Relatórios e dashboards

#### Estoque
- ✅ Gestão de lotes de alumínio
- ✅ Controle de disponibilidade vs. comprometido
- ✅ MTM por lote

### 🔌 **Backend Integration**
- **API Client**: Axios com interceptors
- **Auto JWT**: Token automático em todas requisições
- **Error Handling**: Tratamento robusto de erros
- **Mock Fallback**: Dados mockados para desenvolvimento
- **Type Safety**: TypeScript 100% alinhado com backend Python

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Backend FastAPI rodando (opcional para modo mock)

### Instalação

```bash
# Clone o repositório
git clone [seu-repo-url]
cd frontend

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env conforme necessário

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

---

## ⚙️ Configuração

### Arquivo `.env`

```env
# URL do backend FastAPI
VITE_API_URL=http://localhost:8000

# Modo de desenvolvimento (true = usa dados mockados)
VITE_USE_MOCK_DATA=true
```

### Modos de Operação

#### 🧪 Modo Mock (Desenvolvimento)
```env
VITE_USE_MOCK_DATA=true
```
- Usa dados mockados em `src/contexts/mockData.ts`
- Backend não é necessário
- Perfeito para desenvolvimento do frontend

#### 🚀 Modo Produção (API Real)
```env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:8000
```
- Conecta ao backend FastAPI real
- Requer backend rodando
- Autenticação JWT ativa

---

## 📁 Estrutura do Projeto

```
/src
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Header.tsx       # Cabeçalho com logo e perfil
│   │   ├── Sidebar.tsx      # Menu lateral com navegação
│   │   └── ...
│   └── pages/               # Páginas da aplicação
│       ├── Login.tsx        # Tela de login
│       ├── compras/         # Módulo de Compras
│       ├── vendas/          # Módulo de Vendas
│       ├── financeiro/      # Módulo Financeiro
│       └── Estoque.tsx      # Módulo de Estoque
├── contexts/
│   ├── AuthContext.tsx      # Contexto de autenticação
│   ├── DataContextAPI.tsx   # Contexto de dados com API
│   └── mockData.ts          # Dados mockados
├── services/                # Serviços de API
│   ├── api.ts               # Cliente HTTP Axios
│   ├── purchaseOrdersService.ts
│   ├── salesOrdersService.ts
│   └── ...
├── hooks/                   # Hooks personalizados
│   ├── usePurchaseOrders.ts
│   └── useSalesOrders.ts
└── types/
    └── api.ts               # Tipos TypeScript da API
```

---

## 🔐 Autenticação

### Login
1. Acesse `/login`
2. Entre com credenciais do backend
3. Sistema redireciona baseado no role do usuário:
   - **Financeiro** → `/financeiro/inbox`
   - **Compras** → `/compras/fornecedores`
   - **Vendas** → `/vendas/clientes`
   - **Admin** → `/financeiro/inbox` (acesso total)

### JWT Token
- Token salvo em `localStorage`
- Enviado automaticamente em todas requisições
- Logout automático se token expirar

---

## 🛠️ Tecnologias

### Frontend
- ⚛️ **React 18** - UI Library
- 🎨 **Tailwind CSS 4** - Styling
- 🧩 **Radix UI** - Componentes acessíveis
- 📡 **Axios** - HTTP Client
- 🎯 **TypeScript** - Type Safety
- 🚀 **Vite** - Build Tool
- 🎭 **React Router** - Routing
- 🎉 **Sonner** - Toast Notifications

### Backend (Integrado)
- 🐍 **Python 3.11+**
- ⚡ **FastAPI** - Web Framework
- 🗄️ **SQLAlchemy** - ORM
- 🔐 **JWT** - Autenticação
- 📊 **PostgreSQL** - Database

---

## 📡 API Endpoints

Todos os endpoints estão documentados em: `http://localhost:8000/docs` (Swagger)

### Principais Endpoints
```
POST   /auth/token              # Login
GET    /auth/me                 # User info
GET    /purchase-orders         # Listar POs
POST   /purchase-orders         # Criar PO
GET    /sales-orders            # Listar SOs
POST   /sales-orders            # Criar SO
GET    /suppliers               # Listar fornecedores
GET    /customers               # Listar clientes
GET    /counterparties          # Listar contrapartes
GET    /rfqs                    # Listar RFQs
POST   /rfqs                    # Criar RFQ
GET    /hedges                  # Listar hedges
```

---

## 🎯 Uso nos Componentes

### Exemplo com Hook
```tsx
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';

function MeuComponente() {
  const { 
    purchaseOrders, 
    loading, 
    createPurchaseOrder 
  } = usePurchaseOrders();

  const handleCreate = async () => {
    await createPurchaseOrder({
      code: 'PO-2024-001',
      supplier_id: 1,
      quantity_tons: 1000,
      aluminum_type: 'P1020',
      currency: 'USD',
    });
  };

  return <div>...</div>;
}
```

---

## 🧪 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📦 Build e Deploy

### Build de Produção
```bash
npm run build
```

### Deploy (Exemplo com Vercel)
```bash
npm install -g vercel
vercel --prod
```

### Variáveis de Ambiente (Produção)
```env
VITE_API_URL=https://api.alcast.com
VITE_USE_MOCK_DATA=false
```

---

## 📚 Documentação Adicional

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Guia completo de integração com backend
- **[Backend Repository](https://github.com/Andreicr1/HEDGE_CONTROL)** - Código do backend FastAPI

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário da **Alcast**.

---

## 📞 Suporte

- **Backend**: https://github.com/Andreicr1/HEDGE_CONTROL
- **API Docs**: http://localhost:8000/docs

---

**Desenvolvido com ❤️ para Alcast Hedge Control**

*Layout Bonito + Backend Robusto = Sistema Completo! 🎉*