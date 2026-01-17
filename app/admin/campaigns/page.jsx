"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CampaignsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('active') // 'active' | 'all'
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePromo = async (product) => {
    try {
      await api.updateProduct(product.id, {
        ...product,
        isPromo: !product.isPromo
      })
      await loadProducts()
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error)
    }
  }

  const handleUpdatePromoPrice = async (productId, promoPrice) => {
    try {
      const product = products.find(p => p.id === productId)
      await api.updateProduct(productId, {
        ...product,
        promoPrice: parseFloat(promoPrice) || null,
        isPromo: !!promoPrice
      })
      await loadProducts()
      setEditingProduct(null)
    } catch (error) {
      console.error('Erro ao atualizar preço promocional:', error)
    }
  }

  const promoProducts = products.filter(p => p.isPromo)
  const displayProducts = view === 'active' ? promoProducts : products

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Campanhas Promocionais</h2>
          <p className="text-gray-400">{promoProducts.length} produtos em promoção</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{promoProducts.length}</p>
              <p className="text-sm text-gray-400">Promoções ativas</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {promoProducts.length > 0 
                  ? Math.round(promoProducts.reduce((acc, p) => acc + (1 - (p.promoPrice || p.price) / p.price) * 100, 0) / promoProducts.length)
                  : 0}%
              </p>
              <p className="text-sm text-gray-400">Desconto médio</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-2xl font-bold text-purple-400">{products.length - promoProducts.length}</p>
              <p className="text-sm text-gray-400">Produtos sem promoção</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'active'
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          🔥 Promoções Ativas ({promoProducts.length})
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          📦 Todos os Produtos ({products.length})
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4 opacity-50">🎯</div>
            <p className="text-gray-500">Nenhuma promoção ativa</p>
            <p className="text-sm text-gray-600 mt-1">Clique em "Todos os Produtos" para adicionar promoções</p>
          </div>
        ) : (
          displayProducts.map((product) => {
            const discountPercent = product.isPromo && product.promoPrice 
              ? Math.round((1 - product.promoPrice / product.price) * 100)
              : 0

            return (
              <div
                key={product.id}
                className={`bg-[#1a1f26] rounded-xl border overflow-hidden transition-all ${
                  product.isPromo 
                    ? 'border-emerald-500/50 hover:border-emerald-500' 
                    : 'border-[#2d3640] hover:border-emerald-500/50'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-800">
                  <Image
                    src={product.image || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.isPromo && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      🔥 -{discountPercent}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-100 line-clamp-1 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 capitalize mb-3">{product.category}</p>

                  {/* Prices */}
                  <div className="flex items-baseline gap-2 mb-4">
                    {product.isPromo && product.promoPrice ? (
                      <>
                        <span className="text-lg font-bold text-emerald-400">{formatCurrency(product.promoPrice)}</span>
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(product.price)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-100">{formatCurrency(product.price)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#242b33] text-gray-300 hover:bg-[#2d3640] transition-colors text-sm font-medium"
                    >
                      ✏️ Editar Preço
                    </button>
                    <button
                      onClick={() => handleTogglePromo(product)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        product.isPromo
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {product.isPromo ? '✕' : '🔥'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <PromoModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdatePromoPrice}
        />
      )}
    </div>
  )
}

function PromoModal({ product, onClose, onSave }) {
  const [promoPrice, setPromoPrice] = useState(product.promoPrice || '')
  const [saving, setSaving] = useState(false)

  const discountPercent = promoPrice 
    ? Math.round((1 - parseFloat(promoPrice) / product.price) * 100)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(product.id, promoPrice)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-md">
        <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-100">Editar Promoção</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
              <Image
                src={product.image || '/placeholder.jpg'}
                alt={product.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-gray-100">{product.name}</p>
              <p className="text-sm text-gray-500">Preço original: {formatCurrency(product.price)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Preço Promocional</label>
            <input
              type="number"
              step="0.01"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              placeholder="Ex: 5.99"
              className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-emerald-500 text-lg"
            />
            {promoPrice && parseFloat(promoPrice) > 0 && (
              <p className="text-sm text-emerald-400 mt-2">
                🔥 Desconto de {discountPercent}% ({formatCurrency(product.price - parseFloat(promoPrice))} off)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setPromoPrice(''); onSave(product.id, null) }}
              className="flex-1 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Remover Promoção
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
