#!/bin/bash

# 🚀 Alcast Hedge Control - Setup Script
# Este script facilita a configuração inicial do projeto

echo "🚀 Alcast Hedge Control - Setup"
echo "================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"
echo ""

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm primeiro."
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"
echo ""

# Perguntar modo de operação
echo "📋 Selecione o modo de operação:"
echo "1) Desenvolvimento (dados mockados - backend não necessário)"
echo "2) Produção (conectar ao backend FastAPI)"
read -p "Escolha (1 ou 2): " modo

if [ "$modo" == "1" ]; then
    echo ""
    echo "📝 Configurando modo DESENVOLVIMENTO..."
    cat > .env << EOF
# Backend API Configuration
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=true
EOF
    echo "✅ Modo desenvolvimento configurado!"
    echo "   → Usando dados mockados"
    echo "   → Backend não é necessário"
elif [ "$modo" == "2" ]; then
    echo ""
    read -p "📝 URL do backend (padrão: http://localhost:8000): " backend_url
    backend_url=${backend_url:-http://localhost:8000}
    
    cat > .env << EOF
# Backend API Configuration
VITE_API_URL=$backend_url
VITE_USE_MOCK_DATA=false
EOF
    echo "✅ Modo produção configurado!"
    echo "   → Conectando ao backend: $backend_url"
    echo "   → Certifique-se que o backend está rodando"
else
    echo "❌ Opção inválida. Execute o script novamente."
    exit 1
fi

echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências."
    exit 1
fi

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "🎉 Próximos passos:"
echo ""
if [ "$modo" == "1" ]; then
    echo "   1. Execute: npm run dev"
    echo "   2. Acesse: http://localhost:5173"
    echo "   3. Login: qualquer email/senha funciona em modo mock"
else
    echo "   1. Certifique-se que o backend está rodando em $backend_url"
    echo "   2. Execute: npm run dev"
    echo "   3. Acesse: http://localhost:5173"
    echo "   4. Login com credenciais do backend"
fi
echo ""
echo "📚 Documentação:"
echo "   → README.md - Visão geral do projeto"
echo "   → INTEGRATION_GUIDE.md - Guia de integração completo"
echo "   → BACKEND_CORS_SETUP.md - Configuração de CORS no backend"
echo "   → TEST_CREDENTIALS.md - Credenciais de teste"
echo ""
echo "💡 Dica: Para mudar entre modo mock e produção, edite o arquivo .env"
echo ""
