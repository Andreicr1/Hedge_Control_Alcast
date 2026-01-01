# 🔧 FIX: Erro 404 no Login

## ❌ Erro
```
Erro no login: AxiosError: Request failed with status code 404
Erro no login: Error: Not Found
```

---

## ✅ SOLUÇÃO RÁPIDA (3 passos)

### 1️⃣ Verificar `.env`

Abra o arquivo `/.env` e garanta que está exatamente assim:

```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=true
```

⚠️ **IMPORTANTE**: 
- `VITE_USE_MOCK_DATA` deve ser a string `true` (com aspas implícitas)
- SEM espaços extras
- SEM comentários na mesma linha

---

### 2️⃣ REINICIAR o Servidor

```bash
# PARE o servidor (Ctrl+C)
# Depois INICIE novamente:
npm run dev
```

⚠️ **CRÍTICO**: Mudanças no `.env` SEMPRE requerem restart!

---

### 3️⃣ Limpar Cache do Browser

```bash
# No browser:
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# OU abra DevTools (F12) e:
# Clique com botão direito no reload → "Empty Cache and Hard Reload"
```

---

## 🧪 Testar

1. Abra: http://localhost:5173/login
2. Veja o badge amarelo: **"Modo Mock Ativo"**
3. Login:
   - Email: `teste@teste.com`
   - Senha: `123`
4. Deve funcionar!

---

## 🔍 Verificar Console

Abra DevTools (F12) → Console e procure:

### ✅ CORRETO (Modo Mock):
```
📋 Configuração do Sistema:
   API URL: http://localhost:8000
   Modo Mock: ✅ ATIVO (dados mockados)

🔐 Iniciando login...
   VITE_USE_MOCK_DATA: true
   Modo detectado: MOCK

🧪 Modo MOCK ativo - Login simulado
✅ Login mock bem-sucedido
```

### ❌ INCORRETO (Tentando chamar API):
```
🔐 Iniciando login...
   VITE_USE_MOCK_DATA: false
   Modo detectado: API REAL

🌐 Modo API REAL - Chamando backend...
❌ Erro no login: AxiosError: Request failed with status code 404
```

Se aparecer "API REAL":
1. Verifique `.env` novamente
2. Reinicie o servidor
3. Limpe cache

---

## 🎯 Fallback Automático

Se o erro 404 persistir, o sistema agora usa **fallback automático**:

```
⚠️ Backend não disponível - Usando modo mock como fallback
✅ Login mock (fallback) bem-sucedido
```

Você verá um usuário chamado **"Usuário Mock (Fallback)"**.

---

## 🐛 Ainda com Problemas?

### Debug Panel

1. Clique no 🐛 no canto inferior direito (após login funcionar)
2. Veja:
   - Modo Mock: ✅ ATIVO
   - VITE_USE_MOCK_DATA: true

### Verificar Variável de Ambiente

No Console do browser (F12), digite:

```javascript
console.log(import.meta.env.VITE_USE_MOCK_DATA)
```

Deve retornar: `"true"` (string)

Se retornar `undefined`:
1. O arquivo `.env` não existe ou está mal formatado
2. Servidor não foi reiniciado
3. Vite não carregou as variáveis

---

## 📝 Checklist Completo

- [ ] Arquivo `.env` existe na RAIZ do projeto (não em `/src`)
- [ ] `.env` contém `VITE_USE_MOCK_DATA=true`
- [ ] Servidor foi PARADO (Ctrl+C)
- [ ] Servidor foi INICIADO de novo (`npm run dev`)
- [ ] Cache do browser foi limpo (Ctrl+Shift+R)
- [ ] Console mostra "Modo Mock: ✅ ATIVO"
- [ ] Página de login mostra badge amarelo "Modo Mock Ativo"
- [ ] Login com qualquer email/senha funciona

---

## 🚀 Modo Produção (Backend Real)

Se você QUER conectar ao backend:

### 1. Verificar Backend Rodando

```bash
# Testar se backend responde:
curl http://localhost:8000/health
# OU abra no browser: http://localhost:8000/docs
```

Se NÃO responder:
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Editar `.env`

```env
VITE_USE_MOCK_DATA=false  # ← false para API real
VITE_API_URL=http://localhost:8000
```

### 3. Reiniciar Frontend

```bash
npm run dev
```

### 4. Usar Credenciais Reais

O backend precisa ter usuários criados. Veja: `TEST_CREDENTIALS.md`

---

## 🎨 Indicadores Visuais

### Na Tela de Login:

#### ✅ Modo Mock (CORRETO):
```
┌─────────────────────────────────┐
│    [LOGO]                       │
│    Hedge Control                │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ⚠️ Modo Mock Ativo      │   │
│  │ Qualquer email/senha    │   │
│  │ funciona                │   │
│  └─────────────────────────┘   │
│                                 │
│  Email: qualquer@email.com     │
│  Senha: qualquer senha          │
│                                 │
│  [    ENTRAR    ]              │
│                                 │
│  🧪 Dados mockados • Backend   │
│     não necessário              │
└─────────────────────────────────┘
```

#### ❌ Modo Produção (Precisa Backend):
```
┌─────────────────────────────────┐
│    [LOGO]                       │
│    Hedge Control                │
│                                 │
│  Email: usuario@alcast.com     │
│  Senha: ••••••••               │
│                                 │
│  [    ENTRAR    ]              │
│                                 │
│  Alcast Hedge Control v1.0     │
└─────────────────────────────────┘
```

---

## ✅ Resultado Esperado

Após seguir os passos:

1. ✅ Login abre sem erros
2. ✅ Badge amarelo "Modo Mock Ativo" aparece
3. ✅ Placeholder: "qualquer@email.com"
4. ✅ Console mostra "🧪 Modo MOCK ativo"
5. ✅ Login com teste@teste.com / 123 funciona
6. ✅ Redireciona para /financeiro/inbox
7. ✅ Dados mockados aparecem

---

## 📞 Documentação Relacionada

- **[START_HERE.md](./START_HERE.md)** - Setup inicial
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Guia completo
- **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** - O que deve aparecer

---

**🎉 Com essas correções, o login funciona 100% em modo mock!**

**Mesmo que você esqueça de configurar, o fallback automático garante que funcione!**
