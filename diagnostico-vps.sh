#!/bin/bash

echo "🔍 DIAGNÓSTICO DA HORTA - VPS"
echo "================================"
echo ""

echo "1️⃣ Verificando containers Docker..."
docker compose ps
echo ""

echo "2️⃣ Verificando portas em uso..."
netstat -tlnp | grep -E ':(80|443|8000|3000|27017)'
echo ""

echo "3️⃣ Verificando configuração Nginx..."
nginx -t
echo ""

echo "4️⃣ Sites habilitados no Nginx..."
ls -la /etc/nginx/sites-enabled/
echo ""

echo "5️⃣ Conteúdo da configuração do site..."
if [ -f /etc/nginx/sites-enabled/dahorta ]; then
    echo "✅ Arquivo dahorta existe"
    head -20 /etc/nginx/sites-enabled/dahorta
else
    echo "❌ Arquivo dahorta NÃO EXISTE"
fi
echo ""

echo "6️⃣ Status dos containers..."
docker compose logs --tail=30 frontend
echo ""
docker compose logs --tail=30 backend
echo ""

echo "7️⃣ Testando conectividade interna..."
echo "Backend (localhost:8000):"
curl -s http://localhost:8000/api/health || echo "❌ Backend não responde"
echo ""
echo "Frontend (localhost:80):"
curl -s -I http://localhost:80 | head -5 || echo "❌ Frontend não responde"
echo ""

echo "8️⃣ Verificando certificados SSL..."
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "❌ Nenhum certificado encontrado"
echo ""

echo "================================"
echo "✅ Diagnóstico concluído!"

