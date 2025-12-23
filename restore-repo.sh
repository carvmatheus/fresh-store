#!/bin/bash
# ==============================================
# Script para restaurar arquivos do repositório
# Remove cache busting dos arquivos HTML em docs/
# ==============================================

set -e

# Configuração
SITE_DIR="/root/dahorta/dev/front"

echo "🔧 Restaurando arquivos do repositório..."
cd $SITE_DIR

# Descartar todas as alterações locais
echo "   🔄 Descartando alterações locais..."
git reset --hard HEAD
git clean -fd

# Fazer pull para garantir que está atualizado
echo "   ⬇️  Atualizando do GitHub..."
git pull origin main

# Garantir que está no estado limpo
git reset --hard origin/main
git clean -fd

# Verificar se está limpo
if [[ -z $(git status --porcelain) ]]; then
    echo "   ✅ Repositório restaurado e limpo!"
else
    echo "   ⚠️  Ainda há alterações. Executando limpeza adicional..."
    git reset --hard HEAD
    git clean -fd
    git status
fi

echo ""
echo "=============================================="
echo "✅ RESTAURAÇÃO COMPLETA!"
echo "=============================================="
echo "📁 Repositório: $SITE_DIR"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo "=============================================="

