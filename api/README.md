# FreshMarket Pro - Backend API

Backend em Python usando FastAPI para o marketplace de produtos para restaurantes.

## Instalação

\`\`\`bash
# Instalar dependências
pip install -r requirements.txt
\`\`\`

## Executar o servidor

\`\`\`bash
# Desenvolvimento
uvicorn main:app --reload --port 8000

# Produção
uvicorn main:app --host 0.0.0.0 --port 8000
\`\`\`

## Endpoints disponíveis

### Produtos
- `GET /api/products` - Lista todos os produtos
- `GET /api/products?category=verduras` - Filtra produtos por categoria
- `GET /api/products/{id}` - Retorna um produto específico

### Categorias
- `GET /api/categories` - Lista todas as categorias

### Entrega
- `POST /api/delivery/estimate` - Calcula estimativa de entrega
  \`\`\`json
  {
    "cep": "01310-100",
    "cartTotal": 250.00
  }
  \`\`\`

### Utilitários
- `GET /` - Informações da API
- `GET /health` - Health check

## Documentação interativa

Após iniciar o servidor, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
