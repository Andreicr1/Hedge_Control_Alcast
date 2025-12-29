@echo off
REM Alcast Hedge Control - Setup Script (Windows)
REM Este script facilita a configuração inicial do projeto

echo ========================================
echo   Alcast Hedge Control - Setup
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Por favor, instale Node.js 18+ primeiro.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version
echo.

REM Verificar se npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] npm nao encontrado. Por favor, instale npm primeiro.
    pause
    exit /b 1
)

echo [OK] npm encontrado
npm --version
echo.

REM Perguntar modo de operação
echo Selecione o modo de operacao:
echo 1) Desenvolvimento (dados mockados - backend nao necessario)
echo 2) Producao (conectar ao backend FastAPI)
echo.
set /p modo="Escolha (1 ou 2): "

if "%modo%"=="1" (
    echo.
    echo Configurando modo DESENVOLVIMENTO...
    (
        echo # Backend API Configuration
        echo VITE_API_URL=http://localhost:8000
        echo VITE_USE_MOCK_DATA=true
    ) > .env
    echo [OK] Modo desenvolvimento configurado!
    echo    - Usando dados mockados
    echo    - Backend nao e necessario
) else if "%modo%"=="2" (
    echo.
    set /p backend_url="URL do backend (padrao: http://localhost:8000): "
    if "%backend_url%"=="" set backend_url=http://localhost:8000
    (
        echo # Backend API Configuration
        echo VITE_API_URL=%backend_url%
        echo VITE_USE_MOCK_DATA=false
    ) > .env
    echo [OK] Modo producao configurado!
    echo    - Conectando ao backend: %backend_url%
    echo    - Certifique-se que o backend esta rodando
) else (
    echo [ERRO] Opcao invalida. Execute o script novamente.
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo [ERRO] Erro ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup concluido com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo.
if "%modo%"=="1" (
    echo   1. Execute: npm run dev
    echo   2. Acesse: http://localhost:5173
    echo   3. Login: qualquer email/senha funciona em modo mock
) else (
    echo   1. Certifique-se que o backend esta rodando
    echo   2. Execute: npm run dev
    echo   3. Acesse: http://localhost:5173
    echo   4. Login com credenciais do backend
)
echo.
echo Documentacao:
echo   - README.md - Visao geral do projeto
echo   - INTEGRATION_GUIDE.md - Guia de integracao completo
echo   - BACKEND_CORS_SETUP.md - Configuracao de CORS no backend
echo   - TEST_CREDENTIALS.md - Credenciais de teste
echo.
echo Dica: Para mudar entre modo mock e producao, edite o arquivo .env
echo.
pause
