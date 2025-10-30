# 🚀 Deploy no GitHub Pages - Guia Completo

## 🎯 Opção 1: Export do Next.js (Recomendado)

Esta opção mantém todo o código React/Next.js e exporta como HTML estático.

### Passo 1: Instalar gh-pages

```bash
npm install --save-dev gh-pages
```

### Passo 2: Configurar para GitHub Pages

Renomeie o arquivo de configuração:

```bash
# Backup da config atual
mv next.config.mjs next.config.vercel.mjs

# Use a config para GitHub Pages
cp next.config.github.mjs next.config.mjs
```

**IMPORTANTE**: Edite `next.config.github.mjs` e altere `'/fresh-store'` para `'/SEU-REPOSITORIO'`

```javascript
basePath: '/fresh-store',  // Mude para o nome do seu repositório
```

### Passo 3: Fazer o Build

```bash
npm run build
```

Isso criará uma pasta `out/` com o site estático.

### Passo 4: Deploy

```bash
npm run deploy:github
```

### Passo 5: Configurar no GitHub

1. Vá no repositório no GitHub
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages** / **root**
5. Save

Aguarde 2-5 minutos e acesse:
```
https://seu-usuario.github.io/fresh-store
```

---

## 🎨 Opção 2: Versão HTML Pura (Mais Simples)

Esta opção cria uma versão alternativa usando só HTML/CSS/JS (sem React).

### Vantagens:
- ✅ Funciona direto no GitHub Pages
- ✅ Não precisa de build
- ✅ Mais rápido
- ✅ Fácil de customizar

### Como usar:

Vou criar os arquivos na pasta `docs/` (já configurada).

### Passo 1: Commit e Push

```bash
git add .
git commit -m "feat: adiciona versão HTML para GitHub Pages"
git push origin main
```

### Passo 2: Configurar GitHub Pages

1. Vá no GitHub: **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/docs**
4. Save

Pronto! Site estará em:
```
https://seu-usuario.github.io/fresh-store
```

---

## 📊 Comparação das Opções

| Feature | Opção 1 (Next.js Export) | Opção 2 (HTML Puro) |
|---------|-------------------------|---------------------|
| React/Next.js | ✅ Sim | ❌ Não |
| Complexidade | Média | Baixa |
| Manutenção | Precisa rebuild | Direto |
| Performance | ⚡⚡⚡ | ⚡⚡⚡ |
| SEO | ✅ Excelente | ✅ Bom |

---

## 🔧 Solução de Problemas

### Erro 404 no GitHub Pages

**Causa**: basePath incorreto

**Solução**: Em `next.config.github.mjs`, certifique-se que:
```javascript
basePath: '/nome-do-seu-repositorio',
```

### Imagens Não Carregam

**Causa**: Caminho relativo errado

**Solução**: Com basePath configurado, as imagens devem funcionar automaticamente.

### Build Falha

```bash
# Limpar cache e reinstalar
rm -rf .next out node_modules
npm install
npm run build
```

---

## 🎯 Qual Opção Escolher?

### Use Opção 1 (Next.js Export) se:
- ✅ Quer manter React/Next.js
- ✅ Quer melhor performance
- ✅ Está confortável com builds

### Use Opção 2 (HTML Puro) se:
- ✅ Quer máxima simplicidade
- ✅ Não quer fazer builds
- ✅ Quer editar direto no GitHub

---

## 🚀 Automatizar Deploy

### Com GitHub Actions (Opção 1)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

Agora, todo push para `main` faz deploy automático! 🎉

---

## ✅ Checklist

Após o deploy:

- [ ] Site acessível via `https://usuario.github.io/repo`
- [ ] Página inicial carrega
- [ ] Produtos aparecem
- [ ] Filtros funcionam
- [ ] Carrinho funciona
- [ ] Simulador de entrega funciona
- [ ] Imagens carregam
- [ ] Funciona no mobile

---

## 🆚 GitHub Pages vs Vercel

| Aspecto | GitHub Pages | Vercel |
|---------|--------------|--------|
| Setup | Médio | Fácil |
| Build Automático | Com Actions | Nativo |
| React/Next.js | Export apenas | Nativo |
| Custom Domain | ✅ | ✅ |
| HTTPS | ✅ | ✅ |
| Deploy Time | ~5 min | ~2 min |
| Analytics | ❌ | ✅ Grátis |

**Minha recomendação**: Use **Vercel** para projetos Next.js, é muito mais fácil! Mas se você precisa do GitHub Pages, use a Opção 2 (HTML puro).

---

## 🎉 Pronto!

Escolha sua opção e siga os passos. Em 5 minutos seu site estará no ar! 🚀

