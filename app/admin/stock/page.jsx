"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

export default function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingStock, setEditingStock] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      // Ordenar por estoque (menor primeiro)
      setProducts(data.sort((a, b) => a.stock - b.stock))
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const product = products.find(p => p.id === productId)
      await api.updateProduct(productId, { ...product, stock: parseInt(newStock) })
      await loadProducts()
      setEditingId(null)
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error)
      alert('Erro ao atualizar estoque')
    }
  }

  const handleQuickUpdate = async (productId, amount) => {
    const product = products.find(p => p.id === productId)
    const newStock = Math.max(0, product.stock + amount)
    await handleUpdateStock(productId, newStock)
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Sem estoque', color: 'bg-red-500/20 text-red-400', icon: '❌' }
    if (stock <= 5) return { label: 'Crítico', color: 'bg-red-500/20 text-red-400', icon: '🔴' }
    if (stock <= 10) return { label: 'Baixo', color: 'bg-amber-500/20 text-amber-400', icon: '🟡' }
    if (stock <= 30) return { label: 'Normal', color: 'bg-blue-500/20 text-blue-400', icon: '🔵' }
    return { label: 'Bom', color: 'bg-emerald-500/20 text-emerald-400', icon: '🟢' }
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true
    if (filter === 'out') return p.stock === 0
    if (filter === 'low') return p.stock > 0 && p.stock <= 10
    if (filter === 'normal') return p.stock > 10
    return true
  })

  const outOfStock = products.filter(p => p.stock === 0).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando estoque...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Controle de Estoque</h2>
        <p className="text-gray-400">{products.length} produtos cadastrados</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-2xl font-bold text-red-400">{outOfStock}</p>
              <p className="text-sm text-gray-400">Sem estoque</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-2xl font-bold text-amber-400">{lowStock}</p>
              <p className="text-sm text-gray-400">Estoque baixo</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{products.length - outOfStock - lowStock}</p>
              <p className="text-sm text-gray-400">Estoque normal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todos', count: products.length },
          { id: 'out', label: 'Sem estoque', count: outOfStock },
          { id: 'low', label: 'Estoque baixo', count: lowStock },
          { id: 'normal', label: 'Normal', count: products.length - outOfStock - lowStock },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f.id
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const status = getStockStatus(product.stock)
          const isEditing = editingId === product.id

          return (
            <div
              key={product.id}
              className={`bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4 hover:border-emerald-500/50 transition-colors ${
                product.stock === 0 ? 'opacity-60' : ''
              }`}
            >
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                  <Image
                    src={product.image || '/placeholder.jpg'}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-100 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color} mt-1`}>
                    {status.icon} {status.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Estoque atual</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editingStock}
                        onChange={(e) => setEditingStock(e.target.value)}
                        className="w-20 bg-[#0f1419] border border-[#2d3640] rounded px-2 py-1 text-gray-100 text-center focus:outline-none focus:border-emerald-500"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateStock(product.id, editingStock)
                          }
                        }}
                      />
                      <button
                        onClick={() => handleUpdateStock(product.id, editingStock)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p 
                      className={`text-xl font-bold cursor-pointer hover:text-emerald-400 ${
                        product.stock === 0 ? 'text-red-400' :
                        product.stock <= 10 ? 'text-amber-400' :
                        'text-gray-100'
                      }`}
                      onClick={() => { setEditingId(product.id); setEditingStock(product.stock.toString()) }}
                    >
                      {product.stock} {product.unit}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickUpdate(product.id, -1)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center font-bold"
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleQuickUpdate(product.id, 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleQuickUpdate(product.id, 10)}
                    className="px-2 h-8 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
