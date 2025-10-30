# ⚡ Quick Start - Da Horta Distribuidora

Guia rápido para colocar o sistema no ar em **5 minutos**!

## 🎯 Pré-requisitos

- Python 3.11+
- MongoDB
- Terminal/CMD

## 📝 Passo a Passo

### 1️⃣ Instalar MongoDB (se ainda não tiver)

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

#### Windows:
Baixe em: https://www.mongodb.com/try/download/community

### 2️⃣ Clonar e Preparar

```bash
git clone https://github.com/carvmatheus/fresh-store.git
cd fresh-store
```

### 3️⃣ Iniciar Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python main.py
```

✅ Backend rodando em: **http://localhost:8000**

### 4️⃣ Iniciar Frontend (nova aba do terminal)

```bash
cd docs
python3 -m http.server 8080
```

✅ Frontend rodando em: **http://localhost:8080**

## 🔑 Credenciais

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

## 🧪 Testar

1. Abra: http://localhost:8080
2. Clique em "Entrar"
3. Use as credenciais acima
4. Explore o sistema!

## 📚 Próximos Passos

- Leia o [README completo](README.md)
- Veja a [documentação da API](http://localhost:8000/docs)
- Confira o [guia de integração](INTEGRACAO_FRONTEND_BACKEND.md)

---

**Problemas?** Abra uma issue no GitHub!

