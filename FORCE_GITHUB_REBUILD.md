# 🔄 Como Forçar Rebuild do GitHub Pages

O GitHub Pages está mostrando versão antiga (cache). Aqui está como forçar atualização:

## ✅ OPÇÃO 1: Hard Refresh no Navegador

### Windows/Linux:
```
Ctrl + Shift + R
ou
Ctrl + F5
```

### Mac:
```
Cmd + Shift + R
```

### Chrome (Melhor opção):
1. Abrir DevTools (F12)
2. Clicar com botão direito no ícone de reload
3. Selecionar **"Empty Cache and Hard Reload"**

---

## ✅ OPÇÃO 2: Limpar Cache do GitHub Pages

### No GitHub:
1. Ir em: https://github.com/carvmatheus/fresh-store/settings/pages
2. Source: Mudar para **"None"**
3. **Save**
4. Aguardar 30 segundos
5. Source: Mudar de volta para **"Deploy from a branch"**
6. Branch: **main**
7. Folder: **/docs**
8. **Save**
9. Aguardar 2-5 minutos

---

## ✅ OPÇÃO 3: Adicionar Parâmetro na URL

Abrir com timestamp para forçar cache bust:
```
https://carvmatheus.github.io/fresh-store/?v=20250101
```

Ou:
```
https://carvmatheus.github.io/fresh-store/app.js?v=123
```

---

## ✅ OPÇÃO 4: Verificar Service Worker

Se o site usa Service Worker, pode estar em cache:

1. Abrir DevTools (F12)
2. Ir em **Application** → **Service Workers**
3. Clicar em **"Unregister"** (se tiver algum)
4. Ir em **Application** → **Storage**
5. Clicar em **"Clear site data"**
6. Recarregar página

---

## 🔍 Como Verificar Se Atualizou

### No Console (F12):

**Versão Antiga (Errada):**
```javascript
// Categorias aparecem como "vegetables", "fruits"
```

**Versão Nova (Correta):**
```javascript
// Deve ter esta função:
function getCategoryName(categoryId) {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.name : categoryId;
}

// E logs como:
📡 Carregando produtos da API...
✅ Produtos normalizados: 12
```

### Verificar Diretamente no Código:

Abrir:
```
https://carvmatheus.github.io/fresh-store/app.js
```

Procurar por: `getCategoryName`

Se não encontrar = versão antiga em cache!

---

## ⏱️ Tempo de Atualização

- **Código commitado:** ✅ Imediato
- **GitHub recebe push:** ✅ Segundos
- **GitHub Pages rebuild:** ⏳ 2-5 minutos
- **CDN propaga:** ⏳ 5-15 minutos
- **Cache do navegador:** ⏳ Até fazer hard refresh

---

## 🎯 Sequência Recomendada

1. **Confirmar que código está no GitHub:**
   ```bash
   # Ver último commit
   git log -1 --oneline
   ```

2. **Aguardar 5 minutos**

3. **Hard Refresh (Ctrl+Shift+R)**

4. **Se ainda não funcionar:**
   - Limpar cache do navegador
   - Usar aba anônima/incognito
   - Testar em outro navegador

5. **Se AINDA não funcionar:**
   - Reconfigurar GitHub Pages (Opção 2 acima)

---

## 📱 DICA PRO

Adicione um arquivo `docs/version.js`:

```javascript
window.APP_VERSION = "2.0.1";
console.log("App Version:", window.APP_VERSION);
```

Importe no HTML:
```html
<script src="version.js"></script>
```

Toda vez que mudar, incrementa a versão!

---

## ✅ CHECKLIST

- [ ] Código commitado e pushed para GitHub
- [ ] Aguardei 5 minutos
- [ ] Fiz hard refresh (Ctrl+Shift+R)
- [ ] Console mostra `getCategoryName`
- [ ] Badges mostram "Verduras", "Legumes" (português)
- [ ] Não mostram "vegetables", "fruits" (inglês)

---

**🎯 Se após todas essas tentativas AINDA estiver em inglês:**

O problema pode ser que o código não foi commitado corretamente.

**Verificar:**
```bash
cd ~/Documents/Repositories/fresh-store
git log --oneline -3
```

Deve mostrar commits recentes com "fix:" ou "Force rebuild"

