#!/bin/bash
# ==============================================
# Deploy Script - Da Horta Distribuidor
# Deploy para Container Docker + Cache Busting
# ==============================================

set -e

# Configuração
SITE_DIR="/root/dahorta/dev/front"
DOCS_DIR="$SITE_DIR/docs"
CONTAINER_NAME="dahorta-frontend"
CONTAINER_WEB_DIR="/usr/share/nginx/html"

# Gerar versão baseada no timestamp
VERSION=$(date +%s)
echo "🚀 Iniciando deploy..."
echo "📦 Versão: $VERSION"

# 1. Limpar working tree e pull das últimas alterações
echo ""
echo "📥 Baixando alterações do repositório..."
cd $SITE_DIR

# Descartar TODAS as alterações locais primeiro
echo "   🔄 Descartando alterações locais (cache busting será reaplicado)..."
git reset --hard HEAD
git clean -fd

# Fazer pull das alterações do GitHub
echo "   ⬇️  Baixando atualizações..."
git pull origin main

# Garantir que os arquivos do repositório estão limpos após o pull
echo "   🔄 Garantindo estado limpo do repositório..."
git reset --hard origin/main
git clean -fd

# 2. Verificar se o container está rodando
echo ""
echo "🐳 Verificando container Docker..."
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "   ❌ ERRO: Container '${CONTAINER_NAME}' não está rodando!"
    echo "   Execute: docker ps"
    exit 1
fi
echo "   ✓ Container '${CONTAINER_NAME}' está rodando"

# 3. Criar diretório temporário para processar arquivos
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT
echo ""
echo "📋 Preparando arquivos para deploy..."

# Copiar todos os arquivos para diretório temporário
cp -r $DOCS_DIR/* $TEMP_DIR/
echo "   ✓ Arquivos copiados para diretório temporário"

# 4. Aplicar cache busting APENAS nos arquivos HTML do diretório temporário
# IMPORTANTE: NUNCA modificar os arquivos em $DOCS_DIR (repositório)
echo ""
echo "🔄 Aplicando cache busting nos arquivos HTML..."

for html_file in $TEMP_DIR/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file")
        
        # Aplicar versão em links CSS e JS
        # Remove versões antigas e adiciona a nova
        sed -i -E "s/\.css(\?v=[0-9]+)?/\.css?v=$VERSION/g" "$html_file"
        sed -i -E "s/\.js(\?v=[0-9]+)?/\.js?v=$VERSION/g" "$html_file"
        
        echo "   ✓ $filename"
    fi
done

# 5. Copiar arquivos para dentro do container Docker
echo ""
echo "📦 Copiando arquivos para o container Docker..."

# Copiar todos os arquivos para o container
docker cp $TEMP_DIR/. ${CONTAINER_NAME}:${CONTAINER_WEB_DIR}/

# Garantir permissões corretas dentro do container
docker exec ${CONTAINER_NAME} chown -R nginx:nginx ${CONTAINER_WEB_DIR} 2>/dev/null || \
docker exec ${CONTAINER_NAME} chown -R www-data:www-data ${CONTAINER_WEB_DIR} 2>/dev/null || true

echo "   ✓ Arquivos copiados para o container"

# 6. Recarregar Nginx dentro do container
echo ""
echo "🔧 Recarregando Nginx no container..."
docker exec ${CONTAINER_NAME} nginx -s reload 2>/dev/null || {
    echo "   ⚠️  Falha ao recarregar, tentando reiniciar container..."
    docker restart ${CONTAINER_NAME}
    echo "   ✓ Container reiniciado"
}
echo "   ✓ Nginx atualizado"

# 7. Verificar e garantir que o repositório está limpo
echo ""
echo "🔍 Verificando repositório..."
cd $SITE_DIR

# Se houver alterações, descartá-las (não devem existir se tudo funcionou corretamente)
if [[ -n $(git status --porcelain) ]]; then
    echo "   ⚠️  Alterações detectadas no repositório (descartando...):"
    git status --short
    git reset --hard HEAD
    git clean -fd
    echo "   ✓ Alterações descartadas - repositório limpo"
else
    echo "   ✓ Working tree limpo"
fi

# Verificação final
if [[ -n $(git status --porcelain) ]]; then
    echo "   ❌ ERRO: Ainda há alterações após limpeza!"
    echo "   Execute manualmente: cd $SITE_DIR && git reset --hard HEAD && git clean -fd"
    exit 1
fi

# 8. Verificar se o deploy funcionou
echo ""
echo "🧪 Verificando deploy..."
sleep 2  # Aguardar container processar
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✓ Container respondendo corretamente"
else
    echo "   ⚠️  Container pode estar inicializando, aguarde alguns segundos"
fi

# 9. Exibir resumo
echo ""
echo "=============================================="
echo "✅ DEPLOY COMPLETO!"
echo "=============================================="
echo "📦 Versão: $VERSION"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "🐳 Container: ${CONTAINER_NAME}"
echo "🌐 Cache busting aplicado em todos os arquivos HTML"
echo "📁 Repositório: $SITE_DIR"
echo ""
echo "Os navegadores dos usuários irão carregar"
echo "automaticamente os arquivos CSS e JS atualizados."
echo "=============================================="
