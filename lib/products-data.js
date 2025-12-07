const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const categories = [
  { id: "all", name: "Todos os Produtos" },
  { id: "verduras", name: "Verduras" },
  { id: "legumes", name: "Legumes" },
  { id: "frutas", name: "Frutas" },
  { id: "temperos", name: "Temperos" },
  { id: "graos", name: "Grãos e Cereais" },
]

// Fallback data for initial render or error cases
export const products = []

export async function fetchProducts(category = "all") {
  try {
    const params = new URLSearchParams()
    if (category !== "all") {
      params.append("category", category)
    }
    
    // Ajuste para o endpoint correto (Postgres usa /api/products/)
    const response = await fetch(`${API_URL}/api/products/?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos')
    }
    
    const data = await response.json()
    
    // Mapear campos do backend (snake_case) para o formato do frontend (camelCase)
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      minOrder: p.min_order, // Postgres return min_order
      stock: p.stock,
      image: p.image_url,    // Postgres return image_url
      description: p.description
    }))
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return []
  }
}

// Mantendo para compatibilidade temporária, mas deve ser substituído
export function getProducts(category = "all") {
  console.warn("getProducts is deprecated. Use fetchProducts instead.")
  return []
}

export async function calculateDelivery(cep, cartTotal) {
  try {
    // Ajuste para o endpoint correto
    const response = await fetch(`${API_URL}/api/orders/calculate-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cep: cep,
        cart_total: cartTotal
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erro ao calcular entrega")
    }

    return await response.json()
  } catch (error) {
    console.error("Erro ao calcular entrega:", error)
    throw error
  }
}
