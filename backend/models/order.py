"""
Modelo de Pedido
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class OrderItem(BaseModel):
    product_id: str
    name: str
    quantity: int
    unit: str
    price: float
    image: Optional[str] = None

class ShippingAddress(BaseModel):
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    zipcode: str

class ContactInfo(BaseModel):
    phone: str
    email: str
    name: str

class OrderBase(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    contact_info: ContactInfo
    delivery_fee: float = 0
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderInDB(OrderBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    order_number: str
    status: str = "processando"  # processando, em_transito, entregue, cancelado
    subtotal: float
    total: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    delivery_date: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class OrderResponse(OrderBase):
    id: str
    order_number: str
    user_id: str
    status: str
    subtotal: float
    total: float
    created_at: datetime
    delivery_date: Optional[datetime] = None

    class Config:
        populate_by_name = True

class OrderStatusUpdate(BaseModel):
    status: str
    delivery_date: Optional[datetime] = None

