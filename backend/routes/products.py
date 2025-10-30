"""
Rotas de Produtos
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.product import ProductCreate, ProductUpdate, ProductResponse
from database import get_database
from routes.auth import get_current_user

router = APIRouter()

def require_admin(current_user: dict = Depends(get_current_user)):
    """Verificar se usuário é admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem realizar esta ação"
        )
    return current_user

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = Query(None, description="Filtrar por categoria"),
    search: Optional[str] = Query(None, description="Buscar por nome ou descrição"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Listar produtos"""
    db = get_database()
    
    # Construir query
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Buscar produtos
    cursor = db.products.find(query).skip(skip).limit(limit).sort("name", 1)
    products = await cursor.to_list(length=limit)
    
    # Converter para response
    return [
        ProductResponse(
            id=str(p["_id"]),
            name=p["name"],
            category=p["category"],
            price=p["price"],
            unit=p["unit"],
            minOrder=p["minOrder"],
            stock=p["stock"],
            image=p["image"],
            description=p["description"],
            created_at=p["created_at"],
            is_active=p["is_active"]
        )
        for p in products
    ]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Obter produto por ID"""
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    product = await db.products.find_one({"_id": ObjectId(product_id), "is_active": True})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    return ProductResponse(
        id=str(product["_id"]),
        name=product["name"],
        category=product["category"],
        price=product["price"],
        unit=product["unit"],
        minOrder=product["minOrder"],
        stock=product["stock"],
        image=product["image"],
        description=product["description"],
        created_at=product["created_at"],
        is_active=product["is_active"]
    )

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, current_user: dict = Depends(require_admin)):
    """Criar novo produto (admin)"""
    db = get_database()
    
    # Criar produto
    product_dict = product.model_dump()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    product_dict["is_active"] = True
    
    result = await db.products.insert_one(product_dict)
    product_dict["_id"] = result.inserted_id
    
    return ProductResponse(
        id=str(result.inserted_id),
        **product.model_dump(),
        created_at=product_dict["created_at"],
        is_active=True
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: dict = Depends(require_admin)
):
    """Atualizar produto (admin)"""
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Verificar se produto existe
    existing_product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    # Atualizar apenas campos fornecidos
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
    
    # Buscar produto atualizado
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    
    return ProductResponse(
        id=str(updated_product["_id"]),
        name=updated_product["name"],
        category=updated_product["category"],
        price=updated_product["price"],
        unit=updated_product["unit"],
        minOrder=updated_product["minOrder"],
        stock=updated_product["stock"],
        image=updated_product["image"],
        description=updated_product["description"],
        created_at=updated_product["created_at"],
        is_active=updated_product["is_active"]
    )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, current_user: dict = Depends(require_admin)):
    """Deletar produto (soft delete) (admin)"""
    db = get_database()
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Soft delete
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    
    return None

@router.get("/categories/list", response_model=List[str])
async def get_categories():
    """Listar todas as categorias disponíveis"""
    db = get_database()
    
    categories = await db.products.distinct("category", {"is_active": True})
    return sorted(categories)

