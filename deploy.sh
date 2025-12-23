#!/bin/bash
# ==============================================
# Deploy Script - Da Horta Distribuidor
# Cache Busting automático com versão timestamp
# ==============================================

set -e

# Configuração
SITE_DIR="/root/dahorta/dev/front"
DOCS_DIR="$SITE_DIR/docs"
WEB_DIR="/var/www/html"  # Diretório onde o Nginx serve os arquivos

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

# 2. Copiar arquivos para o diretório web do Nginx
echo ""
echo "📋 Copiando arquivos para o diretório web..."
mkdir -p $WEB_DIR

# Copiar todos os arquivos (HTML, CSS, JS, imagens, etc.)
cp -r $DOCS_DIR/* $WEB_DIR/
echo "   ✓ Arquivos copiados para $WEB_DIR"

# 3. Aplicar cache busting APENAS nos arquivos HTML do diretório web
# IMPORTANTE: NUNCA modificar os arquivos em $DOCS_DIR (repositório)
# Apenas modificar as cópias em $WEB_DIR
echo ""
echo "🔄 Aplicando cache busting nos arquivos..."

# Verificação de segurança: garantir que WEB_DIR não é o mesmo que DOCS_DIR
if [ "$WEB_DIR" = "$DOCS_DIR" ]; then
    echo "   ❌ ERRO: WEB_DIR não pode ser o mesmo que DOCS_DIR!"
    exit 1
fi

for html_file in $WEB_DIR/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file")
        
        # Aplicar versão em links CSS e JS
        # Remove versões antigas e adiciona a nova
        # Usar caminho absoluto para garantir que estamos no diretório correto
        sed -i -E "s/\.css(\?v=[0-9]+)?/\.css?v=$VERSION/g" "$html_file"
        sed -i -E "s/\.js(\?v=[0-9]+)?/\.js?v=$VERSION/g" "$html_file"
        
        echo "   ✓ $filename"
    fi
done

# Garantir permissões corretas
echo ""
echo "🔐 Ajustando permissões..."
chown -R nginx:nginx $WEB_DIR 2>/dev/null || chown -R www-data:www-data $WEB_DIR 2>/dev/null || true
echo "   ✓ Permissões ajustadas"

# 4. Recarregar Nginx para limpar cache do servidor
echo ""
echo "🔧 Recarregando Nginx..."
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "   ✓ Nginx recarregado com sucesso"
else
    echo "   ⚠️  Erro na configuração do Nginx:"
    nginx -t
    exit 1
fi

# 5. Verificar e garantir que o repositório está limpo
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

# 6. Exibir resumo
echo ""
echo "=============================================="
echo "✅ DEPLOY COMPLETO!"
echo "=============================================="
echo "📦 Versão: $VERSION"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "🌐 Cache busting aplicado em todos os arquivos HTML"
echo "📁 Repositório: $SITE_DIR"
echo "🌍 Diretório web: $WEB_DIR"
echo ""
echo "Os navegadores dos usuários irão carregar"
echo "automaticamente os arquivos CSS e JS atualizados."
echo "=============================================="