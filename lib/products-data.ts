/**
 * Dados e funções relacionadas a produtos
 * Adaptado de docs/app.js para Next.js
 */

import { api } from './api-client'

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  promoPrice?: number | null
  unit: string
  minOrder: number
  stock: number
  image: string
  description?: string
  isPromo?: boolean
  displayOrder?: number
  isActive?: boolean
}

export const categories: Category[] = [
  { id: "all", name: "Todos", icon: "todos" },
  { id: "ofertas", name: "Ofertas", icon: "ofertas" },
  { id: "vegetais", name: "Vegetais", icon: "vegetais" },
  { id: "frutas", name: "Frutas", icon: "frutas" },
  { id: "verduras", name: "Verduras", icon: "verduras" },
  { id: "exoticos", name: "Exóticos", icon: "exoticos" },
  { id: "granjeiro", name: "Granjeiro", icon: "granjeiro" },
  { id: "processados", name: "Processados", icon: "processados" },
  { id: "outros", name: "Outros", icon: "graos" }
]

/**
 * Formata valor para moeda brasileira (R$ 999.999,99)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formata apenas o valor numérico (999.999,99) sem o R$
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Carregar produtos da API
 */
export async function loadProductsFromAPI(): Promise<Product[]> {
  try {
    console.log('📡 Carregando produtos da API...')

    const productsData = await api.getProducts()

    console.log('✅ Produtos carregados da API:', productsData ? productsData.length : 0)

    if (!productsData || !Array.isArray(productsData)) {
      console.error('❌ Dados inválidos recebidos da API:', productsData)
      return []
    }

    if (productsData.length === 0) {
      console.warn('⚠️ API retornou array vazio')
      return []
    }

    // Normalizar dados: converter campos do PostgreSQL para formato esperado
    const normalized = productsData.map((p: any): Product => ({
      id: String(p.id),
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      promoPrice: p.promo_price ? parseFloat(p.promo_price) : null,
      unit: p.unit,
      minOrder: p.min_order || 1,
      stock: p.stock,
      image: p.image_url || 'https://via.placeholder.com/400',
      description: p.description || '',
      isPromo: p.is_promo === true,
      displayOrder: p.display_order || 0,
      isActive: p.is_active !== false
    }))

    console.log('✅ Total de produtos normalizados:', normalized.length)

    return normalized
  } catch (error) {
    console.error('❌ ERRO ao carregar produtos da API:', error)
    return []
  }
}

/**
 * Buscar produtos por categoria
 */
export async function fetchProducts(categoryId: string = 'all'): Promise<Product[]> {
  const allProducts = await loadProductsFromAPI()

  if (categoryId === 'all') {
    // Ordenar por displayOrder se disponível, senão manter ordem original
    return allProducts
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }

  if (categoryId === 'ofertas') {
    // Filtrar apenas produtos em promoção
    return allProducts
      .filter(p => p.isPromo === true)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }

  // Filtrar por categoria específica
  return allProducts
    .filter(p => p.category === categoryId)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
}

/**
 * Traduzir categoria para nome legível
 */
export function getCategoryName(categoryId: string): string {
  const category = categories.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId
}

/**
 * Interface para resposta de cálculo de entrega
 */
export interface DeliveryEstimate {
  distance: number
  estimatedTime: string
  deliveryFee: number
  minOrderValue: number
  cep: string
}

/**
 * Calcular frete e prazo de entrega
 */
export async function calculateDelivery(cep: string, cartTotal: number): Promise<DeliveryEstimate> {
  try {
    // Limpar CEP - remover caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido. Digite um CEP com 8 dígitos.')
    }

    // Chamar API de cálculo de entrega
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://dahorta-backend.onrender.com'}/orders/calculate-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cep: cleanCep,
        cart_total: cartTotal
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || 'Erro ao calcular entrega')
    }

    const data = await response.json()

    return {
      distance: data.distance,
      estimatedTime: data.estimatedTime,
      deliveryFee: data.deliveryFee,
      minOrderValue: data.minOrderValue,
      cep: data.cep
    }
  } catch (error: any) {
    console.error('Erro ao calcular entrega:', error)
    throw error
  }
}
