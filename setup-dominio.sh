#!/bin/bash

# Script de configuração do domínio compredahorta.com.br
# Execute como root ou com sudo

set -e

DOMAIN="compredahorta.com.br"
EMAIL="seu-email@exemplo.com"  # ALTERE PARA SEU EMAIL

echo "🚀 Configurando domínio $DOMAIN..."

# 1. Instalar Certbot (se necessário)
echo "📦 Verificando Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# 2. Copiar configuração Nginx
echo "📝 Configurando Nginx..."
cp nginx-vps.conf /etc/nginx/sites-available/dahorta
ln -sf /etc/nginx/sites-available/dahorta /etc/nginx/sites-enabled/dahorta

# 3. Criar diretório para certbot
mkdir -p /var/www/certbot

# 4. Testar configuração Nginx
echo "🔍 Testando configuração Nginx..."
nginx -t

# 5. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

# 6. Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# 7. Recarregar Nginx novamente (agora com SSL)
echo "🔄 Recarregando Nginx com SSL..."
systemctl reload nginx

# 8. Configurar renovação automática
echo "⏰ Configurando renovação automática..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -

echo "✅ Configuração concluída!"
echo ""
echo "🌐 Seu site está disponível em:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📝 Próximos passos:"
echo "   1. Faça git pull no VPS"
echo "   2. Execute: docker compose down"
echo "   3. Execute: docker compose up -d --build"

