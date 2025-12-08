# 🚀 Guia Rápido - Configurar dahortadistribuidor.com.br

## 1️⃣ NA HOSTINGER (5 minutos)

Vá em **DNS** e adicione:

```
Tipo: A    Nome: @      Valor: 162.214.52.54
Tipo: A    Nome: www    Valor: 162.214.52.54
```

⏱️ **Aguarde 10-30 minutos** para o DNS propagar.

---

## 2️⃣ NO SEU COMPUTADOR (2 minutos)

```bash
cd fresh-store
git add .
git commit -m "feat: Configurar domínio dahortadistribuidor.com.br"
git push
```

---

## 3️⃣ NO VPS - 162.214.52.54 (10 minutos)

```bash
# Conectar
ssh usuario@162.214.52.54

# Navegar para o projeto
cd /caminho/fresh-store

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

Abra: https://dahortadistribuidor.com.br

✅ Deve aparecer seu site com cadeado verde (HTTPS)

---

## ❌ SE DER ERRO

### DNS não resolve?
```bash
# Verificar DNS
dig dahortadistribuidor.com.br
# Deve mostrar: 162.214.52.54
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
- URL: https://dahortadistribuidor.com.br
- API: https://dahortadistribuidor.com.br/api

✅ Certificado SSL grátis (Let's Encrypt)
✅ Renovação automática
✅ Redirecionamento HTTP → HTTPS
✅ www → sem www (ou vice-versa)

