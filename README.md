# FreshMarket Pro - Marketplace para Restaurantes

Marketplace B2B completo para fornecimento de verduras e produtos frescos para restaurantes, com simulador de entrega.

## Tecnologias

### Frontend
- Next.js 15 (App Router)
- React 19
- JavaScript (ES6+)
- Tailwind CSS v4
- shadcn/ui

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- Uvicorn

## Instalação

### Backend (API Python)

1. Entre na pasta da API:
```bash
cd api
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Execute o servidor:
```bash
uvicorn main:app --reload --port 8000
```

A API estará disponível em http://localhost:8000
Documentação interativa: http://localhost:8000/docs

### Frontend (Next.js)

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (opcional):
```bash
cp .env.example .env.local
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O site estará disponível em http://localhost:3000

## Funcionalidades

- Catálogo de produtos com 12 itens (verduras, legumes, frutas, temperos, grãos)
- Filtros por categoria
- Carrinho de compras com controle de quantidades
- Simulador de entrega com cálculo de:
  - Distância baseada em CEP
  - Tempo estimado de entrega
  - Taxa de entrega (grátis até 10km)
  - Valor mínimo do pedido
- Design responsivo para mobile e desktop
- Interface profissional B2B

## Estrutura do Projeto

```
├── api/                    # Backend Python
│   ├── main.py            # API FastAPI
│   ├── requirements.txt   # Dependências Python
│   └── README.md          # Documentação da API
├── app/                   # Frontend Next.js
│   ├── layout.jsx         # Layout principal
│   ├── page.jsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── header.jsx
│   ├── category-filter.jsx
│   ├── product-card.jsx
│   ├── product-grid.jsx
│   └── delivery-simulator.jsx
└── lib/                   # Utilitários
    └── products-data.js   # Funções de API
```

## API Endpoints

- \`GET /api/products\` - Lista todos os produtos
- \`GET /api/products?category={categoria}\` - Filtra por categoria
- \`GET /api/categories\` - Lista categorias
- \`POST /api/delivery/estimate\` - Calcula entrega

## Deploy

### Backend
Recomendado: Railway, Render, ou Heroku

### Frontend
Recomendado: Vercel (otimizado para Next.js)

Lembre-se de configurar a variável \`NEXT_PUBLIC_API_URL\` com a URL do backend em produção.
