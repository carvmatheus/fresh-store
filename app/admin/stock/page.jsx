"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('stock-desc')

  // Entradas futuras
  const [pendingEntries, setPendingEntries] = useState({})
  const [editingEntry, setEditingEntry] = useState(null)
  const [entryValue, setEntryValue] = useState('')

  // Edição de estoque
  const [editingStock, setEditingStock] = useState(null)
  const [stockValue, setStockValue] = useState('')

  useEffect(() => {
    loadProducts()
    const saved = localStorage.getItem('pendingStockEntries')
    if (saved) setPendingEntries(JSON.parse(saved))
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ activeOnly: false })
      setProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (productId, newStock) => {
    // Permite estoque negativo
    const newStockValue = parseInt(newStock) || 0
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStockValue } : p))
    setEditingStock(null)
    setStockValue('')

    try {
      await api.updateProductStock(productId, newStockValue)
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error)
      await loadProducts()
    }
  }

  // Toggle disponibilidade do produto
  const handleToggleAvailable = async (productId) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const newValue = !product.isActive
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: newValue } : p))

    try {
      await api.updateProductAvailability(productId, newValue)
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
      await loadProducts()
    }
  }

  const handleSaveEntry = (productId) => {
    const value = parseInt(entryValue) || 0
    if (value > 0) {
      setPendingEntries(prev => {
        const updated = { ...prev, [productId]: (prev[productId] || 0) + value }
        localStorage.setItem('pendingStockEntries', JSON.stringify(updated))
        return updated
      })
    }
    setEditingEntry(null)
    setEntryValue('')
  }

  const handleConfirmEntry = async (productId) => {
    const entryAmount = pendingEntries[productId] || 0
    if (entryAmount <= 0) return

    const product = products.find(p => p.id === productId)
    const newStock = product.stock + entryAmount

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))
    setPendingEntries(prev => {
      const updated = { ...prev }
      delete updated[productId]
      localStorage.setItem('pendingStockEntries', JSON.stringify(updated))
      return updated
    })

    try {
      await api.updateProductStock(productId, newStock)
    } catch (error) {
      console.error('Erro ao confirmar entrada:', error)
      await loadProducts()
    }
  }

  const handleClearEntry = (productId) => {
    setPendingEntries(prev => {
      const updated = { ...prev }
      delete updated[productId]
      localStorage.setItem('pendingStockEntries', JSON.stringify(updated))
      return updated
    })
  }

  const getStockStatus = (stock) => {
    if (stock < 0) return { label: '⚠️ NEGATIVO', color: 'text-rose-400', bg: 'bg-rose-500/30', alert: true }
    if (stock === 0) return { label: 'Esgotado', color: 'text-red-400', bg: 'bg-red-500/20' }
    if (stock <= 5) return { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/20' }
    if (stock <= 10) return { label: 'Baixo', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    if (stock <= 30) return { label: 'Normal', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    return { label: 'Alto', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  }

  const getStockColor = (stock) => {
    if (stock < 0) return 'text-rose-500 font-bold animate-pulse'
    if (stock === 0) return 'text-red-500'
    if (stock <= 5) return 'text-red-400'
    if (stock <= 10) return 'text-amber-400'
    return 'text-emerald-400'
  }

  let filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'all') return matchesSearch
    if (filter === 'negative') return matchesSearch && p.stock < 0
    if (filter === 'out') return matchesSearch && p.stock === 0
    if (filter === 'low') return matchesSearch && p.stock > 0 && p.stock <= 10
    if (filter === 'pending') return matchesSearch && pendingEntries[p.id] > 0
    if (filter === 'normal') return matchesSearch && p.stock > 10
    if (filter === 'unavailable') return matchesSearch && p.isActive === false
    return matchesSearch
  })

  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'stock-desc': return (b.stock || 0) - (a.stock || 0)
      case 'stock-asc': return (a.stock || 0) - (b.stock || 0)
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'category': return (a.category || '').localeCompare(b.category || '')
      case 'price-desc': return (b.price || 0) - (a.price || 0)
      case 'price-asc': return (a.price || 0) - (b.price || 0)
      case 'pending-desc': return (pendingEntries[b.id] || 0) - (pendingEntries[a.id] || 0)
      default: return 0
    }
  })

  const stats = {
    total: products.length,
    negative: products.filter(p => p.stock < 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    low: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    unavailable: products.filter(p => p.isActive === false).length,
    pendingEntries: Object.keys(pendingEntries).length,
    totalPending: Object.values(pendingEntries).reduce((a, b) => a + b, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando estoque...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard icon="📦" value={stats.total} label="Total" color="blue" />
        {stats.negative > 0 && (
          <StatCard icon="🔴" value={stats.negative} label="Negativos" color="rose" alert />
        )}
        <StatCard icon="❌" value={stats.outOfStock} label="Esgotados" color="red" />
        <StatCard icon="⚠️" value={stats.low} label="Baixo" color="amber" />
        <StatCard icon="🚫" value={stats.unavailable} label="Indisponíveis" color="gray" />
        <StatCard icon="📥" value={stats.pendingEntries} label="C/ entrada" color="purple" />
      </div>

      {/* Alerta de estoque negativo */}
      {stats.negative > 0 && (
        <div className="bg-rose-500/20 border border-rose-500 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl animate-pulse">⚠️</span>
          <div>
            <p className="text-rose-400 font-bold">Atenção: {stats.negative} produto(s) com estoque negativo!</p>
            <p className="text-rose-300/80 text-sm">Isso significa que há mais pedidos do que estoque disponível. Reponha o estoque o mais rápido possível.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500">
          <option value="all">Todos ({stats.total})</option>
          {stats.negative > 0 && <option value="negative">⚠️ Negativos ({stats.negative})</option>}
          <option value="out">Esgotados ({stats.outOfStock})</option>
          <option value="low">Baixo ({stats.low})</option>
          <option value="unavailable">Indisponíveis ({stats.unavailable})</option>
          <option value="pending">Com entrada ({stats.pendingEntries})</option>
          <option value="normal">Normal</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500">
          <option value="stock-desc">Estoque ↓ (maior)</option>
          <option value="stock-asc">Estoque ↑ (menor)</option>
          <option value="name">Nome (A-Z)</option>
          <option value="category">Categoria (A-Z)</option>
          <option value="price-desc">Preço ↓ (maior)</option>
          <option value="price-asc">Preço ↑ (menor)</option>
          <option value="pending-desc">Entradas ↓ (maior)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#2d3640] bg-[#0f1419]/50">
                <th className="w-[25%] text-left p-4 text-gray-400 font-semibold text-xs uppercase">Produto</th>
                <th className="w-[10%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Categoria</th>
                <th className="w-[8%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Preço</th>
                <th className="w-[10%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Estoque</th>
                <th className="w-[17%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Entrada</th>
                <th className="w-[10%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Disponível</th>
                <th className="w-[10%] text-center p-4 text-gray-400 font-semibold text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum produto encontrado</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock)
                  const pendingAmount = pendingEntries[product.id] || 0
                  const isEditingStock = editingStock === product.id
                  const isEditingEntry = editingEntry === product.id

                  return (
                    <tr key={product.id} className={`border-b border-[#2d3640] hover:bg-[#242b33] ${product.stock < 0 ? 'bg-rose-500/10' :
                      product.isActive === false ? 'bg-gray-500/10 opacity-60' :
                        product.stock === 0 ? 'bg-red-500/5' : ''
                      }`}>
                      {/* Produto */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#2d3640] flex-shrink-0">
                            <Image src={product.image || '/placeholder.jpg'} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-100 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.unit}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="p-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs capitalize">
                          {product.category}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="p-4 text-center text-gray-300 text-sm">
                        {formatCurrency(product.price)}
                      </td>

                      {/* Estoque - Editável Inline Centralizado */}
                      <td className="p-4">
                        <div className="flex items-center justify-center h-10">
                          {isEditingStock ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={stockValue}
                                onChange={(e) => setStockValue(e.target.value)}
                                className="w-16 h-8 bg-[#0f1419] border border-emerald-500 rounded text-center text-gray-100 text-sm focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateStock(product.id, stockValue)
                                  if (e.key === 'Escape') setEditingStock(null)
                                }}
                                onBlur={() => handleUpdateStock(product.id, stockValue)}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingStock(product.id); setStockValue(product.stock.toString()) }}
                              className={`text-xl font-bold hover:opacity-80 transition-opacity ${getStockColor(product.stock)}`}
                            >
                              {product.stock}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Entrada Futura - Centralizada */}
                      <td className="p-4">
                        <div className="flex items-center justify-center h-10 gap-2">
                          {isEditingEntry ? (
                            <>
                              <input
                                type="number"
                                placeholder="Qtd"
                                value={entryValue}
                                onChange={(e) => setEntryValue(e.target.value)}
                                className="w-14 h-8 bg-[#0f1419] border border-purple-500 rounded text-center text-gray-100 text-sm focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEntry(product.id)
                                  if (e.key === 'Escape') { setEditingEntry(null); setEntryValue('') }
                                }}
                              />
                              <button onClick={() => handleSaveEntry(product.id)} className="text-purple-400 hover:text-purple-300">✓</button>
                              <button onClick={() => { setEditingEntry(null); setEntryValue('') }} className="text-gray-500 hover:text-gray-300">✕</button>
                            </>
                          ) : pendingAmount > 0 ? (
                            <>
                              <span className="text-purple-400 font-bold">+{pendingAmount}</span>
                              <button onClick={() => handleConfirmEntry(product.id)} className="px-2 py-1 rounded bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600">OK</button>
                              <button onClick={() => handleClearEntry(product.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditingEntry(product.id); setEntryValue('') }}
                              className="text-gray-500 hover:text-purple-400 text-sm"
                            >
                              + Adicionar
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Disponível - Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleAvailable(product.id)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${product.isActive !== false ? 'bg-emerald-500' : 'bg-gray-600'
                            }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${product.isActive !== false ? 'right-1' : 'left-1'
                            }`}></span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} ${status.alert ? 'animate-pulse' : ''}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-[#2d3640]">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum produto encontrado</div>
          ) : (
            filteredProducts.map((product) => {
              const status = getStockStatus(product.stock)
              const pendingAmount = pendingEntries[product.id] || 0
              const isEditingStock = editingStock === product.id
              const isEditingEntry = editingEntry === product.id

              return (
                <div key={product.id} className={`p-4 ${product.stock < 0 ? 'bg-rose-500/10' :
                  product.isActive === false ? 'bg-gray-500/10 opacity-60' :
                    product.stock === 0 ? 'bg-red-500/5' : ''
                  }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2d3640] flex-shrink-0">
                      <Image src={product.image || '/placeholder.jpg'} alt={product.name} width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-100 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs capitalize">{product.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.color} ${status.alert ? 'animate-pulse' : ''}`}>{status.label}</span>
                        {product.isActive === false && <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">Indisponível</span>}
                      </div>
                    </div>
                    {/* Toggle Disponível Mobile */}
                    <button
                      onClick={() => handleToggleAvailable(product.id)}
                      className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${product.isActive !== false ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${product.isActive !== false ? 'right-0.5' : 'left-0.5'
                        }`}></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#0f1419] rounded-lg p-3">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-1">Estoque</p>
                      {isEditingStock ? (
                        <input
                          type="number"
                          value={stockValue}
                          onChange={(e) => setStockValue(e.target.value)}
                          className="w-16 h-8 bg-[#1a1f26] border border-emerald-500 rounded text-center text-gray-100 focus:outline-none"
                          autoFocus
                          onBlur={() => handleUpdateStock(product.id, stockValue)}
                        />
                      ) : (
                        <button onClick={() => { setEditingStock(product.id); setStockValue(product.stock.toString()) }} className={`text-2xl font-bold ${getStockColor(product.stock)}`}>
                          {product.stock}
                        </button>
                      )}
                    </div>

                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500 mb-1">Entrada</p>
                      {isEditingEntry ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={entryValue}
                            onChange={(e) => setEntryValue(e.target.value)}
                            className="w-12 h-8 bg-[#1a1f26] border border-purple-500 rounded text-center text-gray-100 text-sm focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEntry(product.id)} className="text-purple-400">✓</button>
                        </div>
                      ) : pendingAmount > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-bold text-purple-400">+{pendingAmount}</span>
                          <button onClick={() => handleConfirmEntry(product.id)} className="px-2 py-1 rounded bg-emerald-500 text-white text-xs">OK</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingEntry(product.id); setEntryValue('') }} className="text-gray-500 hover:text-purple-400 text-sm">+ Add</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-gray-400">Esgotado/Crítico (0-5)</span></span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-gray-400">Baixo (6-10)</span></span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-gray-400">OK (+10)</span></span>
          <span className="text-gray-500">• Clique no estoque para editar • Entradas: registre e confirme quando chegar</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color, className = '', alert = false }) {
  const colors = {
    blue: 'bg-blue-500/20',
    red: 'bg-red-500/20',
    amber: 'bg-amber-500/20',
    purple: 'bg-purple-500/20',
    cyan: 'bg-cyan-500/20',
    emerald: 'bg-emerald-500/20',
    rose: 'bg-rose-500/30',
    gray: 'bg-gray-500/20',
  }
  const textColors = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    gray: 'text-gray-400',
  }
  return (
    <div className={`bg-[#1a1f26] rounded-xl border ${alert ? 'border-rose-500 animate-pulse' : 'border-[#2d3640]'} p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center text-lg`}>{icon}</div>
        <div>
          <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
