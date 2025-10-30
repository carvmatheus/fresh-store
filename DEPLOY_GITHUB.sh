#!/bin/bash

# Script para fazer deploy no GitHub Pages

echo "🚀 Deploy no GitHub Pages - FreshMarket Pro"
echo ""

# Verifica se está no repositório correto
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este não é um repositório git."
    echo "Execute primeiro: git init"
    exit 1
fi

# Adiciona todos os arquivos
echo "📦 Adicionando arquivos..."
git add .

# Commit
echo ""
echo "💾 Fazendo commit..."
read -p "Digite a mensagem do commit (ou Enter para usar padrão): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="feat: adiciona versão HTML para GitHub Pages"
fi
git commit -m "$commit_msg"

# Verifica se há remote configurado
if ! git remote | grep -q origin; then
    echo ""
    echo "⚠️  Remote 'origin' não configurado."
    echo "Configure com:"
    echo "  git remote add origin https://github.com/SEU-USUARIO/fresh-store.git"
    echo ""
    read -p "Deseja configurar agora? (s/n): " configure
    if [ "$configure" = "s" ]; then
        read -p "Digite a URL do repositório: " repo_url
        git remote add origin "$repo_url"
        echo "✅ Remote configurado!"
    else
        exit 1
    fi
fi

# Push
echo ""
echo "🚀 Enviando para GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Vá no GitHub: https://github.com/SEU-USUARIO/fresh-store"
echo "2. Clique em Settings → Pages"
echo "3. Em 'Source', selecione: 'main' / '/docs'"
echo "4. Clique em Save"
echo "5. Aguarde 2-5 minutos"
echo ""
echo "🌐 Seu site estará em: https://SEU-USUARIO.github.io/fresh-store"
echo ""

