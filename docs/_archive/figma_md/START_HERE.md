# 🚀 START HERE - Alcast Hedge Control

## ⚠️ ERROS COMUNS?
- **Erro 404 no Login?** → [LOGIN_FIX.md](./LOGIN_FIX.md)
- **Erro "useAuth deve ser usado dentro de um AuthProvider"?** → [CONTEXT_ERROR_FIX.md](./CONTEXT_ERROR_FIX.md)

## 🔌 INTEGRAÇÃO COM SEU BACKEND
- **Este frontend NÃO usa Supabase!** → [PROJECT_CLEANUP.md](./PROJECT_CLEANUP.md)
- **Como conectar ao seu backend FastAPI?** → [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)

## ⚡ Quick Start (3 minutos)

### 1️⃣ Verificar `.env`

Abra `/.env` e verifique:

```env
VITE_USE_MOCK_DATA=true  # ← DEVE ser "true"
VITE_API_URL=http://localhost:8000
```

✅ Se já está assim, perfeito!  
❌ Se não está, edite e salve.

---

### 2️⃣ Instalar e Rodar

```bash
# Instalar dependências (só primeira vez)
npm install

# Iniciar servidor
npm run dev
```

Aguarde até ver:
```
  Local:   http://localhost:5173/
```

---

### 3️⃣ Acessar o Sistema

1. Abra: **http://localhost:5173**
2. Faça login:
   - **Email**: qualquer@email.com
   - **Senha**: qualquer senha
3. Navegue pelos módulos!

---

## 🐛 Debug Panel

Clique no ícone **🐛** no canto inferior direito para ver:
- Modo Mock: ✅ ATIVO
- Dados carregados
- Configurações

---

## ❌ Tem Erros?

### Se aparecer erros 404:

1. **Reinicie o servidor**:
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

2. **Limpe o cache**:
   - Browser: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
   - Terminal: 
     ```bash
     rm -rf node_modules/.vite
     npm run dev
     ```

3. **Verifique o `.env`**:
   - Deve ter `VITE_USE_MOCK_DATA=true`
   - Sem espaços extras

### Se ainda não funcionar:

Veja: **TROUBLESHOOTING.md** (guia completo de solução de problemas)

---

## 📊 O Que Você Deve Ver

### Console do Browser (F12):
```
📋 Configuração do Sistema:
   API URL: http://localhost:8000
   Modo Mock: ✅ ATIVO (dados mockados)
   Ambiente: Desenvolvimento

🔧 DataContext initialized
   Mode: MOCK
```

### Debug Panel (🐛):
```
⚙️ Configuração
  API URL: http://localhost:8000
  Modo Mock: ✅ ATIVO

📊 Dados Carregados
  Modo: 🧪 Mock
  POs: 2 itens
  SOs: 2 itens
```

### Interface:
- ✅ Login funciona
- ✅ Menus aparecem
- ✅ Listas de POs/SOs com dados
- ✅ Layout bonito azul corporativo

---

## 🎯 Próximos Passos

1. **Explore o sistema** em modo mock
2. **Quando pronto**, conecte ao backend:
   - Edite `.env`: `VITE_USE_MOCK_DATA=false`
   - Configure CORS no backend (veja `BACKEND_CORS_SETUP.md`)
   - Crie usuários (veja `TEST_CREDENTIALS.md`)

---

## 📚 Documentação Completa

- **README.md** - Visão geral do projeto
- **QUICK_START.md** - Setup detalhado
- **INTEGRATION_GUIDE.md** - Integração com backend
- **TROUBLESHOOTING.md** - Solução de problemas
- **BACKEND_CORS_SETUP.md** - Configurar CORS
- **TEST_CREDENTIALS.md** - Credenciais de teste

---

## ✅ Checklist Rápido

- [ ] `.env` existe e tem `VITE_USE_MOCK_DATA=true`
- [ ] `npm install` executado
- [ ] `npm run dev` rodando
- [ ] Browser aberto em http://localhost:5173
- [ ] Login funcionando
- [ ] Debug Panel mostra "Modo Mock: ✅ ATIVO"
- [ ] Dados aparecem nas listas

---

**Se todos os itens estão ✅, você está pronto! 🎉**

**Problemas?** → Veja TROUBLESHOOTING.md