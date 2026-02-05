"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import Link from "next/link"

const TIERS = [
  { id: 'bronze', name: 'Bronze', color: 'bg-orange-700/20 text-orange-400 border-orange-700/30' },
  { id: 'prata', name: 'Prata', color: 'bg-gray-400/20 text-gray-300 border-gray-400/30' },
  { id: 'ouro', name: 'Ouro', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'platina', name: 'Platina', color: 'bg-indigo-300/20 text-indigo-200 border-indigo-300/30' },
  { id: 'diamante', name: 'Diamante', color: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30' },
]

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BulkPricingPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [selectedTiers, setSelectedTiers] = useState(new Set())
  const [percentage, setPercentage] = useState('')
  const [applyToBase, setApplyToBase] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ limit: 500 })
      setProducts(data)
      
      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data.map(p => p.category))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      alert('❌ Erro ao carregar produtos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (productId) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const toggleTier = (tierId) => {
    const newSelected = new Set(selectedTiers)
    if (newSelected.has(tierId)) {
      newSelected.delete(tierId)
    } else {
      newSelected.add(tierId)
    }
    setSelectedTiers(newSelected)
  }

  const selectAllProducts = () => {
    const filtered = getFilteredProducts()
    if (selectedProducts.size === filtered.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filtered.map(p => p.id)))
    }
  }

  const selectAllTiers = () => {
    if (selectedTiers.size === TIERS.length) {
      setSelectedTiers(new Set())
    } else {
      setSelectedTiers(new Set(TIERS.map(t => t.id)))
    }
  }

  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }

  const handleApply = async () => {
    if (selectedProducts.size === 0) {
      alert('⚠️ Selecione pelo menos um produto')
      return
    }
    if (selectedTiers.size === 0) {
      alert('⚠️ Selecione pelo menos um tier')
      return
    }
    if (!percentage || isNaN(parseFloat(percentage))) {
      alert('⚠️ Digite um percentual válido')
      return
    }

    const percentValue = parseFloat(percentage)
    if (percentValue < -100) {
      alert('⚠️ O percentual não pode ser menor que -100%')
      return
    }

    const productNames = Array.from(selectedProducts)
      .map(id => products.find(p => p.id === id)?.name)
      .filter(Boolean)
      .slice(0, 5)
      .join(', ')
    const moreProducts = selectedProducts.size > 5 ? ` e mais ${selectedProducts.size - 5}` : ''
    
    const tierNames = Array.from(selectedTiers)
      .map(id => TIERS.find(t => t.id === id)?.name)
      .join(', ')

    const confirmMessage = `Deseja aplicar ${percentValue > 0 ? '+' : ''}${percentValue}% nos tiers [${tierNames}] para ${selectedProducts.size} produto(s)?\n\nProdutos: ${productNames}${moreProducts}`
    
    if (!confirm(confirmMessage)) return

    setSaving(true)
    try {
      const response = await api.bulkUpdatePricing({
        product_ids: Array.from(selectedProducts),
        tiers: Array.from(selectedTiers),
        percentage_change: percentValue,
        apply_to_base_price: applyToBase
      })

      alert(`✅ ${response.message}\n\n${response.updated_count} produtos atualizados com sucesso!`)
      
      // Limpar seleções
      setSelectedProducts(new Set())
      setSelectedTiers(new Set())
      setPercentage('')
      
      // Recarregar produtos
      await loadProducts()
    } catch (error) {
      console.error('Erro ao atualizar preços:', error)
      alert('❌ Erro ao atualizar preços: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = getFilteredProducts()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">💰 Edição em Massa de Preços</h2>
          <p className="text-gray-400">Atualize preços de múltiplos produtos por tier usando percentual</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 rounded-lg bg-[#2d3640] text-gray-300 hover:bg-[#3d4650] transition-colors"
        >
          ← Voltar para Produtos
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Produtos Selecionados</p>
          <p className="text-3xl font-bold text-blue-400">{selectedProducts.size}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Tiers Selecionados</p>
          <p className="text-3xl font-bold text-emerald-400">{selectedTiers.size}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total de Produtos</p>
          <p className="text-3xl font-bold text-yellow-400">{filteredProducts.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Seleção de Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-100">📦 Selecionar Produtos</h3>
              <button
                onClick={selectAllProducts}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                {selectedProducts.size === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">🔍 Buscar</label>
                <input
                  type="text"
                  placeholder="Nome ou categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">📋 Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum produto encontrado</p>
              ) : (
                filteredProducts.map(product => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProducts.has(product.id)
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-[#0f1318] border-[#2d3640] hover:border-[#3d4650]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-5 h-5 rounded border-[#2d3640] bg-[#0f1318] text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-100 font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{product.category}</span>
                        <span className="text-xs text-emerald-400 font-medium">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: Configuração */}
        <div className="space-y-4">
          {/* Seleção de Tiers */}
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-100">👑 Selecionar Tiers</h3>
              <button
                onClick={selectAllTiers}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                {selectedTiers.size === TIERS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="space-y-2">
              {TIERS.map(tier => (
                <label
                  key={tier.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTiers.has(tier.id)
                      ? `${tier.color} border-current`
                      : 'bg-[#0f1318] border-[#2d3640] hover:border-[#3d4650]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTiers.has(tier.id)}
                    onChange={() => toggleTier(tier.id)}
                    className="w-5 h-5 rounded border-[#2d3640] bg-[#0f1318] text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-medium">{tier.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Configuração de Percentual */}
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">⚙️ Configuração</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">📊 Percentual de Alteração</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="Ex: 10 (aumenta 10%) ou -5 (reduz 5%)"
                    className="flex-1 bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {percentage && !isNaN(parseFloat(percentage)) && (
                    <span className={parseFloat(percentage) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {parseFloat(percentage) >= 0 ? '↑ Aumenta' : '↓ Reduz'} {Math.abs(parseFloat(percentage))}%
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToBase}
                    onChange={(e) => setApplyToBase(e.target.checked)}
                    className="w-5 h-5 rounded border-[#2d3640] bg-[#0f1318] text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-300">
                    Aplicar ao preço base
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Se desmarcado, aplica ao preço do tier existente
                </p>
              </div>
            </div>
          </div>

          {/* Botão Aplicar */}
          <button
            onClick={handleApply}
            disabled={saving || selectedProducts.size === 0 || selectedTiers.size === 0 || !percentage}
            className="w-full py-4 rounded-lg bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '⏳ Aplicando...' : `✅ Aplicar em ${selectedProducts.size} produto(s)`}
          </button>

          {/* Preview */}
          {selectedProducts.size > 0 && selectedTiers.size > 0 && percentage && !isNaN(parseFloat(percentage)) && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-2">📋 Preview</p>
              <p className="text-sm text-gray-300">
                {selectedProducts.size} produto(s) × {selectedTiers.size} tier(s) = {selectedProducts.size * selectedTiers.size} atualização(ões)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Percentual: {parseFloat(percentage) >= 0 ? '+' : ''}{percentage}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
