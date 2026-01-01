# 👁️ Guia Visual - Alcast Hedge Control

## 🎯 O Que Você Deve Ver

### 1. Console do Browser (F12 → Console)

```
📋 Configuração do Sistema:
   API URL: http://localhost:8000
   Modo Mock: ✅ ATIVO (dados mockados)
   Ambiente: Desenvolvimento

🔧 DataContext initialized
   Mode: MOCK
   API URL: http://localhost:8000

Backend não disponível, usando dados mockados para POs
Backend não disponível, usando dados mockados para SOs
Backend não disponível, usando dados mockados para Suppliers
Backend não disponível, usando dados mockados para Customers
Backend não disponível, usando dados mockados para Counterparties
Backend não disponível, usando dados mockados para RFQs
Backend não disponível, usando dados mockados para Hedges
Backend não disponível, usando dados mockados para Locations
```

✅ **CORRETO**: Mensagens começam com "Backend não disponível, usando dados mockados"  
❌ **INCORRETO**: Mensagens de erro 404

---

### 2. Debug Panel (🐛)

Clique no botão roxo 🐛 no canto inferior direito:

```
┌─────────────────────────────────────┐
│ 🐛 Debug Panel                   ✕ │
├─────────────────────────────────────┤
│ ⚙️ Configuração                     │
│ API URL: http://localhost:8000     │
│ Modo Mock: ✅ ATIVO                │
│ Ambiente: Dev                       │
├─────────────────────────────────────┤
│ 🔐 Autenticação                     │
│ Autenticado: ✅ SIM                │
│ Token: ✅ Presente                  │
│ Usuário: Usuário Mock              │
│ Role: admin                         │
├─────────────────────────────────────┤
│ 📊 Dados Carregados                 │
│ Modo: 🧪 Mock                       │
│ POs: 2 itens                        │
│ SOs: 2 itens                        │
├─────────────────────────────────────┤
│ 🔧 Env Variables                    │
│ VITE_API_URL: http://localhost:8000│
│ VITE_USE_MOCK_DATA: true           │
└─────────────────────────────────────┘
```

✅ **Modo Mock: ✅ ATIVO**  
✅ **VITE_USE_MOCK_DATA: true**  
✅ **POs: 2 itens**  
✅ **SOs: 2 itens**

---

### 3. Tela de Login

```
┌─────────────────────────────────────┐
│                                     │
│         [LOGO ALCAST]               │
│                                     │
│         Hedge Control               │
│                                     │
│  Acesso Restrito - Somente Pessoal │
│         Autorizado                  │
│                                     │
│  Email                              │
│  [qualquer@email.com          ]    │
│                                     │
│  Senha                              │
│  [••••••••••••                ]    │
│                                     │
│       [    ENTRAR    ]              │
│                                     │
│  Alcast Hedge Control v1.0         │
│  Backend API Python/FastAPI         │
└─────────────────────────────────────┘
```

**EM MODO MOCK:**
- Qualquer email funciona
- Qualquer senha funciona
- Não precisa criar usuários

---

### 4. Inbox Financeiro (Após Login)

```
┌─────────────────────────────────────────────────────┐
│ Inbox - Operações Pendentes                        │
│ Revise operações de compra e venda para análise    │
├─────────────────────────────────────────────────────┤
│ [Purchase Orders (2)] [Sales Orders (2)]           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ PO-2024-001 - Alcoa Brasil      [Pendente]  │   │
│ │ Alumínio Primário P1020                      │   │
│ │                                               │   │
│ │ Quantidade: 1,200 MT                         │   │
│ │ Custo Médio: USD 2,450.00                    │   │
│ │ Total: USD 2,940,000.00                      │   │
│ │ Entrega: 15/02/2024                          │   │
│ │                                               │   │
│ │ [👁️ Ver Detalhes]                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ PO-2024-002 - Hydro Alumínio    [Pendente]  │   │
│ │ Liga de Alumínio 6061                        │   │
│ │                                               │   │
│ │ Quantidade: 850 MT                           │   │
│ │ Custo Médio: USD 2,580.00                    │   │
│ │ Total: USD 2,193,000.00                      │   │
│ │ Entrega: 01/03/2024                          │   │
│ │                                               │   │
│ │ [👁️ Ver Detalhes]                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

✅ **Deve aparecer 2 POs com dados brasileiros**  
✅ **Valores em USD**  
✅ **Fornecedores brasileiros (Alcoa, Hydro)**

---

### 5. Fornecedores (Módulo Compras)

```
┌─────────────────────────────────────────────────────┐
│ Fornecedores                                        │
│                                                     │
│ [🔍 Buscar...]                  [+ Novo Fornecedor]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Alcoa Brasil                                 │   │
│ │ 📍 Brasil                                    │   │
│ │ 📧 comercial@alcoa.com.br                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Hydro Alumínio                               │   │
│ │ 📍 Brasil                                    │   │
│ │ 📧 vendas@hydro.com                          │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ CBA - Companhia Brasileira de Alumínio      │   │
│ │ 📍 Brasil                                    │   │
│ │ 📧 suprimentos@cba.com.br                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Novelis                                      │   │
│ │ 📍 Brasil                                    │   │
│ │ 📧 comercial@novelis.com                     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

✅ **Deve aparecer 4 fornecedores brasileiros**

---

### 6. Contrapartes (Módulo Financeiro)

```
┌─────────────────────────────────────────────────────┐
│ Gestão de Contrapartes                              │
│ Bancos e Corretoras para Operações de Hedge        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Banco Itaú BBA                    [Ativo]   │   │
│ │ 📧 mesa.commodities@itau.com.br             │   │
│ │ 📞 +55 11 3708-8000                         │   │
│ │ 💰 Limite: USD 50,000,000.00                │   │
│ │ 📡 Canal: api                                │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ BTG Pactual                       [Ativo]   │   │
│ │ 📧 derivativos@btgpactual.com               │   │
│ │ 📞 +55 11 3383-2000                         │   │
│ │ 💰 Limite: USD 75,000,000.00                │   │
│ │ 📡 Canal: api                                │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Santander Corretora               [Ativo]   │   │
│ │ 📧 mesa.metais@santander.com.br             │   │
│ │ 📞 +55 11 3553-3300                         │   │
│ │ 💰 Limite: USD 40,000,000.00                │   │
│ │ 📡 Canal: email                              │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

✅ **Deve aparecer 3 contrapartes brasileiras**  
✅ **Bancos reais (Itaú, BTG, Santander)**

---

## ❌ O Que NÃO Deve Aparecer

### Console do Browser:

```
❌ INCORRETO:
Erro ao buscar POs: AxiosError: Request failed with status code 404
Erro ao buscar SOs: AxiosError: Request failed with status code 404
Network error
CORS error
```

Se aparecer isso:
1. Verifique `.env`: `VITE_USE_MOCK_DATA=true`
2. Reinicie: `npm run dev`
3. Limpe cache: Ctrl+Shift+R

---

### Debug Panel:

```
❌ INCORRETO:
Modo Mock: ❌ INATIVO
VITE_USE_MOCK_DATA: false
POs: 0 itens
SOs: 0 itens
```

Se aparecer isso:
1. Edite `.env`: `VITE_USE_MOCK_DATA=true`
2. Reinicie: `npm run dev`

---

### Interface:

```
❌ INCORRETO:
Nenhuma PO pendente
Nenhuma SO pendente
Listas vazias
Loading infinito...
```

Se aparecer isso:
1. Abra Debug Panel (🐛)
2. Veja quantos POs/SOs aparecem
3. Se for 0, limpe cache e recarregue

---

## 🎨 Cores do Sistema

O layout deve ter:
- **Azul Corporativo**: #0c4a6e (sky-900)
- **Cards brancos** com bordas sutis
- **Badges amarelos** para status pendente
- **Badges verdes** para status aprovado
- **Layout limpo e profissional**

---

## ✅ Checklist Visual

- [ ] Console mostra "Modo Mock: ✅ ATIVO"
- [ ] Debug Panel mostra "Modo Mock: ✅ ATIVO"
- [ ] Login aceita qualquer email/senha
- [ ] Inbox mostra 2 POs pendentes
- [ ] Inbox mostra 2 SOs quando trocar aba
- [ ] Fornecedores mostra 4 itens
- [ ] Clientes mostra 4 itens (Embraer, ArcelorMittal, VW, Mercedes)
- [ ] Contrapartes mostra 3 bancos
- [ ] Valores aparecem em USD
- [ ] Quantidades em MT (toneladas métricas)
- [ ] Sem erros vermelhos no console
- [ ] Layout bonito com cores azuis

---

**Se todos os itens estão ✅, seu sistema está funcionando perfeitamente! 🎉**
