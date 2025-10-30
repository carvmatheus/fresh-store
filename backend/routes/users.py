"""
Rotas de Usuários
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId

from models.user import UserResponse
from database import get_database
from routes.auth import get_current_user
from routes.products import require_admin

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_admin)):
    """Listar todos os usuários (admin)"""
    db = get_database()
    
    cursor = db.users.find({"is_active": True}).sort("created_at", -1)
    users = await cursor.to_list(length=500)
    
    return [
        UserResponse(
            id=str(u["_id"]),
            email=u["email"],
            username=u["username"],
            name=u["name"],
            role=u["role"],
            company=u.get("company"),
            created_at=u["created_at"],
            is_active=u.get("is_active", True)
        )
        for u in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Obter usuário por ID (admin)"""
    db = get_database()
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        name=user["name"],
        role=user["role"],
        company=user.get("company"),
        created_at=user["created_at"],
        is_active=user.get("is_active", True)
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Desativar usuário (soft delete) (admin)"""
    db = get_database()
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Não permitir desativar a si mesmo
    if str(current_user["_id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode desativar sua própria conta"
        )
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return None

