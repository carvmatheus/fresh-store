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

# 1. Pull das últimas alterações
echo ""
echo "📥 Baixando alterações do repositório..."
cd $SITE_DIR

# Descartar alterações locais (cache busting será reaplicado)
echo "   🔄 Descartando alterações locais (cache busting será reaplicado)..."
git restore docs/*.html deploy.sh 2>/dev/null || true

# Fazer pull das alterações do GitHub
git pull origin main

# 2. Aplicar cache busting em todos os arquivos HTML
echo ""
echo "🔄 Aplicando cache busting nos arquivos..."

for html_file in $DOCS_DIR/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file")
        
        # Remover versões antigas e adicionar nova versão
        # CSS files
        sed -i "s/\.css\"/\.css?v=$VERSION\"/g" "$html_file"
        sed -i "s/\.css?v=[0-9]*/\.css?v=$VERSION/g" "$html_file"
        
        # JS files
        sed -i "s/\.js\"/\.js?v=$VERSION\"/g" "$html_file"
        sed -i "s/\.js?v=[0-9]*/\.js?v=$VERSION/g" "$html_file"
        
        echo "   ✓ $filename"
    fi
done

# 3. Copiar arquivos para o diretório web do Nginx
echo ""
echo "📋 Copiando arquivos para o diretório web..."
mkdir -p $WEB_DIR
# Copiar todos os arquivos (HTML, CSS, JS, imagens, etc.)
cp -r $DOCS_DIR/* $WEB_DIR/ 2>/dev/null || true
# Garantir permissões corretas
chown -R nginx:nginx $WEB_DIR 2>/dev/null || chown -R www-data:www-data $WEB_DIR 2>/dev/null || true
echo "   ✓ Arquivos copiados para $WEB_DIR"

# 4. Reiniciar Nginx para limpar cache do servidor
echo ""
echo "🔧 Recarregando Nginx..."
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "   ✓ Nginx recarregado com sucesso"
else
    echo "   ⚠️ Erro na configuração do Nginx, verificando..."
    nginx -t
fi

# 5. Exibir resumo
echo ""
echo "=============================================="
echo "✅ DEPLOY COMPLETO!"
echo "=============================================="
echo "📦 Versão: $VERSION"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "🌐 Cache busting aplicado em todos os arquivos HTML"
echo ""
echo "Os navegadores dos usuários irão carregar"
echo "automaticamente os arquivos CSS e JS atualizados."
echo "=============================================="
