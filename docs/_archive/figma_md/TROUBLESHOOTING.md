# 🔧 Troubleshooting - Alcast Hedge Control

## ✅ Problema: Erros 404 ao carregar dados

### Sintomas
```
Erro ao buscar POs: AxiosError: Request failed with status code 404
Erro ao buscar SOs: AxiosError: Request failed with status code 404
...
```

### Solução

#### 1. Verificar Modo Mock no `.env`

Abra o arquivo `/.env` e verifique:

```env
VITE_USE_MOCK_DATA=true  # ← DEVE ser "true" (com aspas)
```

⚠️ **IMPORTANTE**: O valor deve ser a string `"true"`, não o booleano.

**CORRETO**: ✅
```env
VITE_USE_MOCK_DATA=true
```

**INCORRETO**: ❌
```env
VITE_USE_MOCK_DATA=false
VITE_USE_MOCK_DATA=1
VITE_USE_MOCK_DATA=True
```

#### 2. Reiniciar o Servidor de Desenvolvimento

Após editar o `.env`, você DEVE reiniciar:

```bash
# Parar o servidor (Ctrl+C)
# Depois reiniciar:
npm run dev
```

#### 3. Limpar Cache do Browser

1. Abra as DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Empty Cache and Hard Reload"

OU:

```bash
# Limpar cache do Vite
rm -rf node_modules/.vite
npm run dev
```

#### 4. Verificar Console do Browser

Abra DevTools (F12) → Console e procure por:

```
✅ Mensagens esperadas em MODO MOCK:
📋 Configuração do Sistema:
   API URL: http://localhost:8000
   Modo Mock: ✅ ATIVO (dados mockados)
   Ambiente: Desenvolvimento

🔧 DataContext initialized
   Mode: MOCK
   API URL: http://localhost:8000
```

Se aparecer `Mode: API REAL` mas você quer mock, o `.env` não está correto.

---

## 🐛 Use o Debug Panel

Adicionamos um painel de debug que aparece no canto inferior direito:

1. Procure pelo ícone 🐛 no canto inferior direito
2. Clique para abrir o painel
3. Verifique:
   - **Modo Mock**: Deve estar ✅ ATIVO
   - **VITE_USE_MOCK_DATA**: Deve ser "true"
   - **POs**: Deve mostrar alguns itens
   - **SOs**: Deve mostrar alguns itens

Se o painel mostrar que está em modo API REAL mas você editou o `.env`, reinicie o servidor!

---

## 🔍 Diagnóstico Completo

### Checklist:

- [ ] **1. Arquivo `.env` existe na raiz do projeto**
- [ ] **2. `.env` contém `VITE_USE_MOCK_DATA=true`**
- [ ] **3. Servidor foi reiniciado após editar `.env`**
- [ ] **4. Console mostra "Modo Mock: ✅ ATIVO"**
- [ ] **5. Debug Panel mostra "Modo Mock: ✅ ATIVO"**
- [ ] **6. POs e SOs aparecem no Debug Panel**

Se TODOS os itens estão ✅ e ainda tem erro:

```bash
# Limpar tudo e recomeçar:
rm -rf node_modules
rm -rf node_modules/.vite
rm package-lock.json
npm install
npm run dev
```

---

## 🌐 Modo API Real (Backend)

Se você quer conectar ao backend real:

### 1. Editar `.env`
```env
VITE_USE_MOCK_DATA=false  # ← false para API real
VITE_API_URL=http://localhost:8000
```

### 2. Backend DEVE estar rodando
```bash
cd backend
uvicorn app.main:app --reload
```

### 3. Verificar CORS no Backend

O backend deve permitir `http://localhost:5173`:

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # ← Adicione esta linha
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Veja: `BACKEND_CORS_SETUP.md` para detalhes.

### 4. Criar Usuários no Backend

Você precisa criar usuários antes de fazer login:

Veja: `TEST_CREDENTIALS.md` para instruções.

---

## ❌ Outros Erros Comuns

### Erro: "Cannot find module './config/env'"

**Causa**: Arquivo de config não foi criado.

**Solução**: Arquivo já criado em `/src/config/env.ts`. Se ainda der erro, reinicie:
```bash
npm run dev
```

### Erro: "Module not found: axios"

**Causa**: Dependência não instalada.

**Solução**:
```bash
npm install axios
```

### Erro: "Port 5173 already in use"

**Causa**: Outra instância está rodando.

**Solução**:
```bash
# Mac/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <pid> /F
```

### Login não funciona em Modo Mock

**Solução**: Em modo mock, QUALQUER email/senha funciona:

```
Email: teste@teste.com
Senha: 123
```

Se não funcionar:
1. Abra DevTools → Console
2. Procure por mensagens de erro
3. Limpe localStorage:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

---

## 🔄 Reset Completo

Se nada funcionar, faça um reset completo:

```bash
# 1. Parar servidor (Ctrl+C)

# 2. Limpar tudo
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf dist
rm package-lock.json

# 3. Limpar localStorage do browser
# DevTools → Console:
localStorage.clear()

# 4. Reconfigurar .env
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=true
EOF

# 5. Reinstalar
npm install

# 6. Iniciar
npm run dev

# 7. Recarregar browser com cache limpo
# Ctrl+Shift+R ou Cmd+Shift+R
```

---

## 📞 Ainda com Problemas?

### 1. Verifique os Logs

**Console do Browser** (DevTools → Console):
- Deve mostrar configuração no início
- Não deve ter erros vermelhos

**Terminal do npm**:
- Deve mostrar "Local: http://localhost:5173"
- Não deve ter erros

### 2. Tire Screenshots

1. `.env` file
2. Console do browser
3. Debug Panel aberto
4. Terminal do npm

### 3. Informações Úteis

- Sistema operacional:
- Node.js version: `node -v`
- npm version: `npm -v`
- Conteúdo do `.env`:
- Modo que deseja usar: Mock ou API Real

---

## ✅ Tudo Funcionando?

Quando estiver tudo OK, você deve ver:

1. **No Console**:
   ```
   📋 Configuração do Sistema:
      API URL: http://localhost:8000
      Modo Mock: ✅ ATIVO (dados mockados)
   ```

2. **No Debug Panel** (🐛):
   - Modo Mock: ✅ ATIVO
   - POs: 2 itens
   - SOs: 2 itens

3. **Na Interface**:
   - Login funciona com qualquer email/senha
   - Listas de POs/SOs aparecem
   - Dados brasileiros realistas

---

**Pronto! O sistema deve estar funcionando perfeitamente! 🎉**
