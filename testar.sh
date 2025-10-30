#!/bin/bash

echo "🧪 Testando site localmente..."
echo ""
echo "📱 Acesse no navegador:"
echo "   → http://localhost:8080"
echo ""
echo "⏹️  Para parar o servidor: Ctrl+C"
echo ""
echo "✅ Teste antes de fazer push para o GitHub!"
echo ""

python3 -m http.server 8080 --directory docs

