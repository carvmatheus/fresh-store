# 🧪 Como Testar o Código Localmente

## Método 1: Abrir Direto no Navegador (Mais Simples)

### Passo 1: Abrir o arquivo HTML

```bash
# macOS
open docs/index.html

# Linux
xdg-open docs/index.html

# Windows
start docs/index.html
```

Ou simplesmente:
- Vá na pasta `docs/`
- Clique duas vezes em `index.html`

**Pronto!** O site abre no navegador.

---

## Método 2: Servidor Local Python (Recomendado)

### Por quê usar servidor local?
- Evita problemas de CORS
- Simula melhor o ambiente de produção
- Mais profissional

### ⚠️ IMPORTANTE: Os arquivos HTML estão em `docs/`

Você precisa servir a partir do diretório `docs/` ou usar a opção `--directory docs`.

### Opção A: Usando script (Mais fácil)

```bash
# Na raiz do projeto
./serve-local.sh

# Ou especificar porta diferente
./serve-local.sh 3000
```

### Opção B: Comando direto (Recomendado)

```bash
# Na raiz do projeto
python3 -m http.server 8080 --directory docs
```

**⚠️ NÃO faça isso (vai dar erro 404):**
```bash
python3 -m http.server 8080  # ❌ Servindo da raiz, arquivos HTML não serão encontrados
```

### Opção C: Entrar no diretório docs primeiro

```bash
cd docs
python3 -m http.server 8080
```

### Passo 3: Acessar no navegador

```
http://localhost:8080
```

**Para parar o servidor:** `Ctrl + C` no terminal

---

## Método 3: VS Code Live Server

Se você usa VS Code:

### Passo 1: Instalar extensão

1. Abra VS Code
2. Vá em Extensions (Ctrl+Shift+X)
3. Procure "Live Server"
4. Instale a extensão de Ritwick Dey

### Passo 2: Usar

1. Abra o arquivo `docs/index.html` no VS Code
2. Clique com botão direito
3. Selecione **"Open with Live Server"**

**Vantagem:** Atualiza automaticamente quando você salva o código!

---

## 🔄 Fluxo de Trabalho Ideal

```bash
# 1. Fazer mudanças no código
# Edite os arquivos: index.html, styles.css, app.js

# 2. Testar localmente
python3 -m http.server 8080 --directory docs

# 3. Abrir no navegador
# http://localhost:8080

# 4. Se estiver OK, fazer commit
git add docs/
git commit -m "fix: ajusta tamanho do banner"

# 5. Fazer push
git push origin main

# 6. Aguardar 2-3 minutos e verificar no GitHub Pages
# https://carvmatheus.github.io/fresh-store
```

---

## ⚡ Script Rápido

Já existe o script `serve-local.sh` na raiz do projeto:

```bash
# Tornar executável (só precisa fazer uma vez)
chmod +x serve-local.sh

# Usar
./serve-local.sh

# Ou com porta customizada
./serve-local.sh 3000
```

O script automaticamente:
- Entra no diretório `docs/`
- Inicia o servidor na porta especificada (padrão: 8080)
- Mostra a URL para acessar

---

## 🐛 Debug de Problemas

### Problema: Imagens não carregam

**Causa:** Caminho errado

**Solução:** 
- No código, use: `images/alho-branco.jpg`
- Certifique-se que as imagens estão em `docs/images/`

### Problema: JavaScript não funciona

**Causa:** Erro no código

**Solução:**
1. Abra o console do navegador (F12)
2. Veja a aba "Console"
3. Veja se há erros em vermelho

### Problema: CSS não aplica

**Causa:** Cache do navegador

**Solução:**
- **Force Refresh:** Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- Ou abra em modo anônimo: Ctrl+Shift+N

---

## 📋 Checklist Antes de Fazer Push

Teste localmente:

- [ ] Página inicial carrega
- [ ] Banner aparece com tamanho correto
- [ ] Produtos carregam com imagens
- [ ] Filtros funcionam
- [ ] Adicionar ao carrinho funciona
- [ ] Página de carrinho abre
- [ ] Checkout funciona
- [ ] Simulador de entrega calcula
- [ ] Formulário valida campos
- [ ] Modal de sucesso aparece
- [ ] Funciona no mobile (F12 → Toggle Device)

---

## 🔧 Comandos Úteis

```bash
# Ver status do Git
git status

# Ver diferenças antes de commitar
git diff docs/styles.css

# Ver histórico de commits
git log --oneline

# Desfazer mudanças não commitadas
git checkout docs/styles.css

# Ver servidor rodando
lsof -ti:8080

# Matar servidor na porta 8080
lsof -ti:8080 | xargs kill
```

---

## 🎯 Dica Pro

Use o **Inspector** do navegador:

1. Abra o site (F12)
2. Clique na setinha (Select Element)
3. Clique no elemento que quer ver
4. Veja CSS aplicado no lado direito
5. Edite CSS ao vivo para testar
6. Quando gostar, copie para seu arquivo

---

## 📱 Testar no Celular (Mesma Rede WiFi)

### Passo 1: Descobrir seu IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Ou
ipconfig getifaddr en0
```

### Passo 2: Iniciar servidor

```bash
python3 -m http.server 8080 --directory docs
```

### Passo 3: Acessar do celular

```
http://SEU_IP:8080
```

Exemplo: `http://192.168.1.100:8080`

---

## ✅ Resumo

**Mais Rápido:**
```bash
open docs/index.html
```

**Mais Profissional:**
```bash
python3 -m http.server 8080 --directory docs
# Acesse: http://localhost:8080
```

**Fluxo Completo:**
```
Editar Código → Testar Local → Commit → Push → Verificar GitHub Pages
```

---

**Agora você não precisa mais fazer push às cegas!** 🎯

