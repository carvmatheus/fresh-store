#!/bin/bash
# ==============================================
# Deploy Script - Da Horta Distribuidor (Next.js)
# Deploy para Container Docker com Next.js
# ==============================================

set -e

# Configuração
SITE_DIR="/root/dahorta/dev/front"
CONTAINER_NAME="dahorta-frontend"
COMPOSE_FILE="docker-compose.yml"
DOCKERFILE="Dockerfile.frontend"
SERVICE_NAME="frontend"

# Gerar versão baseada no timestamp
VERSION=$(date +%s)
echo "🚀 Iniciando deploy do Next.js..."
echo "📦 Versão: $VERSION"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"

# 1. Navegar para o diretório do projeto
echo ""
echo "📁 Navegando para diretório do projeto..."
cd $SITE_DIR || {
    echo "   ❌ ERRO: Diretório $SITE_DIR não encontrado!"
    exit 1
}
echo "   ✓ Diretório: $SITE_DIR"

# 2. Limpar working tree e pull das últimas alterações
echo ""
echo "📥 Baixando alterações do repositório..."
echo "   🔄 Descartando alterações locais..."
git reset --hard HEAD
git clean -fd

echo "   ⬇️  Baixando atualizações do GitHub..."
git pull origin main

echo "   🔄 Garantindo estado limpo do repositório..."
git reset --hard origin/main
git clean -fd
echo "   ✓ Repositório atualizado e limpo"

# 3. Verificar se docker-compose está disponível
echo ""
echo "🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ ERRO: Docker não está instalado!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "   ❌ ERRO: Docker Compose não está disponível!"
    exit 1
fi

# Usar docker compose (v2) se disponível, senão docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "   ✓ Docker disponível"

# 4. Verificar se o container está rodando e pará-lo
echo ""
echo "🛑 Parando container atual..."
if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "   ⏹️  Container '${CONTAINER_NAME}' está rodando, parando..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE down || {
        echo "   ⚠️  Tentando parar container diretamente..."
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
    }
    echo "   ✓ Container parado"
else
    echo "   ℹ️  Container não está rodando"
fi

# 5. Verificar se há variáveis de ambiente necessárias
echo ""
echo "🔧 Verificando variáveis de ambiente..."
if [ -f .env ]; then
    echo "   ✓ Arquivo .env encontrado"
    source .env
else
    echo "   ⚠️  Arquivo .env não encontrado (usando valores padrão)"
fi

# Definir NEXT_PUBLIC_API_URL se não estiver definido
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    NEXT_PUBLIC_API_URL="https://compredahorta.com.br/api"
    echo "   ℹ️  NEXT_PUBLIC_API_URL não definido, usando: $NEXT_PUBLIC_API_URL"
fi

# 6. Verificar se docker-compose.yml está configurado corretamente
echo ""
echo "📝 Verificando configuração do Docker..."
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "   ❌ ERRO: Arquivo $COMPOSE_FILE não encontrado!"
    exit 1
fi

if ! grep -q "Dockerfile.frontend" "$COMPOSE_FILE"; then
    echo "   ⚠️  ATENÇÃO: docker-compose.yml não está usando Dockerfile.frontend"
    echo "   O script continuará, mas certifique-se de que o arquivo está correto"
fi

echo "   ✓ Configuração verificada"

# 7. Limpar imagens antigas (opcional, para economizar espaço)
echo ""
echo "🧹 Limpando imagens antigas..."
docker image prune -f --filter "dangling=true" || true
echo "   ✓ Limpeza concluída"

# 8. Construir e iniciar o container
echo ""
echo "🔨 Construindo imagem Docker (isso pode levar alguns minutos)..."
$DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} || {
    echo "   ❌ ERRO: Falha ao construir imagem!"
    echo "   Verifique os logs acima para mais detalhes"
    exit 1
}
echo "   ✓ Imagem construída com sucesso"

echo ""
echo "🚀 Iniciando container..."
$DOCKER_COMPOSE -f $COMPOSE_FILE up -d || {
    echo "   ❌ ERRO: Falha ao iniciar container!"
    exit 1
}
echo "   ✓ Container iniciado"

# 9. Aguardar container inicializar
echo ""
echo "⏳ Aguardando container inicializar (30 segundos)..."
sleep 30

# 10. Verificar se o container está rodando
echo ""
echo "🔍 Verificando status do container..."
if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "   ✓ Container '${CONTAINER_NAME}' está rodando"
    
    # Verificar logs para erros
    echo ""
    echo "📋 Últimas linhas dos logs:"
    docker logs --tail 20 ${CONTAINER_NAME} || true
else
    echo "   ❌ ERRO: Container não está rodando!"
    echo "   Verificando logs..."
    docker logs ${CONTAINER_NAME} || true
    exit 1
fi

# 11. Verificar se a aplicação está respondendo
echo ""
echo "🧪 Verificando se a aplicação está respondendo..."
MAX_RETRIES=10
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo "   ✓ Aplicação respondendo corretamente!"
        SUCCESS=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "   ⏳ Tentativa $RETRY_COUNT/$MAX_RETRIES... aguardando 5 segundos"
        sleep 5
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "   ⚠️  Aplicação ainda não está respondendo após $MAX_RETRIES tentativas"
    echo "   Verifique os logs: docker logs ${CONTAINER_NAME}"
    echo "   A aplicação pode estar inicializando, aguarde alguns minutos"
fi

# 12. Verificar e garantir que o repositório está limpo
echo ""
echo "🔍 Verificando repositório..."
cd $SITE_DIR

if [[ -n $(git status --porcelain) ]]; then
    echo "   ⚠️  Alterações detectadas no repositório (descartando...):"
    git status --short
    git reset --hard HEAD
    git clean -fd
    echo "   ✓ Alterações descartadas - repositório limpo"
else
    echo "   ✓ Working tree limpo"
fi

# 13. Exibir resumo
echo ""
echo "=============================================="
echo "✅ DEPLOY COMPLETO!"
echo "=============================================="
echo "📦 Versão: $VERSION"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "🐳 Container: ${CONTAINER_NAME}"
echo "🌐 Porta: 3000"
echo "📁 Repositório: $SITE_DIR"
echo "🔧 Dockerfile: ${DOCKERFILE}"
echo ""
echo "Para ver os logs em tempo real:"
echo "  docker logs -f ${CONTAINER_NAME}"
echo ""
echo "Para verificar o status:"
echo "  docker ps | grep ${CONTAINER_NAME}"
echo ""
echo "Para reiniciar o container:"
echo "  docker restart ${CONTAINER_NAME}"
echo "=============================================="
