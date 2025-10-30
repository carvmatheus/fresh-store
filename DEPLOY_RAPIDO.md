# 🚀 Deploy Rápido no GitHub Pages

## ⚡ Método Mais Rápido (3 Passos)

### 1. Inicializar Git e Fazer Commit

```bash
git init
git add .
git commit -m "feat: adiciona FreshMarket Pro com versão GitHub Pages"
```

### 2. Conectar com GitHub

Crie um repositório no GitHub ([link direto](https://github.com/new)) e execute:

```bash
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/fresh-store.git
git push -u origin main
```

**Substitua** `SEU-USUARIO` pelo seu usuário do GitHub!

### 3. Ativar GitHub Pages

1. Vá no repositório: `https://github.com/SEU-USUARIO/fresh-store`
2. Clique em **Settings** (configurações)
3. No menu lateral, clique em **Pages**
4. Em **"Source"**, selecione:
   - Branch: **main**
   - Folder: **/docs**
5. Clique em **Save**

🎉 **Pronto!** Aguarde 2-5 minutos.

Seu site estará em:
```
https://SEU-USUARIO.github.io/fresh-store
```

---

## 🎯 Usando o Script Automático

Ainda mais fácil:

```bash
./DEPLOY_GITHUB.sh
```

O script fará tudo automaticamente! Você só precisa configurar a URL do repositório quando solicitado.

---

## 🔍 Verificar se Funcionou

1. Acesse: `https://SEU-USUARIO.github.io/fresh-store`
2. Deve aparecer o site completo
3. Teste:
   - ✅ Produtos carregam
   - ✅ Filtros funcionam
   - ✅ Carrinho funciona
   - ✅ Simulador de entrega funciona

---

## ⚠️ Solução de Problemas

### Erro 404

**Causa**: GitHub Pages ainda não está ativo ou configuração errada

**Solução**:
1. Vá em Settings → Pages
2. Certifique-se que está configurado: **main** / **/docs**
3. Aguarde 5 minutos e tente novamente

### Site Aparece Mas Está em Branco

**Causa**: JavaScript não carregou

**Solução**:
1. Abra o Console do navegador (F12)
2. Veja se há erros
3. Certifique-se que `docs/app.js` está commitado:
   ```bash
   git add docs/app.js
   git commit -m "fix: adiciona JavaScript"
   git push
   ```

### Imagens Não Aparecem

**Causa**: URLs das imagens podem estar quebradas

**Solução**: As imagens usam Unsplash (URLs públicas), devem funcionar. Se não:
1. Verifique sua conexão com internet
2. As imagens são carregadas de CDN externo

---

## 🆚 Diferenças das Versões

Você tem 2 versões no projeto:

### Versão `/docs` (GitHub Pages) ✅
- HTML/CSS/JS puro
- **Funciona imediatamente** no GitHub Pages
- Acesse: `https://usuario.github.io/fresh-store`

### Versão `/` (Next.js/React) 
- Requer build para GitHub Pages
- **Melhor no Vercel**: `https://fresh-store.vercel.app`

**Recomendação**: Use a versão `/docs` para GitHub Pages. É mais simples!

---

## 📊 Comparação

| Característica | GitHub Pages | Vercel |
|----------------|--------------|--------|
| Setup | 3 comandos | 2 cliques |
| Deploy | Manual (push) | Automático |
| Build | Não precisa | Automático |
| HTTPS | ✅ Grátis | ✅ Grátis |
| Custom Domain | ✅ | ✅ |
| Analytics | ❌ | ✅ Incluído |
| Speed | ⚡⚡⚡ | ⚡⚡⚡ |
| Ideal para | HTML/CSS/JS | Next.js/React |

---

## 🎁 Bônus: Deploy Automático

Para fazer deploy automático a cada push, crie `.github/workflows/pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

Agora todo `git push` faz deploy automático! 🚀

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] Repositório criado no GitHub
- [ ] Código commitado e enviado
- [ ] GitHub Pages configurado (Settings → Pages)
- [ ] Site acessível via URL
- [ ] Produtos aparecem corretamente
- [ ] Filtros funcionam
- [ ] Carrinho funciona
- [ ] Simulador de entrega funciona
- [ ] Funciona no celular
- [ ] Compartilhado a URL com alguém

---

## 🎉 Parabéns!

Seu marketplace está no ar! 🚀

**URL**: `https://seu-usuario.github.io/fresh-store`

Compartilhe com:
- ✅ Clientes potenciais
- ✅ Portfolio
- ✅ LinkedIn
- ✅ Currículo

---

**Precisa de ajuda?** 
- Leia: [GITHUB_PAGES.md](GITHUB_PAGES.md) - Guia completo
- Docs oficiais: https://pages.github.com/

