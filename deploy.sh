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

# Limpar completamente o working tree
echo "   🧹 Limpando working tree..."
git reset --hard HEAD
git clean -fd

# Fazer pull das alterações do GitHub
echo "   ⬇️  Baixando atualizações..."
git pull origin main

# 2. Copiar arquivos para o diretório web do Nginx
echo ""
echo "📋 Copiando arquivos para o diretório web..."
mkdir -p $WEB_DIR

# Copiar todos os arquivos (HTML, CSS, JS, imagens, etc.)
cp -r $DOCS_DIR/* $WEB_DIR/
echo "   ✓ Arquivos copiados para $WEB_DIR"

# 3. Aplicar cache busting APENAS nos arquivos HTML do diretório web
echo ""
echo "🔄 Aplicando cache busting (v=$VERSION)..."

for html_file in $WEB_DIR/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file")
        
        # Aplicar versão em links CSS e JS
        # Remove versões antigas e adiciona a nova
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

# 5. Verificar status do repositório
echo ""
echo "🔍 Verificando repositório..."
cd $SITE_DIR
if [[ -z $(git status --porcelain) ]]; then
    echo "   ✓ Working tree limpo"
else
    echo "   ⚠️  Alterações detectadas no repositório:"
    git status --short
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