"""
Backend API - Da Horta Distribuidora
FastAPI + MongoDB
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import connect_db, close_db
from routes import auth, products, orders, users

# Lifecycle events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    print("✅ Conectado ao MongoDB")
    yield
    # Shutdown
    await close_db()
    print("🔌 Desconectado do MongoDB")

# Criar app
app = FastAPI(
    title="Da Horta Distribuidora API",
    description="API para marketplace B2B de produtos frescos",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(products.router, prefix="/api/products", tags=["Produtos"])
app.include_router(orders.router, prefix="/api/orders", tags=["Pedidos"])
app.include_router(users.router, prefix="/api/users", tags=["Usuários"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Da Horta Distribuidora API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

