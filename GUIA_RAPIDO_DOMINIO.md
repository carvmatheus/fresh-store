# 🚀 Guia Rápido - Configurar compredahorta.com.br

## 1️⃣ NA HOSTINGER (5 minutos)

✅ **DNS JÁ CONFIGURADO!**

```
Tipo: A    Nome: @      Valor: 89.116.73.73
Tipo: A    Nome: www    Valor: 89.116.73.73
```

⏱️ DNS propagado e funcionando!

---

## 2️⃣ NO SEU COMPUTADOR (2 minutos)

```bash
cd fresh-store
git add .
git commit -m "feat: Configurar domínio compredahorta.com.br"
git push
```

---

## 3️⃣ NO VPS - 89.116.73.73 (10 minutos)

```bash
# Conectar
ssh root@89.116.73.73

# Navegar para o projeto
cd /root/fresh-store

# Atualizar
git pull

# IMPORTANTE: Editar email no script
nano setup-dominio.sh
# Altere: EMAIL="seu-email@exemplo.com" para seu email real

# Executar setup
chmod +x setup-dominio.sh
sudo ./setup-dominio.sh

# Rebuild containers
docker compose down
docker compose up -d --build
```

---

## 4️⃣ TESTAR

Abra: https://compredahorta.com.br

✅ Deve aparecer seu site com cadeado verde (HTTPS)

---

## ❌ SE DER ERRO

### DNS não resolve?
```bash
# Verificar DNS
dig compredahorta.com.br
# Deve mostrar: 89.116.73.73
```

### 502 Bad Gateway?
```bash
docker compose ps    # Ver se containers estão UP
docker compose logs  # Ver erros
```

### Nginx com problema?
```bash
sudo nginx -t                # Testar config
sudo systemctl restart nginx # Reiniciar
```

---

## 📝 RESUMO DO QUE MUDA

**ANTES:**
- URL: https://datastorm.cloud/dahorta
- API: https://datastorm.cloud/dahorta/api

**DEPOIS:**
- URL: https://compredahorta.com.br
- API: https://compredahorta.com.br/api

✅ Certificado SSL grátis (Let's Encrypt)
✅ Renovação automática
✅ Redirecionamento HTTP → HTTPS
✅ www → sem www (ou vice-versa)

