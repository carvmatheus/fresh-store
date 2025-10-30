# ✅ Backend no Render - Próximos Passos

## 🎯 Status Atual

✅ **Backend:** https://fresh-store.onrender.com  
✅ **Código atualizado:** Frontend configurado para usar o Render  
⏭️ **Próximo:** Ativar GitHub Pages

---

## 🧪 1. Testar Backend

### Verificar se está funcionando:

**Health Check:**
```
https://fresh-store.onrender.com/health
```
Deve retornar: `{"status":"healthy"}`

**API Docs (Swagger):**
```
https://fresh-store.onrender.com/docs
```
Deve abrir a documentação interativa!

**Listar Produtos:**
```
https://fresh-store.onrender.com/api/products
```

---

## 🗄️ 2. Inicializar Banco de Dados

### Opção 1: Via Render Shell

1. Ir no dashboard Render
2. Abrir o serviço `fresh-store`
3. Clicar em **Shell** (botão superior direito)
4. Executar:
```bash
python init_db.py
```

Isso vai criar:
- ✅ 2 usuários (admin e cliente)
- ✅ 12 produtos iniciais
- ✅ Índices do MongoDB

### Opção 2: Via endpoint temporário

Se não conseguir via Shell, posso criar um endpoint `/init-db` para inicializar.

---

## 🎨 3. Ativar GitHub Pages

### Passo a passo:

1. **Ir em Settings:**
   ```
   https://github.com/carvmatheus/fresh-store/settings/pages
   ```

2. **Configurar:**
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/docs`
   - Clicar em **Save**

3. **Aguardar 1-2 minutos**

4. **Acessar:**
   ```
   https://carvmatheus.github.io/fresh-store
   ```

---

## 📊 URLs Finais

| Serviço | URL |
|---------|-----|
| **Frontend** | https://carvmatheus.github.io/fresh-store |
| **Backend** | https://fresh-store.onrender.com |
| **API Docs** | https://fresh-store.onrender.com/docs |
| **Health** | https://fresh-store.onrender.com/health |

---

## 🔑 Credenciais

Após inicializar o banco (`init_db.py`):

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Cliente:**
- Usuário: `cliente`
- Senha: `cliente123`

---

## ⚠️ Importante

### Sleep do Render Free

O plano free do Render "dorme" após 15 minutos sem uso:
- Primeira requisição após sleep: 30-60 segundos
- Requisições seguintes: normal

**Solução:** Usar UptimeRobot (grátis) para manter ativo:
1. Criar conta em https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://fresh-store.onrender.com/health`
4. Interval: 5 minutes

---

## 🐛 Troubleshooting

### Backend não responde

1. **Verificar logs no Render:**
   - Dashboard → Logs
   - Ver mensagens de erro

2. **Variáveis configuradas?**
   - `MONGODB_URL`
   - `SECRET_KEY`
   - `DB_NAME`

3. **MongoDB Atlas:**
   - IP `0.0.0.0/0` liberado?
   - Usuário/senha corretos?

### Frontend não conecta

1. **GitHub Pages ativo?**
   - Verificar em Settings → Pages

2. **URL correta?**
   - `docs/config.js` aponta para Render?
   - Incluiu `/api` no final?

3. **CORS:**
   - Backend já tem CORS configurado ✅

### Produtos não aparecem

1. **Banco inicializado?**
   - Rodar `python init_db.py` no Shell do Render

2. **Testar API:**
   ```
   https://fresh-store.onrender.com/api/products
   ```
   Deve retornar JSON com produtos

---

## 📝 Checklist Final

- [ ] Backend funcionando (testar `/health`)
- [ ] API Docs acessível (testar `/docs`)
- [ ] Banco inicializado (`init_db.py`)
- [ ] Produtos aparecendo (`/api/products`)
- [ ] Frontend atualizado (push feito)
- [ ] GitHub Pages ativado
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Produtos carregando no frontend

---

## 🎉 Sistema Completo

```
┌──────────────────────────────────────────┐
│  GitHub Pages (GRÁTIS)                   │
│  https://carvmatheus.github.io/          │
│  fresh-store                             │
│                                          │
│  ✅ Frontend HTML/CSS/JS                 │
└────────────────┬─────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │
┌────────────────▼─────────────────────────┐
│  Render.com (GRÁTIS)                     │
│  https://fresh-store.onrender.com        │
│                                          │
│  ✅ Backend Python/FastAPI               │
│  ✅ PORT automática                      │
└────────────────┬─────────────────────────┘
                 │
                 │
┌────────────────▼─────────────────────────┐
│  MongoDB Atlas (GRÁTIS)                  │
│  mongodb+srv://...                       │
│                                          │
│  ✅ Database NoSQL                       │
│  ✅ 512MB free tier                      │
└──────────────────────────────────────────┘
```

**Custo Total: R$ 0,00/mês** 🎉

---

## 🚀 Próxima Ação

**Agora:**
1. Testar backend: https://fresh-store.onrender.com/health
2. Inicializar banco (Shell do Render)
3. Ativar GitHub Pages
4. Testar tudo!

**Precisa de ajuda em algum passo?** Me avisa! 😊

