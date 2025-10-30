#!/bin/bash

# Script para iniciar todo o sistema com Docker

echo "🐳 Iniciando Da Horta Distribuidora com Docker"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "   Instale em: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    echo "   Instale em: https://docs.docker.com/compose/install/"
    exit 1
fi

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  ATENÇÃO: Configure o SECRET_KEY no arquivo .env antes de usar em produção!"
    echo ""
fi

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose down

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker-compose build

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo ""
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status
echo ""
echo "✅ Verificando status dos serviços..."
docker-compose ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Sistema iniciado com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Acesse:"
echo "   🌐 Frontend:  http://localhost"
echo "   🔧 Backend:   http://localhost:8000"
echo "   📚 API Docs:  http://localhost:8000/docs"
echo "   🗄️  MongoDB:   localhost:27017"
echo ""
echo "🔑 Credenciais:"
echo "   👤 Admin:   admin / admin123"
echo "   👤 Cliente: cliente / cliente123"
echo ""
echo "📊 Comandos úteis:"
echo "   Ver logs:      docker-compose logs -f"
echo "   Parar tudo:    docker-compose down"
echo "   Reiniciar:     docker-compose restart"
echo "   Ver status:    docker-compose ps"
echo ""

