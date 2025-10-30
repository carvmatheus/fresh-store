"""
Script para inicializar o banco de dados com dados de exemplo
"""

import asyncio
from datetime import datetime
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient

# Configuração
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "da_horta_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_database():
    """Inicializar banco com dados de exemplo"""
    
    print("🔄 Conectando ao MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    # Limpar coleções existentes
    print("🗑️  Limpando coleções antigas...")
    await db.users.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})
    
    # Criar usuários
    print("👥 Criando usuários...")
    users = [
        {
            "email": "admin@dahorta.com",
            "username": "admin",
            "name": "Administrador",
            "role": "admin",
            "company": "Da Horta Distribuidora",
            "hashed_password": pwd_context.hash("admin123"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "email": "cliente@restaurante.com",
            "username": "cliente",
            "name": "João Silva",
            "role": "cliente",
            "company": "Restaurante Bom Sabor",
            "hashed_password": pwd_context.hash("cliente123"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.users.insert_many(users)
    print(f"✅ {len(users)} usuários criados")
    
    # Criar produtos
    print("📦 Criando produtos...")
    products = [
        {
            "name": "Alface Crespa",
            "category": "verduras",
            "price": 3.5,
            "unit": "un",
            "minOrder": 5,
            "stock": 200,
            "image": "images/fresh-lettuce.png",
            "description": "Alface crespa fresca e crocante",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Tomate Italiano",
            "category": "legumes",
            "price": 8.9,
            "unit": "kg",
            "minOrder": 3,
            "stock": 150,
            "image": "images/italian-tomatoes.jpg",
            "description": "Tomate italiano maduro",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Cebola Roxa",
            "category": "legumes",
            "price": 6.5,
            "unit": "kg",
            "minOrder": 5,
            "stock": 180,
            "image": "images/red-onion.jpg",
            "description": "Cebola roxa de primeira",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Batata Inglesa",
            "category": "legumes",
            "price": 4.9,
            "unit": "kg",
            "minOrder": 10,
            "stock": 300,
            "image": "images/batata-inglesa.jpg",
            "description": "Batata inglesa selecionada",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Cenoura Fresca",
            "category": "legumes",
            "price": 5.5,
            "unit": "kg",
            "minOrder": 5,
            "stock": 220,
            "image": "images/cenoura-fresca.jpg",
            "description": "Cenoura fresca do produtor",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Feijão Preto",
            "category": "graos",
            "price": 9.5,
            "unit": "kg",
            "minOrder": 5,
            "stock": 250,
            "image": "images/feij-o-preto.jpg",
            "description": "Feijão preto tipo 1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Arroz Integral",
            "category": "graos",
            "price": 12.9,
            "unit": "kg",
            "minOrder": 10,
            "stock": 300,
            "image": "images/arroz-integral.jpg",
            "description": "Arroz integral orgânico",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Maçã Fuji",
            "category": "frutas",
            "price": 7.9,
            "unit": "kg",
            "minOrder": 3,
            "stock": 150,
            "image": "images/ma---fuji-vermelha.jpg",
            "description": "Maçã fuji importada",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Manjericão Fresco",
            "category": "temperos",
            "price": 6.5,
            "unit": "maço",
            "minOrder": 2,
            "stock": 80,
            "image": "images/manjeric-o-fresco.jpg",
            "description": "Manjericão fresco e aromático",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Alho Branco",
            "category": "temperos",
            "price": 18.9,
            "unit": "kg",
            "minOrder": 2,
            "stock": 120,
            "image": "images/alho-branco.jpg",
            "description": "Alho Branco de primeira",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Banana Prata",
            "category": "frutas",
            "price": 5.2,
            "unit": "kg",
            "minOrder": 5,
            "stock": 180,
            "image": "images/banana-prata.jpg",
            "description": "Banana prata madura",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "name": "Limão Tahiti",
            "category": "frutas",
            "price": 4.8,
            "unit": "kg",
            "minOrder": 3,
            "stock": 160,
            "image": "images/tahiti-lemon.jpg",
            "description": "Limão tahiti suculento",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.products.insert_many(products)
    print(f"✅ {len(products)} produtos criados")
    
    # Criar índices
    print("🔧 Criando índices...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("name")
    await db.orders.create_index("user_id")
    print("✅ Índices criados")
    
    print("\n✅ Banco de dados inicializado com sucesso!")
    print("\n👤 Credenciais de acesso:")
    print("   Admin:")
    print("   - Usuário: admin")
    print("   - Senha: admin123")
    print("\n   Cliente:")
    print("   - Usuário: cliente")
    print("   - Senha: cliente123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())

