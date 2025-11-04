#!/bin/bash

API="https://dahorta-backend.onrender.com/api"

echo "🔍 TESTE COMPLETO DO FLUXO"
echo "=========================="
echo ""

echo "1️⃣ STATUS DO BANCO:"
echo "-------------------"
curl -s "$API/init/status" | python3 -m json.tool
echo ""
echo ""

echo "2️⃣ PRODUTOS (/api/products):"
echo "----------------------------"
PRODUCTS=$(curl -s "$API/products")
COUNT=$(echo "$PRODUCTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "📊 Total: $COUNT produtos"

if [ "$COUNT" -eq "0" ]; then
    echo "❌ PROBLEMA: Nenhum produto no banco!"
    echo ""
    echo "🔧 SOLUÇÃO: Execute este comando para adicionar produtos:"
    echo "curl '$API/init/seed-products'"
else
    echo "✅ Produtos encontrados!"
    echo "$PRODUCTS" | python3 -m json.tool | head -50
fi

echo ""
echo ""

echo "3️⃣ VERIFICAR IMAGENS:"
echo "--------------------"
curl -s "$API/init/check-images" | python3 -m json.tool
echo ""

echo ""
echo "=========================="
echo "✅ Teste concluído!"
echo ""
echo "Se products_count = 0, execute:"
echo "  curl '$API/init/seed-products'"
echo "  curl '$API/init/update-images'"

