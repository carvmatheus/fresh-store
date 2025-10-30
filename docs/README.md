# 🥬 FreshMarket Pro - Versão GitHub Pages

Esta é a versão HTML pura do FreshMarket Pro, otimizada para GitHub Pages.

## ✨ Funcionalidades

- ✅ Catálogo com 12 produtos
- ✅ Filtros por categoria (Verduras, Legumes, Frutas, Temperos, Grãos)
- ✅ Carrinho de compras funcional
- ✅ Simulador de entrega com cálculo de:
  - Distância baseada em CEP
  - Tempo estimado
  - Taxa de entrega
  - Valor mínimo do pedido
- ✅ Design responsivo
- ✅ Persistência no localStorage
- ✅ Interface profissional

## 🚀 Como Usar

Esta pasta está pronta para ser publicada no GitHub Pages.

### Configurar no GitHub:

1. Vá no repositório no GitHub
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **/docs**
5. Save

Pronto! Seu site estará em:
```
https://seu-usuario.github.io/fresh-store
```

## 📁 Arquivos

- `index.html` - Estrutura HTML
- `styles.css` - Estilos CSS
- `app.js` - Lógica JavaScript
- `README.md` - Este arquivo

## 🎯 Tecnologias

- HTML5
- CSS3 (Grid, Flexbox, Custom Properties)
- JavaScript ES6+ (Vanilla JS)
- LocalStorage para persistência

## 🔧 Customização

### Adicionar Produtos

Edite o array `products` em `app.js`:

```javascript
{
  id: 13,
  name: "Seu Produto",
  category: "categoria",
  price: 10.50,
  unit: "kg",
  minOrder: 2,
  stock: 100,
  image: "URL_DA_IMAGEM",
  description: "Descrição do produto"
}
```

### Adicionar Categorias

Edite o array `categories` em `app.js`:

```javascript
{ id: "nova-categoria", name: "Nova Categoria" }
```

### Personalizar Cores

Edite as variáveis CSS em `styles.css`:

```css
:root {
  --primary: #10b981;
  --primary-dark: #059669;
}
```

## 📱 Responsivo

O site funciona perfeitamente em:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 🌐 Compatibilidade

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## ⚡ Performance

- Sem dependências externas
- Tamanho total: ~20KB (sem imagens)
- Carregamento instantâneo
- 100% estático

## 💡 Dicas

1. **Imagens**: Use URLs otimizadas (Unsplash, Imgur, etc) ou imagens locais
2. **SEO**: Adicione meta tags no `<head>` do HTML
3. **Analytics**: Adicione Google Analytics se necessário
4. **PWA**: Adicione Service Worker para funcionar offline

## 🎉 Pronto!

Este site está 100% funcional e pronto para ser usado!

