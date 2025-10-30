from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI(title="FreshMarket Pro API")

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de dados
class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    unit: str
    image: str
    description: str
    stock: int
    minOrder: Optional[int] = 1

class Category(BaseModel):
    id: str
    name: str

class DeliveryRequest(BaseModel):
    cep: str
    cartTotal: float

class DeliveryEstimate(BaseModel):
    distance: float
    estimatedTime: str
    deliveryFee: float
    minOrderValue: float

# Dados de categorias
categories_data = [
    {"id": "all", "name": "Todos os Produtos"},
    {"id": "verduras", "name": "Verduras"},
    {"id": "legumes", "name": "Legumes"},
    {"id": "frutas", "name": "Frutas"},
    {"id": "temperos", "name": "Temperos"},
    {"id": "graos", "name": "Grãos e Cereais"},
]

# Dados de produtos
products_data = [
    {
        "id": "1",
        "name": "Alface Americana",
        "category": "verduras",
        "price": 4.5,
        "unit": "unidade",
        "image": "/fresh-lettuce.png",
        "description": "Alface americana fresca e crocante",
        "stock": 150,
        "minOrder": 5,
    },
    {
        "id": "2",
        "name": "Tomate Italiano",
        "category": "legumes",
        "price": 6.9,
        "unit": "kg",
        "image": "/italian-tomatoes.jpg",
        "description": "Tomate italiano premium para molhos",
        "stock": 200,
        "minOrder": 2,
    },
    {
        "id": "3",
        "name": "Cebola Roxa",
        "category": "legumes",
        "price": 5.2,
        "unit": "kg",
        "image": "/red-onion.jpg",
        "description": "Cebola roxa de primeira qualidade",
        "stock": 180,
        "minOrder": 3,
    },
    {
        "id": "4",
        "name": "Rúcula Orgânica",
        "category": "verduras",
        "price": 8.5,
        "unit": "maço",
        "image": "/organic-arugula.jpg",
        "description": "Rúcula orgânica certificada",
        "stock": 80,
        "minOrder": 3,
    },
    {
        "id": "5",
        "name": "Batata Inglesa",
        "category": "legumes",
        "price": 4.2,
        "unit": "kg",
        "image": "/pile-of-potatoes.png",
        "description": "Batata inglesa para diversos preparos",
        "stock": 300,
        "minOrder": 5,
    },
    {
        "id": "6",
        "name": "Cenoura",
        "category": "legumes",
        "price": 3.8,
        "unit": "kg",
        "image": "/fresh-carrots.png",
        "description": "Cenoura fresca e doce",
        "stock": 250,
        "minOrder": 3,
    },
    {
        "id": "7",
        "name": "Manjericão Fresco",
        "category": "temperos",
        "price": 6.0,
        "unit": "maço",
        "image": "/fresh-basil.png",
        "description": "Manjericão fresco aromático",
        "stock": 60,
        "minOrder": 2,
    },
    {
        "id": "8",
        "name": "Limão Tahiti",
        "category": "frutas",
        "price": 7.5,
        "unit": "kg",
        "image": "/tahiti-lemon.jpg",
        "description": "Limão tahiti suculento",
        "stock": 120,
        "minOrder": 2,
    },
    {
        "id": "9",
        "name": "Arroz Integral",
        "category": "graos",
        "price": 12.9,
        "unit": "kg",
        "image": "/bowl-of-brown-rice.png",
        "description": "Arroz integral de alta qualidade",
        "stock": 500,
        "minOrder": 10,
    },
    {
        "id": "10",
        "name": "Feijão Preto",
        "category": "graos",
        "price": 8.5,
        "unit": "kg",
        "image": "/black-beans-close-up.png",
        "description": "Feijão preto tipo 1",
        "stock": 400,
        "minOrder": 10,
    },
    {
        "id": "11",
        "name": "Espinafre",
        "category": "verduras",
        "price": 5.5,
        "unit": "maço",
        "image": "/fresh-spinach.png",
        "description": "Espinafre fresco rico em ferro",
        "stock": 90,
        "minOrder": 3,
    },
    {
        "id": "12",
        "name": "Pimentão Vermelho",
        "category": "legumes",
        "price": 9.8,
        "unit": "kg",
        "image": "/red-bell-pepper.jpg",
        "description": "Pimentão vermelho doce",
        "stock": 100,
        "minOrder": 2,
    },
]

# Endpoints da API

@app.get("/")
def read_root():
    return {"message": "FreshMarket Pro API", "version": "1.0.0"}

@app.get("/api/categories", response_model=List[Category])
def get_categories():
    """Retorna todas as categorias de produtos"""
    return categories_data

@app.get("/api/products", response_model=List[Product])
def get_products(category: Optional[str] = None):
    """Retorna todos os produtos ou filtra por categoria"""
    if category and category != "all":
        return [p for p in products_data if p["category"] == category]
    return products_data

@app.get("/api/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    """Retorna um produto específico por ID"""
    product = next((p for p in products_data if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product

@app.post("/api/delivery/estimate", response_model=DeliveryEstimate)
def calculate_delivery(request: DeliveryRequest):
    """Calcula estimativa de entrega baseado no CEP"""
    cep = request.cep.replace("-", "")
    
    if len(cep) != 8 or not cep.isdigit():
        raise HTTPException(status_code=400, detail="CEP inválido")
    
    # Simulação de cálculo de distância baseado no CEP
    # Em produção, usar API de geolocalização real
    cep_num = int(cep[:5])
    base_distance = (cep_num % 50) + 5  # Distância entre 5 e 55 km
    
    # Cálculo de taxa de entrega
    if base_distance <= 10:
        delivery_fee = 0.0  # Entrega grátis até 10km
        estimated_time = "30-45 min"
    elif base_distance <= 20:
        delivery_fee = 15.0
        estimated_time = "45-60 min"
    elif base_distance <= 30:
        delivery_fee = 25.0
        estimated_time = "60-90 min"
    else:
        delivery_fee = 35.0
        estimated_time = "90-120 min"
    
    # Valor mínimo do pedido
    min_order_value = 100.0 if base_distance <= 20 else 150.0
    
    return {
        "distance": round(base_distance, 1),
        "estimatedTime": estimated_time,
        "deliveryFee": delivery_fee,
        "minOrderValue": min_order_value
    }

@app.get("/health")
def health_check():
    """Endpoint de health check"""
    return {"status": "healthy"}
