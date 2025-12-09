#!/bin/bash

echo "🔧 CORRIGINDO NGINX - compredahorta.com.br"
echo "=========================================="
echo ""

# 1. Parar containers
echo "1️⃣ Parando containers..."
docker compose down
echo ""

# 2. Remover configuração antiga do Nginx (se existir)
echo "2️⃣ Limpando configurações antigas..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/dahorta
rm -f /etc/nginx/sites-available/dahorta
echo ""

# 3. Criar configuração temporária (sem SSL primeiro)
echo "3️⃣ Criando configuração temporária..."
cat > /etc/nginx/sites-available/dahorta-temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name compredahorta.com.br www.compredahorta.com.br;
    
    # Logs
    access_log /var/log/nginx/dahorta_access.log;
    error_log /var/log/nginx/dahorta_error.log;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/dahorta-temp /etc/nginx/sites-enabled/dahorta
echo ""

# 4. Testar configuração
echo "4️⃣ Testando configuração Nginx..."
nginx -t
echo ""

# 5. Reiniciar Nginx
echo "5️⃣ Reiniciando Nginx..."
systemctl restart nginx
echo ""

# 6. Subir containers
echo "6️⃣ Iniciando containers..."
docker compose up -d --build
echo ""

# 7. Aguardar containers iniciarem
echo "7️⃣ Aguardando containers iniciarem (30s)..."
sleep 30
echo ""

# 8. Verificar status
echo "8️⃣ Status dos containers:"
docker compose ps
echo ""

# 9. Testar site
echo "9️⃣ Testando site..."
echo "Frontend:"
curl -s -I http://localhost:3000 | head -5 || echo "❌ Frontend não responde"
echo ""
echo "Backend:"
curl -s http://localhost:8000/api/health || echo "❌ Backend não responde"
echo ""

echo "=========================================="
echo "✅ Configuração básica concluída!"
echo ""
echo "🌐 Teste agora: http://compredahorta.com.br"
echo ""
echo "📝 Próximos passos para SSL:"
echo "   1. Se o site funcionar via HTTP, execute:"
echo "   2. chmod +x setup-dominio.sh"
echo "   3. nano setup-dominio.sh (coloque seu email)"
echo "   4. sudo ./setup-dominio.sh"

