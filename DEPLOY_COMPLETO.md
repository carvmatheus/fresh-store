# 🚀 Deploy Completo - Guia Definitivo

Todas as opções de deploy explicadas passo a passo.

## 📋 Índice

1. [Docker em VPS (Mais Controle)](#1-docker-em-vps)
2. [Railway (Mais Fácil)](#2-railway)
3. [GitHub Pages + Railway (Híbrido)](#3-github-pages--railway)
4. [Render (Grátis com limitações)](#4-render)

---

## 1. 🐳 Docker em VPS (Recomendado!)

**Melhor para:** Produção profissional, controle total

**Custo:** $5-10/mês

**Servidores:** DigitalOcean, Linode, Vultr, AWS Lightsail

### Passo a Passo

#### 1.1. Criar VPS

**DigitalOcean:**
1. Criar conta em https://digitalocean.com
2. Criar Droplet:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($5/mês)
   - Datacenter: Escolher mais próximo
3. Criar SSH Key ou usar senha

#### 1.2. Conectar ao servidor

```bash
ssh root@SEU_IP
```

#### 1.3. Instalar Docker

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

#### 1.4. Configurar firewall

```bash
# Configurar UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### 1.5. Clonar repositório

```bash
# Instalar Git
apt install git -y

# Clonar
git clone https://github.com/seu-usuario/fresh-store.git
cd fresh-store
```

#### 1.6. Configurar variáveis

```bash
# Criar .env
nano .env
```

```env
SECRET_KEY=gere-uma-chave-super-segura-aqui
MONGODB_URL=mongodb://mongodb:27017
DB_NAME=da_horta_db
ENVIRONMENT=production
```

Gerar chave:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 1.7. Iniciar sistema

```bash
# Iniciar
./docker-start.sh

# Ou manualmente
docker compose up -d --build
```

#### 1.8. Verificar

```bash
# Ver logs
docker compose logs -f

# Ver status
docker compose ps
```

#### 1.9. Acessar

```
http://SEU_IP
http://SEU_IP:8000/docs
```

#### 1.10. Configurar domínio (Opcional)

**A. Apontar domínio para IP:**
1. No seu provedor de domínio (GoDaddy, Namecheap, etc)
2. Adicionar registro A:
   - Type: A
   - Name: @
   - Value: SEU_IP
   - TTL: 3600

**B. Instalar Nginx (proxy reverso):**

```bash
# Instalar Nginx
apt install nginx -y

# Configurar
nano /etc/nginx/sites-available/dahorta
```

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/dahorta /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**C. Instalar SSL (HTTPS):**

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado
certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada!
```

**Pronto!** https://seudominio.com 🎉

---

## 2. 🚀 Railway (Mais Fácil!)

**Melhor para:** Deploy rápido, iniciantes

**Custo:** $5/mês de crédito grátis, depois $5/mês

### Passo a Passo

#### 2.1. Criar conta

https://railway.app → Sign up with GitHub

#### 2.2. Instalar CLI

```bash
npm i -g @railway/cli
```

#### 2.3. Login

```bash
railway login
```

#### 2.4. Criar projeto

```bash
cd fresh-store
railway init
```

Seguir prompts:
- Nome do projeto: `da-horta-distribuidora`
- Confirmar

#### 2.5. Adicionar MongoDB

No dashboard Railway (https://railway.app):
1. Abrir seu projeto
2. Clicar "New"
3. Database → MongoDB
4. Deploy

#### 2.6. Configurar variáveis

No dashboard:
1. Abrir serviço "backend"
2. Variables → Add Variable
3. Adicionar:
   - `SECRET_KEY`: gerar chave aleatória
   - `MONGODB_URL`: copiar do serviço MongoDB
   - `DB_NAME`: `da_horta_db`

#### 2.7. Deploy

```bash
railway up
```

#### 2.8. Obter domínio

```bash
railway domain
```

Ou no dashboard:
- Settings → Generate Domain

**URL:** https://seu-projeto.up.railway.app

#### 2.9. Atualizar frontend

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://seu-projeto.up.railway.app/api',
    TIMEOUT: 30000
};
```

```bash
git add .
git commit -m "Update API URL"
git push
railway up
```

**Pronto!** Sistema online! 🎉

---

## 3. 📄 GitHub Pages + Railway

**Melhor para:** Frontend estático grátis + Backend escalável

**Custo:** $0-5/mês (GitHub Pages grátis + Railway $5/mês)

### Passo a Passo

#### 3.1. Deploy Backend no Railway

Seguir passos do [item 2](#2-railway) até o passo 2.8.

Obter URL: `https://seu-backend.railway.app`

#### 3.2. Configurar Frontend

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://seu-backend.railway.app/api',
    TIMEOUT: 30000
};
```

#### 3.3. Commit

```bash
git add docs/config.js
git commit -m "Configure API URL for production"
git push origin main
```

#### 3.4. Ativar GitHub Pages

No GitHub:
1. Ir em Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` → `/docs`
4. Save

Aguardar 1-2 minutos.

#### 3.5. Acessar

**Frontend:** https://seu-usuario.github.io/fresh-store  
**Backend:** https://seu-backend.railway.app

**Pronto!** Sistema híbrido! 🎉

---

## 4. 🆓 Render (Grátis)

**Melhor para:** Testes, MVP, baixo tráfego

**Custo:** Grátis (com sleep após 15min inatividade)

### Passo a Passo

#### 4.1. Criar conta

https://render.com → Sign up with GitHub

#### 4.2. Criar MongoDB no Atlas

1. Criar conta em https://www.mongodb.com/cloud/atlas
2. Create Free Cluster
3. Escolher região mais próxima
4. Criar usuário e senha
5. Add IP: `0.0.0.0/0` (permitir todos)
6. Obter connection string:
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/da_horta_db
   ```

#### 4.3. Deploy Backend

No Render:
1. New → Web Service
2. Connect GitHub repository
3. Configurações:
   - Name: `dahorta-backend`
   - Environment: `Python 3`
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && python main.py`
4. Environment Variables:
   - `MONGODB_URL`: sua connection string do Atlas
   - `SECRET_KEY`: chave aleatória
   - `DB_NAME`: `da_horta_db`
5. Create Web Service

Aguardar deploy (5-10 min).

Obter URL: `https://dahorta-backend.onrender.com`

#### 4.4. Deploy Frontend

No Render:
1. New → Static Site
2. Connect repository
3. Configurações:
   - Name: `dahorta-frontend`
   - Publish directory: `docs`
4. Create Static Site

#### 4.5. Atualizar config

Editar `docs/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://dahorta-backend.onrender.com/api',
    TIMEOUT: 30000
};
```

Commit e push → Render faz redeploy automático.

**Pronto!** Sistema grátis! 🎉

**⚠️ Limitação:** Backend "dorme" após 15min sem uso. Primeira requisição após sleep demora 30-60s.

---

## 🔒 Checklist de Segurança

Antes de colocar em produção:

- [ ] Gerar `SECRET_KEY` aleatória forte
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall
- [ ] Mudar senhas padrão (admin/cliente)
- [ ] Configurar backup do MongoDB
- [ ] Configurar CORS adequadamente
- [ ] Monitorar logs
- [ ] Configurar limite de taxa (rate limiting)

---

## 📊 Comparação

| Opção | Custo | Dificuldade | Performance | Controle |
|-------|-------|-------------|-------------|----------|
| **VPS + Docker** | $5-10/mês | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Railway** | $5/mês | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **GH Pages + Railway** | $0-5/mês | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Render Free** | Grátis | ⭐ | ⭐⭐ | ⭐⭐ |

---

## 🎯 Recomendação

### Para Aprender:
**Render Free** → Sem custo, fácil

### Para MVP/Startup:
**Railway** → Balanço perfeito entre facilidade e performance

### Para Produção:
**VPS + Docker** → Máximo controle e performance

---

## 🆘 Suporte

Problemas no deploy?

1. **Checar logs:**
   - Railway: Dashboard → Logs
   - Render: Dashboard → Logs
   - VPS: `docker compose logs -f`

2. **Verificar variáveis:**
   - `SECRET_KEY` configurada?
   - `MONGODB_URL` correto?
   - URLs configuradas no frontend?

3. **Testar localmente:**
   ```bash
   ./docker-start.sh
   ```

4. **Abrir issue no GitHub**

---

**🚀 Escolha sua opção e bora pro ar!**

**Dúvidas?** Consulte a documentação específica de cada serviço!

