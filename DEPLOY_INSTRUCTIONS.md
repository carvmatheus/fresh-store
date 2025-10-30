# 🚀 Instruções de Deploy no Vercel

## ✅ Correções Aplicadas

1. ✅ Adicionado `"use client"` no componente `product-grid.jsx`
2. ✅ Corrigido escape de backticks no README.md
3. ✅ Verificado todos os componentes JSX

## 📋 Passo a Passo para Deploy no Vercel

### 1. Preparar o Repositório

```bash
# Adicione todos os arquivos
git add .

# Commit das mudanças
git commit -m "Fix: Corrigido componente product-grid e README"

# Push para o GitHub
git push origin main
```

### 2. Deploy no Vercel

#### Opção A: Via Dashboard Vercel (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New"** → **"Project"**
4. Selecione o repositório `fresh-store`
5. Clique em **"Import"**

**Configurações Automáticas:**
- Framework: Next.js (detectado automaticamente)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

6. Clique em **"Deploy"**
7. Aguarde 2-3 minutos
8. ✅ Pronto! Seu site estará no ar

#### Opção B: Via CLI Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy em produção
vercel --prod
```

### 3. URL do Site

Após o deploy, você receberá uma URL como:
```
https://fresh-store-seuusuario.vercel.app
```

### 4. Configurar Domínio Customizado (Opcional)

1. No Dashboard do Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções

## 🔧 Variáveis de Ambiente (Opcional)

Se você tiver um backend Python deployado, adicione no Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: URL do seu backend (ex: `https://seu-backend.railway.app`)
3. Clique em **Save**
4. Faça um novo deploy

**Nota**: Por padrão, o projeto funciona **sem backend** usando dados locais simulados.

## ✨ O Que Funciona Sem Backend Python

Todas as funcionalidades principais funcionam perfeitamente:

- ✅ Catálogo de produtos (12 itens)
- ✅ Filtro por categorias
- ✅ Carrinho de compras
- ✅ Simulador de entrega
- ✅ Cálculo de frete e prazos
- ✅ Design responsivo
- ✅ Todas as imagens

O simulador de entrega usa cálculos locais baseados no CEP (arquivo `lib/products-data.js`).

## 🐍 Deploy do Backend Python (Opcional)

Se quiser usar o backend Python:

### Railway.app

1. Acesse [railway.app](https://railway.app)
2. Login com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecione seu repositório
5. Configure:
   - **Root Directory**: `api`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy
7. Copie a URL gerada
8. Adicione no Vercel como variável de ambiente

### Render.com

1. Acesse [render.com](https://render.com)
2. **New** → **Web Service**
3. Conecte seu repositório
4. Configure:
   - **Root Directory**: `api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy
6. Copie a URL e adicione no Vercel

## 🔍 Verificar se Está Funcionando

Acesse sua URL e teste:

1. ✅ Página carrega
2. ✅ Produtos aparecem
3. ✅ Filtros funcionam
4. ✅ Adicionar ao carrinho funciona
5. ✅ Simulador de entrega funciona
6. ✅ Imagens carregam
7. ✅ Responsivo no celular

## 🐛 Solução de Problemas

### Build Failed

**Erro comum**: `Module not found` ou erro com componentes

**Solução**:
```bash
# Localmente, teste o build
npm run build

# Se funcionar localmente mas não no Vercel:
# 1. Vá em Settings > General
# 2. Clique em "Clear Cache"
# 3. Faça um novo deploy
```

### Imagens Não Carregam

**Solução**: Certifique-se que as imagens estão em `/public`
- Caminho correto: `/public/alho-branco.jpg`
- No código: `/alho-branco.jpg` (sem /public)

### Erro 500

**Solução**: Verifique os logs
1. Clique no deploy
2. Veja a aba "Build Logs"
3. Procure por erros em vermelho

### Página em Branco

**Solução**: Verifique o console do navegador (F12)
- Procure por erros JavaScript
- Geralmente é erro de componente

## 📊 Monitoramento

O projeto já tem **Vercel Analytics** integrado:

1. Acesse seu projeto no Vercel
2. Clique na aba **Analytics**
3. Veja métricas de visitantes, pageviews, performance

## 🎉 Deploy Automático

Configuração automática ativada!

Toda vez que você fizer push para o GitHub:
```bash
git add .
git commit -m "Nova feature"
git push
```

O Vercel automaticamente:
1. ✅ Detecta a mudança
2. ✅ Faz o build
3. ✅ Publica a nova versão
4. ✅ Envia notificação

## 📱 Compartilhar o Site

Sua URL estará assim:
```
https://fresh-store-xyz123.vercel.app
```

Compartilhe com:
- ✅ Clientes potenciais
- ✅ Portfolio
- ✅ LinkedIn
- ✅ Apresentações

## 🎯 Próximos Passos

Após o deploy, você pode:

1. ✅ Configurar domínio próprio
2. ✅ Adicionar Google Analytics
3. ✅ Integrar com backend real
4. ✅ Adicionar mais produtos
5. ✅ Implementar pagamento
6. ✅ Adicionar autenticação

---

**💡 Dica**: O Vercel oferece:
- SSL grátis
- CDN global
- 100GB de bandwidth grátis
- Deploys ilimitados
- Preview deployments

Perfeito para projetos Next.js! 🚀

