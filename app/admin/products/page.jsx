"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

const categories = [
  { id: "all", name: "Todas" },
  { id: "vegetais", name: "Vegetais" },
  { id: "frutas", name: "Frutas" },
  { id: "verduras", name: "Verduras" },
  { id: "exoticos", name: "Exóticos" },
  { id: "granjeiro", name: "Granjeiro" },
  { id: "processados", name: "Processados" },
  { id: "outros", name: "Outros" },
]

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)

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

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct?.id) {
        await api.updateProduct(editingProduct.id, productData)
      } else {
        await api.createProduct(productData)
      }
      await loadProducts()
      setShowModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await api.deleteProduct(productId)
      await loadProducts()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Produtos</h2>
          <p className="text-gray-400">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { setEditingProduct({}); setShowModal(true) }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <span>➕</span> Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3640]">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Produto</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Categoria</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Preço</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Estoque</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Promo</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#2d3640] hover:bg-[#242b33] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                          <Image
                            src={product.image || '/placeholder.jpg'}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-100">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-100">{formatCurrency(product.price)}</p>
                        {product.isPromo && product.promoPrice && (
                          <p className="text-sm text-emerald-400">{formatCurrency(product.promoPrice)}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        product.stock <= 0 ? 'text-red-400' :
                        product.stock <= 10 ? 'text-amber-400' :
                        'text-gray-100'
                      }`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePromo(product)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          product.isPromo ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          product.isPromo ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingProduct(product); setShowModal(true) }}
                          className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null) }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    promoPrice: product?.promoPrice || '',
    stock: product?.stock || '',
    unit: product?.unit || 'kg',
    category: product?.category || 'vegetais',
    image: product?.image || '',
    minOrder: product?.minOrder || 1,
    isPromo: product?.isPromo || false,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      promoPrice: formData.promoPrice ? parseFloat(formData.promoPrice) : null,
      stock: parseInt(formData.stock) || 0,
      minOrder: parseInt(formData.minOrder) || 1,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-100">
            {product?.id ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço Promo</label>
              <input
                type="number"
                step="0.01"
                value={formData.promoPrice}
                onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Estoque</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Unidade</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="kg">kg</option>
                <option value="un">un</option>
                <option value="cx">cx</option>
                <option value="pct">pct</option>
                <option value="mç">mç</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              >
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Pedido Mínimo</label>
              <input
                type="number"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">URL da Imagem</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPromo}
                  onChange={(e) => setFormData({ ...formData, isPromo: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-gray-300">Produto em promoção</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#2d3640]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2d3640] text-gray-400 hover:bg-[#242b33] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
