#!/bin/bash

# Deploy Frontend Da Horta
# Execute: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do Frontend Da Horta..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Atualizar código
echo -e "${YELLOW}📥 Atualizando código...${NC}"
git fetch origin
git reset --hard origin/main

# 2. Criar network se não existir
echo -e "${YELLOW}🌐 Verificando network...${NC}"
docker network inspect dahorta-network >/dev/null 2>&1 || docker network create dahorta-network

# 3. Build da imagem
echo -e "${YELLOW}🔨 Buildando imagem Docker...${NC}"
docker compose build --no-cache

# 4. Parar container antigo (se existir)
echo -e "${YELLOW}🛑 Parando container antigo...${NC}"
docker compose down 2>/dev/null || true

# 5. Iniciar novo container
echo -e "${YELLOW}▶️ Iniciando container...${NC}"
docker compose up -d

# 6. Verificar status
echo -e "${YELLOW}🔍 Verificando status...${NC}"
sleep 3
docker compose ps

# 7. Health check
echo -e "${YELLOW}❤️ Testando health check...${NC}"
curl -s http://localhost:3000/health && echo ""

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Frontend rodando em: http://localhost:3000${NC}"

