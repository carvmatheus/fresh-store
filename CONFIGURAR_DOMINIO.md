# 🌐 Configuração do Domínio dahortadistribuidor.com.br

Guia completo para migrar de `datastorm.cloud/dahorta` para `dahortadistribuidor.com.br`

---

## 📋 PASSO 1: Configurar DNS na Hostinger

1. Acesse o painel da Hostinger
2. Vá em **Domínios** → **dahortadistribuidor.com.br** → **DNS/Nameservers**
3. Adicione/edite os seguintes registros:

| Tipo | Nome | Valor          | TTL   |
|------|------|----------------|-------|
| A    | @    | 162.214.52.54  | 14400 |
| A    | www  | 162.214.52.54  | 14400 |

4. **Aguarde 5-30 minutos** para propagação do DNS

### ✅ Como verificar se o DNS propagou:

```bash
# No seu computador local
dig dahortadistribuidor.com.br
# ou
nslookup dahortadistribuidor.com.br
```

Deve retornar o IP: `162.214.52.54`

---

## 📋 PASSO 2: Atualizar Código Local

### 2.1. Fazer commit das alterações

```bash
cd /path/to/fresh-store
git add docker-compose.yml nginx-vps.conf setup-dominio.sh
git commit -m "feat: Configurar domínio dahortadistribuidor.com.br"
git push origin main
```

---

## 📋 PASSO 3: Configurar VPS (IP: 162.214.52.54)

### 3.1. Conectar ao VPS

```bash
ssh seu-usuario@162.214.52.54
```

### 3.2. Navegar até o diretório do projeto

```bash
cd /caminho/do/fresh-store
```

### 3.3. Atualizar o código

```bash
git pull origin main
```

### 3.4. Editar o script de setup

```bash
nano setup-dominio.sh
```

**IMPORTANTE:** Altere a linha:
```bash
EMAIL="seu-email@exemplo.com"  # COLOQUE SEU EMAIL REAL AQUI
```

### 3.5. Executar o script de configuração

```bash
chmod +x setup-dominio.sh
sudo ./setup-dominio.sh
```

Este script irá:
- ✅ Instalar Certbot (se necessário)
- ✅ Configurar Nginx
- ✅ Obter certificado SSL (HTTPS)
- ✅ Configurar renovação automática

---

## 📋 PASSO 4: Rebuild dos Containers

Após configurar o Nginx, reconstrua os containers:

```bash
# Parar containers
docker compose down

# Rebuild com novo domínio
docker compose up -d --build

# Verificar logs
docker compose logs -f
```

---

## 📋 PASSO 5: Verificar se está funcionando

Abra no navegador:
- ✅ https://dahortadistribuidor.com.br
- ✅ https://www.dahortadistribuidor.com.br
- ✅ https://dahortadistribuidor.com.br/api/docs (Swagger API)

---

## 🔧 Troubleshooting

### Problema: "502 Bad Gateway"

```bash
# Verificar se os containers estão rodando
docker compose ps

# Verificar logs
docker compose logs backend
docker compose logs frontend
```

### Problema: "Connection refused"

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: DNS não resolve

```bash
# Verificar DNS
dig dahortadistribuidor.com.br

# Limpar cache DNS (no seu computador)
# Windows:
ipconfig /flushdns

# Mac/Linux:
sudo dscacheutil -flushcache
```

### Problema: SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 📝 Checklist Final

- [ ] DNS configurado na Hostinger
- [ ] DNS propagado (verificado com `dig` ou `nslookup`)
- [ ] Código atualizado no GitHub
- [ ] Código atualizado no VPS (`git pull`)
- [ ] Script `setup-dominio.sh` executado
- [ ] SSL configurado (certificado válido)
- [ ] Containers reconstruídos (`docker compose up -d --build`)
- [ ] Site acessível via HTTPS
- [ ] API funcionando em `/api`
- [ ] Redirecionamento HTTP → HTTPS funcionando

---

## 🎯 URLs Importantes

- **Frontend:** https://dahortadistribuidor.com.br
- **API (Swagger):** https://dahortadistribuidor.com.br/api/docs
- **Admin:** https://dahortadistribuidor.com.br/admin.html
- **API Health:** https://dahortadistribuidor.com.br/api/health

---

## 📞 Suporte

Se algo der errado, verifique:

1. **Logs do Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/dahorta_error.log
   ```

2. **Logs do Docker:**
   ```bash
   docker compose logs -f
   ```

3. **Status dos serviços:**
   ```bash
   sudo systemctl status nginx
   docker compose ps
   ```

