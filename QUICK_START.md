# ⚡ Quick Start - Alcast Hedge Control

Comece a usar o sistema em **3 minutos**!

---

## 🚀 Setup Rápido

### Opção 1: Script Automático (Recomendado)

#### Linux/Mac:
```bash
chmod +x setup.sh
./setup.sh
```

#### Windows:
```cmd
setup.bat
```

O script irá:
1. ✅ Verificar Node.js e npm
2. ✅ Configurar modo (mock ou produção)
3. ✅ Criar arquivo `.env`
4. ✅ Instalar dependências

---

### Opção 2: Setup Manual

```bash
# 1. Copiar exemplo de configuração
cp .env.example .env

# 2. Editar .env (escolher modo)
# VITE_USE_MOCK_DATA=true   # ← Desenvolvimento (sem backend)
# VITE_USE_MOCK_DATA=false  # ← Produção (com backend)

# 3. Instalar dependências
npm install

# 4. Iniciar servidor
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🎯 Modos de Uso

### 🧪 Modo Mock (Desenvolvimento)

**Quando usar**: Desenvolvimento do frontend sem backend

```env
VITE_USE_MOCK_DATA=true
VITE_API_URL=http://localhost:8000
```

**Login**: Qualquer email/senha funciona
- Ex: `teste@teste.com` / `123`

**Vantagens**:
- ✅ Sem dependência do backend
- ✅ Dados sempre disponíveis
- ✅ Testes rápidos de UI

---

### 🚀 Modo Produção (API Real)

**Quando usar**: Conectar ao backend real

```env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:8000
```

**Login**: Use credenciais do backend
- Veja `TEST_CREDENTIALS.md` para exemplos

**Requisitos**:
- ✅ Backend FastAPI rodando
- ✅ CORS configurado no backend
- ✅ Usuários criados no banco

---

## 🔐 Login de Teste

### Modo Mock
```
Email: qualquer@email.com
Senha: qualquer
```

### Modo Produção (Backend Real)
```
Email: admin@alcast.com
Senha: admin123
Role: admin
```

Veja mais em: `TEST_CREDENTIALS.md`

---

## 📋 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Inicia servidor dev (porta 5173)
```

### Build
```bash
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Limpeza
```bash
rm -rf node_modules  # Remover dependências
npm install          # Reinstalar
```

---

## 🐛 Problemas Comuns

### 1. "Port 5173 already in use"
```bash
# Matar processo na porta 5173
lsof -ti:5173 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5173   # Windows (ver PID)
taskkill /PID <pid> /F         # Windows (matar)
```

### 2. "Module not found: axios"
```bash
npm install axios
```

### 3. "CORS error"
- ✅ Veja: `BACKEND_CORS_SETUP.md`
- ✅ Backend deve permitir `http://localhost:5173`

### 4. "401 Unauthorized"
- ✅ Token expirou - faça login novamente
- ✅ Backend não está rodando

### 5. "Cannot GET /"
```bash
# Reiniciar servidor
npm run dev
```

---

## 🎨 Estrutura Visual

### Navegação por Role

**Admin** → `/financeiro/inbox`
- ✅ Acesso total ao sistema

**Financeiro** → `/financeiro/inbox`
- ✅ RFQs
- ✅ Contrapartes
- ✅ MTM
- ✅ Relatórios

**Compras** → `/compras/fornecedores`
- ✅ Purchase Orders
- ✅ Fornecedores

**Vendas** → `/vendas/clientes`
- ✅ Sales Orders
- ✅ Clientes

---

## 📊 Dados de Exemplo

### Purchase Orders
```typescript
{
  code: 'PO-2024-001',
  supplier: 'Alcoa Brasil',
  quantity_tons: 1200,
  aluminum_type: 'Alumínio Primário P1020',
  status: 'submitted',
  currency: 'USD'
}
```

### Sales Orders
```typescript
{
  code: 'SO-2024-001',
  customer: 'Embraer',
  quantity_tons: 950,
  aluminum_type: 'Alumínio Primário P1020',
  status: 'hedged',
  currency: 'USD'
}
```

---

## 🔄 Workflow Típico

### 1. Compras cria PO
```
Login como compras → POs → Nova PO → Preencher → Salvar
```

### 2. Financeiro cria RFQ
```
Login como financeiro → RFQs → Novo RFQ → Vincular PO → Enviar
```

### 3. Financeiro analisa Quotes
```
RFQs → Ver Quotes → Selecionar Melhor → Executar Hedge
```

### 4. Vendas cria SO
```
Login como vendas → SOs → Nova SO → Vincular PO → Salvar
```

---

## 🎯 Checklist Inicial

### Antes de começar:
- [ ] Node.js 18+ instalado
- [ ] npm instalado
- [ ] Git clone do projeto
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas (`npm install`)

### Modo Mock:
- [ ] `VITE_USE_MOCK_DATA=true` no `.env`
- [ ] Servidor rodando (`npm run dev`)
- [ ] Acesso em http://localhost:5173
- [ ] Login funcionando

### Modo Produção:
- [ ] Backend FastAPI rodando
- [ ] CORS configurado no backend
- [ ] Usuários criados no backend
- [ ] `VITE_USE_MOCK_DATA=false` no `.env`
- [ ] Login com credenciais reais

---

## 📚 Próximos Passos

1. ✅ **README.md** - Visão geral completa
2. ✅ **INTEGRATION_GUIDE.md** - Integração detalhada
3. ✅ **BACKEND_CORS_SETUP.md** - Configurar CORS
4. ✅ **TEST_CREDENTIALS.md** - Credenciais de teste

---

## 💡 Dicas

### Performance
- Use React DevTools para debug
- Chrome DevTools → Network para ver chamadas API

### Desenvolvimento
- Hot reload automático (salve arquivos)
- Erros aparecem no console do browser

### Backend
- FastAPI Docs: `http://localhost:8000/docs`
- Teste endpoints diretamente no Swagger

---

## ✅ Tudo Pronto!

Se você seguiu os passos acima, o sistema deve estar rodando!

### Teste Rápido:
1. Acesse: http://localhost:5173
2. Faça login
3. Navegue pelos módulos
4. Crie uma PO de teste
5. Veja a lista de POs

### Próximo:
- Explore os outros módulos
- Teste criar SOs e RFQs
- Veja o MTM
- Configure o backend real

---

**🎉 Bem-vindo ao Alcast Hedge Control!**

Precisa de ajuda? Veja a documentação completa ou abra uma issue.
