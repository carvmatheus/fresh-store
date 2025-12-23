# 🔧 Solução: Problema de Cache Busting no Deploy

## ❌ Problema

O script `deploy.sh` estava modificando os arquivos HTML no diretório `docs/` (repositório), aplicando cache busting neles. Isso causava:

- Arquivos modificados no Git (`git status` mostrava alterações)
- Impossibilidade de fazer push limpo para o GitHub
- Conflitos entre servidor e repositório

## ✅ Solução Implementada

### 1. Correção do Script `deploy.sh`

O script agora:

1. **Descarta alterações locais ANTES do pull** - garante estado limpo
2. **Faz pull do GitHub** - atualiza com as últimas alterações
3. **Reseta para origin/main** - garante que está sincronizado
4. **Copia arquivos para `/var/www/html`** - cria cópias no diretório web
5. **Aplica cache busting APENAS nas cópias** - nunca modifica os arquivos originais
6. **Verifica e limpa no final** - garante que o repositório permanece limpo

### 2. Mudanças Principais

- Cache busting aplicado **APENAS** em `/var/www/html/*.html` (cópias)
- Cache busting **NUNCA** aplicado em `docs/*.html` (repositório)
- Verificação de segurança para evitar modificar arquivos errados
- Limpeza automática no final do script

### 3. Script de Restauração

Criei o script `restore-repo.sh` para restaurar os arquivos caso necessário:

```bash
chmod +x restore-repo.sh
./restore-repo.sh
```

## 🚀 Como Usar

### No Servidor (VPS)

1. **Primeira vez (para restaurar arquivos modificados):**
   ```bash
   cd /root/dahorta/dev/front
   git reset --hard origin/main
   git clean -fd
   ```

2. **Para fazer deploy normalmente:**
   ```bash
   cd /root/dahorta/dev/front
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Local (para commitar e fazer push)

```bash
# Adicionar alterações
git add .

# Commitar
git commit -m "Sua mensagem"

# Fazer push
git push origin main
```

## 🔍 Como Verificar se Está Funcionando

### No Servidor

Após rodar `deploy.sh`, verifique:

```bash
cd /root/dahorta/dev/front
git status
```

**Resultado esperado:**
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

### Verificar Cache Busting

Os arquivos em `/var/www/html/` devem ter versões nos links CSS/JS:
```html
<link rel="stylesheet" href="styles.css?v=1766528826">
<script src="app.js?v=1766528826"></script>
```

Os arquivos em `docs/` devem estar **sem** versões:
```html
<link rel="stylesheet" href="styles.css">
<script src="app.js"></script>
```

## 📝 Fluxo Completo

### 1. Desenvolver Localmente
```bash
# Fazer alterações nos arquivos
# ...

# Commitar e fazer push
git add .
git commit -m "Minhas alterações"
git push origin main
```

### 2. Deploy no Servidor
```bash
ssh usuario@servidor
cd /root/dahorta/dev/front
./deploy.sh
```

### 3. Verificar
```bash
# No servidor
git status  # Deve estar limpo
```

## ⚠️ Importante

- **NUNCA** commite arquivos com cache busting (versões `?v=...`)
- O cache busting é aplicado **automaticamente** no servidor
- Os arquivos no repositório devem estar **limpos** (sem versões)
- Se `git status` mostrar alterações após o deploy, execute `./restore-repo.sh`

## 🔄 Se Ainda Houver Problemas

1. **Restaurar repositório:**
   ```bash
   cd /root/dahorta/dev/front
   ./restore-repo.sh
   ```

2. **Ou manualmente:**
   ```bash
   cd /root/dahorta/dev/front
   git reset --hard origin/main
   git clean -fd
   git pull origin main
   ```

3. **Verificar se está limpo:**
   ```bash
   git status
   ```

## ✅ Checklist

- [ ] Script `deploy.sh` atualizado
- [ ] Script `restore-repo.sh` criado
- [ ] Repositório restaurado (se necessário)
- [ ] Deploy testado no servidor
- [ ] `git status` mostra working tree limpo após deploy
- [ ] Cache busting funciona (arquivos em `/var/www/html` têm versões)
- [ ] Arquivos em `docs/` estão sem versões (repositório limpo)

