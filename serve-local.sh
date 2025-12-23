#!/bin/bash
# ==============================================
# Script para servir o site localmente
# Inicia servidor HTTP na pasta docs/
# ==============================================

# Obter diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCS_DIR="$SCRIPT_DIR/docs"
PORT=${1:-8080}

echo "🌐 Iniciando servidor local..."
echo "📁 Diretório: $DOCS_DIR"
echo "🔌 Porta: $PORT"
echo ""
echo "Acesse: http://localhost:$PORT"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo "=============================================="
echo ""

# Entrar no diretório docs e iniciar servidor
cd "$DOCS_DIR"
python3 -m http.server "$PORT"

