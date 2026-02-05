# Relatório de Compatibilidade Frontend ↔ Backend

## 🔴 ERROS CRÍTICOS

### 1. `updateUserApproval` - Endpoint Incorreto
**Frontend (`api-client.ts:491-495`):**
```typescript
async updateUserApproval(id: number, status: 'approved' | 'pending' | 'suspended' | 'rejected'): Promise<User> {
  return await this.request<User>(`/users/${id}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approval_status: status })
  });
}
```

**Backend (`routes_sql/users.py:340-389`):**
```python
@router.post("/{user_id}/approval")
def manage_user_approval(
    user_id: str,
    request: UserApprovalRequest,  # { action: str, reason?: str }
    ...
)
```

**Problema:** 
- Frontend usa `PATCH` mas backend espera `POST`
- Frontend envia `{ approval_status: status }` mas backend espera `{ action: 'approve' | 'suspend' | 'reactivate', reason?: str }`
- Backend não suporta status 'rejected'

---

### 2. `getAllUsers` - Rota Inexistente
**Frontend (`api-client.ts:476-478`):**
```typescript
async getAllUsers(): Promise<User[]> {
  return await this.request<User[]>('/users/all');
}
```

**Backend:** A rota `/users/all` NÃO existe. A rota correta é `GET /users` que já lista todos os usuários.

---

### 3. `getCategories` - Rota Incorreta  
**Frontend (`api-client.ts:404-406`):**
```typescript
async getCategories(): Promise<string[]> {
  return await this.request<string[]>('/products/categories/list');
}
```

**Backend (`routes_sql/products.py:240-245`):**
```python
@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
```

**Problema:** Frontend chama `/products/categories/list` mas backend é `/products/categories`

---

## 🟡 AVISOS

### 4. Tipo de ID inconsistente
**Frontend:** Muitos métodos usam `id: number` (ex: `getUser(id: number)`)
**Backend:** IDs são UUIDs (strings)

Isso funciona porque JavaScript converte number para string, mas pode causar problemas.

---

### 5. `updateUser` - Método HTTP errado para update parcial
**Frontend (`api-client.ts:484-488`):**
```typescript
async updateUser(id: number | string, userData: Partial<User>): Promise<User> {
  return await this.request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
}
```

O PUT funciona, mas semanticamente PATCH seria mais adequado para atualizações parciais.

---

## 📝 RESUMO DE CORREÇÕES NECESSÁRIAS

### No Frontend (`api-client.ts`):

1. **Corrigir `updateUserApproval`:**
   - Mudar de `PATCH` para `POST`
   - Mudar body de `{ approval_status }` para `{ action: 'approve' | 'suspend' | 'reactivate', reason?: string }`

2. **Corrigir `getAllUsers`:**
   - Usar `/users` em vez de `/users/all`
   - Ou simplificar removendo este método duplicado

3. **Corrigir `getCategories`:**
   - Usar `/products/categories` em vez de `/products/categories/list`

---

## ✅ ROTAS CORRETAS (Já funcionando)

- `GET /products` - Listar produtos ✅
- `GET /products/{id}` - Obter produto ✅
- `POST /products` (FormData) - Criar produto ✅
- `PUT /products/{id}` (FormData) - Atualizar produto ✅
- `DELETE /products/{id}` - Deletar produto ✅
- `PUT /products/order/update` - Ordenar produtos ✅
- `GET /orders` - Listar pedidos do usuário ✅
- `GET /orders/all` - Listar todos os pedidos (admin) ✅
- `GET /orders/{id}` - Obter pedido ✅
- `POST /orders` - Criar pedido ✅
- `PATCH /orders/{id}/status` - Atualizar status ✅
- `POST /auth/login` - Login ✅
- `POST /auth/register` - Registro ✅
- `GET /auth/me` - Perfil ✅
