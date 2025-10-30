"""
Rotas de Pedidos
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import random
import string

from models.order import OrderCreate, OrderResponse, OrderStatusUpdate
from database import get_database
from routes.auth import get_current_user
from routes.products import require_admin

router = APIRouter()

def generate_order_number() -> str:
    """Gerar número único de pedido"""
    year = datetime.utcnow().year
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"PED-{year}-{random_part}"

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Criar novo pedido"""
    db = get_database()
    
    # Calcular subtotal
    subtotal = sum(item.quantity * item.price for item in order.items)
    total = subtotal + order.delivery_fee
    
    # Calcular data de entrega estimada (3 dias úteis)
    delivery_date = datetime.utcnow() + timedelta(days=3)
    
    # Criar pedido
    order_dict = order.model_dump()
    order_dict["user_id"] = str(current_user["_id"])
    order_dict["order_number"] = generate_order_number()
    order_dict["status"] = "processando"
    order_dict["subtotal"] = subtotal
    order_dict["total"] = total
    order_dict["created_at"] = datetime.utcnow()
    order_dict["updated_at"] = datetime.utcnow()
    order_dict["delivery_date"] = delivery_date
    
    # Converter items para dict
    order_dict["items"] = [item.model_dump() for item in order.items]
    order_dict["shipping_address"] = order.shipping_address.model_dump()
    order_dict["contact_info"] = order.contact_info.model_dump()
    
    result = await db.orders.insert_one(order_dict)
    
    # Atualizar estoque dos produtos
    for item in order.items:
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock": -item.quantity}}
        )
    
    return OrderResponse(
        id=str(result.inserted_id),
        order_number=order_dict["order_number"],
        user_id=order_dict["user_id"],
        items=order.items,
        shipping_address=order.shipping_address,
        contact_info=order.contact_info,
        delivery_fee=order.delivery_fee,
        notes=order.notes,
        status=order_dict["status"],
        subtotal=subtotal,
        total=total,
        created_at=order_dict["created_at"],
        delivery_date=delivery_date
    )

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filtrar por status"),
    current_user: dict = Depends(get_current_user)
):
    """Listar pedidos do usuário"""
    db = get_database()
    
    # Construir query
    query = {"user_id": str(current_user["_id"])}
    
    if status_filter:
        query["status"] = status_filter
    
    # Buscar pedidos
    cursor = db.orders.find(query).sort("created_at", -1)
    orders = await cursor.to_list(length=100)
    
    # Converter para response
    return [
        OrderResponse(
            id=str(o["_id"]),
            order_number=o["order_number"],
            user_id=o["user_id"],
            items=[item for item in o["items"]],
            shipping_address=o["shipping_address"],
            contact_info=o["contact_info"],
            delivery_fee=o.get("delivery_fee", 0),
            notes=o.get("notes"),
            status=o["status"],
            subtotal=o["subtotal"],
            total=o["total"],
            created_at=o["created_at"],
            delivery_date=o.get("delivery_date")
        )
        for o in orders
    ]

@router.get("/all", response_model=List[OrderResponse])
async def get_all_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(require_admin)
):
    """Listar todos os pedidos (admin)"""
    db = get_database()
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    cursor = db.orders.find(query).sort("created_at", -1)
    orders = await cursor.to_list(length=500)
    
    return [
        OrderResponse(
            id=str(o["_id"]),
            order_number=o["order_number"],
            user_id=o["user_id"],
            items=[item for item in o["items"]],
            shipping_address=o["shipping_address"],
            contact_info=o["contact_info"],
            delivery_fee=o.get("delivery_fee", 0),
            notes=o.get("notes"),
            status=o["status"],
            subtotal=o["subtotal"],
            total=o["total"],
            created_at=o["created_at"],
            delivery_date=o.get("delivery_date")
        )
        for o in orders
    ]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Obter pedido por ID"""
    db = get_database()
    
    if not ObjectId.is_valid(order_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Verificar se o pedido pertence ao usuário ou se é admin
    if str(order["user_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    return OrderResponse(
        id=str(order["_id"]),
        order_number=order["order_number"],
        user_id=order["user_id"],
        items=[item for item in order["items"]],
        shipping_address=order["shipping_address"],
        contact_info=order["contact_info"],
        delivery_fee=order.get("delivery_fee", 0),
        notes=order.get("notes"),
        status=order["status"],
        subtotal=order["subtotal"],
        total=order["total"],
        created_at=order["created_at"],
        delivery_date=order.get("delivery_date")
    )

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(require_admin)
):
    """Atualizar status do pedido (admin)"""
    db = get_database()
    
    if not ObjectId.is_valid(order_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Verificar se pedido existe
    existing_order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado"
        )
    
    # Atualizar status
    update_data = {"status": status_update.status, "updated_at": datetime.utcnow()}
    
    if status_update.delivery_date:
        update_data["delivery_date"] = status_update.delivery_date
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_data}
    )
    
    # Buscar pedido atualizado
    updated_order = await db.orders.find_one({"_id": ObjectId(order_id)})
    
    return OrderResponse(
        id=str(updated_order["_id"]),
        order_number=updated_order["order_number"],
        user_id=updated_order["user_id"],
        items=[item for item in updated_order["items"]],
        shipping_address=updated_order["shipping_address"],
        contact_info=updated_order["contact_info"],
        delivery_fee=updated_order.get("delivery_fee", 0),
        notes=updated_order.get("notes"),
        status=updated_order["status"],
        subtotal=updated_order["subtotal"],
        total=updated_order["total"],
        created_at=updated_order["created_at"],
        delivery_date=updated_order.get("delivery_date")
    )

