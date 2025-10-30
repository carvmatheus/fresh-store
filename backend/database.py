"""
Configuração do MongoDB
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

# Cliente MongoDB
client: AsyncIOMotorClient = None
database = None

async def connect_db():
    """Conectar ao MongoDB"""
    global client, database
    
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.DB_NAME]
        
        # Testar conexão
        await client.admin.command('ping')
        print(f"✅ Conectado ao MongoDB: {settings.DB_NAME}")
        
        # Criar índices
        await create_indexes()
        
    except Exception as e:
        print(f"❌ Erro ao conectar ao MongoDB: {e}")
        raise

async def close_db():
    """Desconectar do MongoDB"""
    global client
    if client:
        client.close()
        print("🔌 Desconectado do MongoDB")

async def create_indexes():
    """Criar índices para melhor performance"""
    # Índice único para email de usuários
    await database.users.create_index("email", unique=True)
    
    # Índice único para username
    await database.users.create_index("username", unique=True)
    
    # Índice para categorias de produtos
    await database.products.create_index("category")
    
    # Índice para busca de produtos por nome
    await database.products.create_index("name")
    
    # Índice para pedidos por usuário
    await database.orders.create_index("user_id")
    
    print("✅ Índices criados")

def get_database():
    """Retornar instância do database"""
    return database

