# 🐳 Docker - Da Horta Distribuidora

Guia completo para usar o sistema com Docker.

## 🎯 Por que Docker?

- ✅ **Fácil instalação**: Um comando e tudo está pronto
- ✅ **Isolamento**: Não interfere com outras aplicações
- ✅ **Portabilidade**: Funciona igual em qualquer servidor
- ✅ **Escalabilidade**: Fácil de escalar e fazer deploy
- ✅ **Consistência**: Mesmo ambiente em dev e produção

## 📦 O que está incluído

```
Docker Compose orquestra 3 containers:
┌─────────────────────────────────────────┐
│  Frontend (Nginx)         :80           │
│  - Serve arquivos HTML/CSS/JS           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  Backend (Python/FastAPI)  :8000        │
│  - API REST                             │
│  - Autenticação JWT                     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  MongoDB                   :27017       │
│  - Banco de dados NoSQL                 │
│  - Volumes persistentes                 │
└─────────────────────────────────────────┘
```

## 🚀 Início Rápido

### 1. Instalar Docker

#### macOS:
```bash
# Instalar Docker Desktop
brew install --cask docker
# Ou baixar em: https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian):
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get install docker-compose-plugin
```

#### Windows:
Baixar Docker Desktop: https://www.docker.com/products/docker-desktop

### 2. Iniciar Sistema

```bash
# Um único comando!
./docker-start.sh
```

Ou manualmente:
```bash
docker-compose up -d
```

**Pronto!** 🎉

- **Frontend**: http://localhost
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Credenciais

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

## 🛠 Comandos Úteis

### Gerenciar containers

```bash
# Iniciar tudo
./docker-start.sh

# Parar tudo
./docker-stop.sh

# Ou manualmente:
docker-compose up -d      # Iniciar em background
docker-compose down       # Parar e remover containers
docker-compose restart    # Reiniciar
docker-compose ps         # Ver status
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Apenas MongoDB
docker-compose logs -f mongodb
```

### Executar comandos

```bash
# Acessar shell do backend
docker-compose exec backend bash

# Executar Python no backend
docker-compose exec backend python

# Acessar MongoDB shell
docker-compose exec mongodb mongosh
```

### Limpar tudo

```bash
# Parar e remover containers
docker-compose down

# Remover também os volumes (APAGA DADOS!)
docker-compose down -v

# Remover imagens não utilizadas
docker system prune -a
```

## 🔧 Configuração

### Variáveis de Ambiente

Editar arquivo `.env`:

```env
# JWT Secret (IMPORTANTE: mude em produção!)
SECRET_KEY=sua-chave-secreta-super-segura

# MongoDB
MONGODB_URL=mongodb://mongodb:27017
DB_NAME=da_horta_db

# Token expiration (minutos)
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Gerar SECRET_KEY segura

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -hex 32

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Portas Customizadas

Editar `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Usar porta 8080 ao invés de 80
  
  backend:
    ports:
      - "9000:8000"  # Usar porta 9000 ao invés de 8000
```

## 🌐 Deploy em Servidor

### 1. Preparar Servidor

```bash
# Conectar ao servidor
ssh user@seu-servidor.com

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Clonar repositório
git clone https://github.com/seu-usuario/fresh-store.git
cd fresh-store
```

### 2. Configurar Produção

```bash
# Criar .env com dados de produção
nano .env
```

```env
SECRET_KEY=chave-super-segura-gerada-aleatoriamente
MONGODB_URL=mongodb://mongodb:27017
DB_NAME=da_horta_db
ENVIRONMENT=production
```

### 3. Iniciar em Produção

```bash
# Build e start
docker-compose -f docker-compose.yml up -d --build

# Ver logs
docker-compose logs -f

# Ver status
docker-compose ps
```

### 4. Configurar Domínio (Opcional)

Se tiver um domínio, configure um proxy reverso (Nginx ou Traefik).

#### Exemplo com Nginx no host:

```nginx
# /etc/nginx/sites-available/dahorta

server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:80;
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
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/dahorta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Certbot
sudo certbot --nginx -d seudominio.com
```

## 🔒 Segurança em Produção

### Checklist:

- [ ] Mudar `SECRET_KEY` para algo aleatório
- [ ] Configurar firewall (abrir apenas 80, 443, 22)
- [ ] Habilitar SSL/HTTPS
- [ ] Usar senha forte no MongoDB (se exposto)
- [ ] Configurar backup automático
- [ ] Atualizar regularmente as imagens Docker
- [ ] Monitorar logs

### Firewall (UFW)

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📊 Monitoramento

### Ver recursos usados

```bash
# CPU, memória, network
docker stats

# Espaço em disco
docker system df
```

### Logs

```bash
# Últimas 100 linhas
docker-compose logs --tail=100

# Logs com timestamp
docker-compose logs -t

# Seguir logs em tempo real
docker-compose logs -f
```

## 🆘 Troubleshooting

### Porta já em uso

```bash
# Ver o que está usando a porta 80
sudo lsof -i :80

# Matar processo
sudo kill -9 PID

# Ou mudar porta no docker-compose.yml
```

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs backend

# Rebuild forçado
docker-compose build --no-cache backend
docker-compose up -d backend
```

### MongoDB não conecta

```bash
# Verificar se container está rodando
docker-compose ps mongodb

# Ver logs do MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb
```

### Resetar tudo

```bash
# CUIDADO: Apaga todos os dados!
docker-compose down -v
docker-compose up -d --build
```

## 📝 Backup

### Backup do MongoDB

```bash
# Criar backup
docker-compose exec mongodb mongodump --out=/backup

# Copiar para host
docker cp dahorta-mongodb:/backup ./backup-$(date +%Y%m%d)

# Ou usar volume mount para backups automáticos
```

### Restore

```bash
# Copiar backup para container
docker cp ./backup dahorta-mongodb:/backup

# Restaurar
docker-compose exec mongodb mongorestore /backup
```

## 🎓 Comandos Avançados

### Escalar serviços

```bash
# Múltiplas instâncias do backend
docker-compose up -d --scale backend=3
```

### Ver informações detalhadas

```bash
# Inspecionar container
docker inspect dahorta-backend

# Ver processos rodando
docker-compose top

# Ver eventos
docker events
```

### Atualizar código

```bash
# Pull do git
git pull origin main

# Rebuild e restart
docker-compose up -d --build
```

## 📦 Imagens Docker Hub (Opcional)

### Publicar suas imagens

```bash
# Login
docker login

# Tag das imagens
docker tag fresh-store-backend seu-usuario/dahorta-backend:latest
docker tag fresh-store-frontend seu-usuario/dahorta-frontend:latest

# Push
docker push seu-usuario/dahorta-backend:latest
docker push seu-usuario/dahorta-frontend:latest
```

### Usar imagens do Docker Hub

Editar `docker-compose.yml`:

```yaml
services:
  backend:
    image: seu-usuario/dahorta-backend:latest
    # Remover 'build' section
```

## 🌍 Deploy em Cloud

### Opções:

1. **DigitalOcean**: $5/mês - Docker pre-instalado
2. **AWS ECS**: Container service
3. **Google Cloud Run**: Serverless containers
4. **Azure Container Instances**
5. **Railway**: Deploy automático do GitHub
6. **Render**: Free tier disponível

### Exemplo Railway:

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## ❓ FAQ

**P: Preciso instalar Python e MongoDB?**  
R: Não! Docker cuida de tudo.

**P: Como atualizar o sistema?**  
R: `git pull && docker-compose up -d --build`

**P: Posso usar em produção?**  
R: Sim! Mas configure segurança (SECRET_KEY, SSL, firewall).

**P: Como fazer backup?**  
R: Use `mongodump` ou configure volumes.

**P: Docker é pesado?**  
R: Não muito. ~500MB de imagens + dados.

---

## 📚 Recursos

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [FastAPI + Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)

---

**🐳 Sistema totalmente Dockerizado e pronto para produção!**

**Dúvidas?** Consulte a documentação ou abra uma issue!

