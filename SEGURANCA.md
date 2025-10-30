# 🔒 Segurança - IMPORTANTE!

## ⚠️ NUNCA faça isso:

### ❌ NÃO commitar credenciais reais

```bash
# ERRADO - NÃO FAZER!
MONGODB_URL=mongodb+srv://meuusuario:minhasenha@cluster.mongodb.net/db
SECRET_KEY=chave-secreta-real-123
```

### ✅ Use placeholders na documentação

```bash
# CERTO - Usar placeholders
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
SECRET_KEY=<gere-uma-chave-aleatoria-aqui>
```

---

## 🛡️ Boas Práticas

### 1. Use .gitignore

```bash
# .gitignore
.env
.env.local
.env.production
*.pem
*.key
secrets/
```

### 2. Use .env.example

```bash
# .env.example (commitar)
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
SECRET_KEY=<gere-uma-chave-forte-aqui>
DB_NAME=da_horta_db

# .env (NÃO commitar - adicionar no .gitignore)
MONGODB_URL=mongodb+srv://meuuser:minhasenha123@cluster0.abc123.mongodb.net/producao
SECRET_KEY=chave-real-super-secreta-xyz789
DB_NAME=da_horta_db
```

### 3. Variáveis de Ambiente em Produção

#### Railway:
- Dashboard → Variables → Add Variable
- Nunca commitar valores reais

#### VPS:
```bash
# Criar .env apenas no servidor
nano .env
# Colar valores reais
# Nunca fazer git add .env
```

### 4. Gerar Chaves Seguras

```bash
# Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -hex 32

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚨 Se Você Vazou Credenciais

### 1. **Revogar imediatamente**
- MongoDB Atlas: Database Access → Delete user → Create new
- Railway: Regenerar todas as variáveis

### 2. **Remover do histórico Git**

```bash
# Instalar BFG Repo-Cleaner
brew install bfg

# Limpar arquivo
bfg --delete-files .env

# Ou limpar texto específico
bfg --replace-text passwords.txt

# Forçar push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### 3. **Verificar logs**
- Checar acessos não autorizados
- Verificar cobranças inesperadas
- Monitorar uso do banco

### 4. **Notificar**
- Fechar o alerta do GitHub
- Marcar como "revoked"
- Atualizar documentação

---

## ✅ Checklist de Segurança

Antes de fazer push:

- [ ] `.env` está no `.gitignore`
- [ ] Não tem senhas reais no código
- [ ] `.env.example` usa placeholders
- [ ] Documentação usa `<placeholders>`
- [ ] `SECRET_KEY` é aleatória e forte
- [ ] MongoDB não está exposto publicamente
- [ ] Firewall configurado corretamente
- [ ] SSL/HTTPS habilitado
- [ ] Senhas padrão foram alteradas
- [ ] Backup configurado

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)

---

## 🔐 Formato Seguro de Exemplos

### ❌ Errado:
```
mongodb+srv://admin:senha123@cluster.mongodb.net/db
```

### ✅ Correto:
```
mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DATABASE>
```

### ✅ Ainda melhor:
```
mongodb+srv://SEU_USUARIO:SUA_SENHA@seu-cluster.xxxxx.mongodb.net/seu_banco

⚠️ Substitua:
- SEU_USUARIO: seu username do MongoDB Atlas
- SUA_SENHA: sua senha do MongoDB Atlas
- seu-cluster.xxxxx: seu cluster hostname
- seu_banco: nome do seu banco de dados
```

---

**🔒 Segurança em primeiro lugar!**

**Sempre use variáveis de ambiente e NUNCA commite credenciais reais!**

