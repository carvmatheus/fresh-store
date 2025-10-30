#!/bin/bash

# Script para parar todo o sistema Docker

echo "🛑 Parando Da Horta Distribuidora..."
echo ""

# Parar containers
docker-compose down

echo ""
echo "✅ Sistema parado!"
echo ""
echo "💡 Para iniciar novamente: ./docker-start.sh"
echo "💡 Para remover dados:     docker-compose down -v"
echo ""

