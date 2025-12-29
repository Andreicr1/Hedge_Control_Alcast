#!/bin/bash

echo "🔍 Verificação do Sistema - Alcast Hedge Control"
echo "=================================================="
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js instalado: $NODE_VERSION"
else
    echo "❌ Node.js NÃO instalado!"
    exit 1
fi

echo ""

# Verificar npm
echo "📦 Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm instalado: $NPM_VERSION"
else
    echo "❌ npm NÃO instalado!"
    exit 1
fi

echo ""

# Verificar arquivo .env
echo "⚙️ Verificando arquivo .env..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env existe"
    echo ""
    echo "📄 Conteúdo do .env:"
    cat .env
    echo ""
    
    # Verificar se VITE_USE_MOCK_DATA está definido
    if grep -q "VITE_USE_MOCK_DATA" .env; then
        MOCK_VALUE=$(grep "VITE_USE_MOCK_DATA" .env | cut -d '=' -f2)
        if [ "$MOCK_VALUE" == "true" ]; then
            echo "✅ VITE_USE_MOCK_DATA=true (Modo Mock)"
        else
            echo "⚠️ VITE_USE_MOCK_DATA=$MOCK_VALUE (Modo Produção - Backend necessário)"
        fi
    else
        echo "❌ VITE_USE_MOCK_DATA não definido no .env"
    fi
else
    echo "❌ Arquivo .env NÃO encontrado!"
    echo ""
    echo "Criando .env com configurações padrão..."
    cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=true
EOF
    echo "✅ Arquivo .env criado!"
    echo ""
    echo "📄 Conteúdo:"
    cat .env
fi

echo ""

# Verificar node_modules
echo "📚 Verificando dependências..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
else
    echo "❌ node_modules NÃO encontrado!"
    echo "Execute: npm install"
fi

echo ""

# Verificar se o servidor está rodando
echo "🌐 Verificando servidor de desenvolvimento..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Servidor rodando na porta 5173"
else
    echo "⚠️ Servidor NÃO está rodando"
    echo "Execute: npm run dev"
fi

echo ""

# Verificar backend (modo produção)
if grep -q "VITE_USE_MOCK_DATA=false" .env 2>/dev/null; then
    echo "🔌 Verificando backend (Modo Produção)..."
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend respondendo em http://localhost:8000"
    else
        echo "❌ Backend NÃO está respondendo!"
        echo "   Execute no diretório do backend: uvicorn app.main:app --reload"
    fi
fi

echo ""
echo "=================================================="
echo "📋 Resumo:"
echo ""

# Resumo
ALL_OK=true

if [ ! -f ".env" ]; then
    echo "❌ .env não configurado"
    ALL_OK=false
else
    echo "✅ .env configurado"
fi

if [ ! -d "node_modules" ]; then
    echo "❌ Dependências não instaladas (npm install)"
    ALL_OK=false
else
    echo "✅ Dependências instaladas"
fi

if ! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Servidor não está rodando (npm run dev)"
    ALL_OK=false
else
    echo "✅ Servidor rodando"
fi

echo ""

if [ "$ALL_OK" = true ]; then
    echo "🎉 Sistema configurado corretamente!"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Acesse: http://localhost:5173"
    echo "   2. Login: qualquer@email.com / 123"
    echo "   3. Explore o sistema!"
else
    echo "⚠️ Algumas configurações precisam de atenção"
    echo ""
    echo "🔧 Passos para corrigir:"
    if [ ! -f ".env" ]; then
        echo "   1. Arquivo .env foi criado automaticamente"
    fi
    if [ ! -d "node_modules" ]; then
        echo "   2. Execute: npm install"
    fi
    if ! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   3. Execute: npm run dev"
    fi
    echo "   4. Abra: http://localhost:5173"
fi

echo ""
echo "📚 Documentação:"
echo "   • START_HERE.md - Início rápido"
echo "   • LOGIN_FIX.md - Solução de erros de login"
echo "   • TROUBLESHOOTING.md - Guia completo"
echo ""
