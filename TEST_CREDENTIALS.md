# 🧪 Credenciais de Teste

Este arquivo contém credenciais de exemplo para testar o sistema em modo **desenvolvimento**.

> ⚠️ **ATENÇÃO**: Estas são credenciais MOCKADAS apenas para teste. Em produção, use credenciais reais do backend.

---

## 🔐 Usuários de Teste (Backend)

### 1. Admin
```
Email: admin@alcast.com
Senha: admin123
Role: admin
```
**Acesso**: Todas as áreas do sistema

---

### 2. Financeiro
```
Email: financeiro@alcast.com
Senha: fin123
Role: financeiro
```
**Acesso**: 
- ✅ RFQs
- ✅ Contrapartes
- ✅ MTM
- ✅ Relatórios
- ✅ Inbox

---

### 3. Compras
```
Email: compras@alcast.com
Senha: comp123
Role: compras
```
**Acesso**:
- ✅ Purchase Orders
- ✅ Fornecedores
- ✅ KYC

---

### 4. Vendas
```
Email: vendas@alcast.com
Senha: vend123
Role: vendas
```
**Acesso**:
- ✅ Sales Orders
- ✅ Clientes

---

### 5. Estoque
```
Email: estoque@alcast.com
Senha: est123
Role: estoque
```
**Acesso**:
- ✅ Gestão de Estoque
- ✅ Lotes de Alumínio

---

## 🚀 Como Criar Usuários no Backend

### Usando Python Script

```python
# backend/create_test_users.py
from app.database import SessionLocal
from app.models import User, Role
from app.services.auth import get_password_hash

db = SessionLocal()

# Criar roles
roles = {
    'admin': Role(name='admin', description='Administrador'),
    'financeiro': Role(name='financeiro', description='Time Financeiro'),
    'compras': Role(name='compras', description='Time de Compras'),
    'vendas': Role(name='vendas', description='Time de Vendas'),
}

for role in roles.values():
    db.add(role)
db.commit()

# Criar usuários
users = [
    User(
        email='admin@alcast.com',
        name='Admin User',
        password_hash=get_password_hash('admin123'),
        role_id=roles['admin'].id,
        active=True
    ),
    User(
        email='financeiro@alcast.com',
        name='User Financeiro',
        password_hash=get_password_hash('fin123'),
        role_id=roles['financeiro'].id,
        active=True
    ),
    User(
        email='compras@alcast.com',
        name='User Compras',
        password_hash=get_password_hash('comp123'),
        role_id=roles['compras'].id,
        active=True
    ),
    User(
        email='vendas@alcast.com',
        name='User Vendas',
        password_hash=get_password_hash('vend123'),
        role_id=roles['vendas'].id,
        active=True
    ),
]

for user in users:
    db.add(user)

db.commit()
print("✅ Usuários de teste criados com sucesso!")
```

### Executar Script
```bash
cd backend
python create_test_users.py
```

---

## 🧪 Testando Login

### 1. Modo Mock (Frontend)
```env
# .env
VITE_USE_MOCK_DATA=true
```

Qualquer email/senha irá funcionar e retornar um usuário mockado.

### 2. Modo API Real (Backend)
```env
# .env
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://localhost:8000
```

Use as credenciais criadas no backend.

---

## 🔍 Verificando Usuários no Backend

### Via API (Swagger)
1. Acesse `http://localhost:8000/docs`
2. Faça login com POST `/auth/token`
3. Use o token para testar GET `/auth/me`

### Via Database
```sql
-- PostgreSQL
SELECT id, email, name, active 
FROM users;

SELECT id, name, description 
FROM roles;
```

---

## 📋 Checklist de Teste

### Autenticação
- [ ] Login com admin
- [ ] Login com financeiro
- [ ] Login com compras
- [ ] Login com vendas
- [ ] Logout
- [ ] Token expira após 30 minutos
- [ ] Redirecionamento automático baseado em role

### Purchase Orders (Compras)
- [ ] Listar POs
- [ ] Criar nova PO
- [ ] Visualizar detalhes da PO
- [ ] Atualizar status da PO

### Sales Orders (Vendas)
- [ ] Listar SOs
- [ ] Criar nova SO
- [ ] Vincular SO com PO
- [ ] Visualizar detalhes da SO

### RFQs (Financeiro)
- [ ] Listar RFQs
- [ ] Criar novo RFQ
- [ ] Enviar RFQ para contrapartes
- [ ] Visualizar quotes recebidas

### Contrapartes (Financeiro)
- [ ] Listar contrapartes
- [ ] Visualizar detalhes da contraparte
- [ ] Verificar limites de crédito

### Estoque
- [ ] Visualizar lotes
- [ ] Ver disponibilidade vs. comprometido
- [ ] Ver MTM por lote

---

## ⚡ Quick Test

### Test Script (Frontend)
```bash
# 1. Configurar modo mock
echo "VITE_USE_MOCK_DATA=true" > .env
echo "VITE_API_URL=http://localhost:8000" >> .env

# 2. Iniciar frontend
npm run dev

# 3. Acessar http://localhost:5173
# Login: qualquer email/senha funciona em modo mock

# 4. Testar com backend real
echo "VITE_USE_MOCK_DATA=false" > .env
# Agora use credenciais reais do backend
```

---

## 🔒 Segurança

### ⚠️ NUNCA FAÇA ISSO EM PRODUÇÃO:
- ❌ Senhas simples como "123"
- ❌ Senhas em plain text
- ❌ Credenciais commitadas no Git
- ❌ Token sem expiração
- ❌ CORS aberto para "*"

### ✅ Em Produção USE:
- ✅ Senhas fortes (12+ caracteres)
- ✅ Hashing bcrypt
- ✅ Variáveis de ambiente
- ✅ Tokens com expiração
- ✅ CORS restrito
- ✅ HTTPS obrigatório
- ✅ Rate limiting
- ✅ 2FA (opcional)

---

## 📚 Referências

- **JWT Best Practices**: https://jwt.io/introduction
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **OWASP Guidelines**: https://owasp.org/www-project-web-security-testing-guide/

---

**Lembre-se**: Estas credenciais são apenas para TESTE! 🧪
