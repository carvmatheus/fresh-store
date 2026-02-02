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
  const [sortBy, setSortBy] = useState('none') // 'none', 'stock-desc', 'stock-asc', 'name', 'category', 'price-desc', 'price-asc'
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // 'all', 'available', 'unavailable'
  const [promoFilter, setPromoFilter] = useState('all') // 'all', 'promo', 'not-promo'
  const [editingProduct, setEditingProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState('list') // 'list' ou 'promo-order'

  // Popup para preço promocional
  const [promoPopup, setPromoPopup] = useState({ show: false, product: null, price: '' })

  // Estado para ordenação de promoções (cópia local para drag and drop)
  const [promoOrderList, setPromoOrderList] = useState([])
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

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

  const handleSaveProduct = async (productData, isFormData = false) => {
    try {
      if (editingProduct?.id) {
        await api.updateProduct(editingProduct.id, productData, isFormData)
      } else {
        await api.createProduct(productData, isFormData)
      }
      await loadProducts()
      setShowModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto: ' + error.message)
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

  // Abrir popup para definir preço promocional
  const handleTogglePromo = (product) => {
    const isCurrentlyPromo = product.isPromo || product.is_promo

    if (isCurrentlyPromo) {
      // Desativar promoção
      handleSavePromo(product, false, null)
    } else {
      // Abrir popup para definir preço
      setPromoPopup({
        show: true,
        product: product,
        price: product.promoPrice || product.promo_price || ''
      })
    }
  }

  // Salvar promoção - SEMPRE enviar is_promo (true ou false)
  const handleSavePromo = async (product, isPromo, promoPrice) => {
    // Fechar popup primeiro
    setPromoPopup({ show: false, product: null, price: '' })

    // Atualização otimista
    setProducts(prev => prev.map(p =>
      p.id === product.id ? {
        ...p,
        isPromo: isPromo,
        is_promo: isPromo,
        promoPrice: promoPrice,
        promo_price: promoPrice
      } : p
    ))

    try {
      // Envia todos os campos do produto
      const formData = new FormData()
      formData.append('name', product.name)
      formData.append('category', product.category)
      formData.append('price', String(product.price))
      formData.append('unit', product.unit)
      formData.append('min_order', String(product.min_order || product.minOrder || 1))
      formData.append('stock', String(product.stock))
      formData.append('description', product.description || '')

      // Importante: manter a imagem
      if (product.image_url) {
        formData.append('image_url', product.image_url)
      }
      if (product.cloudinary_public_id) {
        formData.append('cloudinary_public_id', product.cloudinary_public_id)
      }

      // Manter disponibilidade
      formData.append('is_active', product.is_active !== false ? 'true' : 'false')

      // SEMPRE enviar is_promo, seja true ou false
      formData.append('is_promo', isPromo ? 'true' : 'false')

      // Preço promocional (só se ativar promoção)
      if (isPromo && promoPrice) {
        formData.append('promo_price', String(promoPrice))
      }

      // Manter display_order
      if (product.display_order !== undefined) {
        formData.append('display_order', String(product.display_order))
      }

      console.log('📤 Salvando produto:', product.name, 'is_promo:', isPromo)

      const response = await api.updateProduct(product.id, formData)
      console.log('✅ Produto atualizado:', response)

      // Recarregar para confirmar que salvou
      await loadProducts()
    } catch (error) {
      console.error('❌ Erro ao atualizar promoção:', error)
      alert('Erro ao salvar promoção: ' + error.message)
      await loadProducts()
    }
  }

  const handleToggleAvailable = async (product) => {
    // Backend usa is_active para disponibilidade
    const currentValue = product.is_active !== false
    const newValue = !currentValue

    // Atualização otimista imediata
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, is_available: newValue, is_active: newValue } : p
    ))

    try {
      // Envia todos os campos do produto
      const formData = new FormData()
      formData.append('name', product.name)
      formData.append('category', product.category)
      formData.append('price', String(product.price))
      formData.append('unit', product.unit)
      formData.append('min_order', String(product.min_order || product.minOrder || 1))
      formData.append('stock', String(product.stock))
      formData.append('description', product.description || '')

      // SEMPRE enviar is_active
      formData.append('is_active', newValue ? 'true' : 'false')

      // Importante: manter a imagem
      if (product.image_url) {
        formData.append('image_url', product.image_url)
      }
      if (product.cloudinary_public_id) {
        formData.append('cloudinary_public_id', product.cloudinary_public_id)
      }

      // SEMPRE enviar is_promo (não apenas quando for true)
      formData.append('is_promo', product.is_promo ? 'true' : 'false')
      if (product.is_promo && product.promo_price) {
        formData.append('promo_price', String(product.promo_price))
      }

      // Manter display_order
      if (product.display_order !== undefined) {
        formData.append('display_order', String(product.display_order))
      }

      console.log('📤 Salvando disponibilidade:', product.name, 'is_active:', newValue)

      const response = await api.updateProduct(product.id, formData)
      console.log('✅ Disponibilidade atualizada:', response)

      // Recarregar para confirmar que salvou
      await loadProducts()
    } catch (error) {
      console.error('❌ Erro ao atualizar disponibilidade:', error)
      alert('Erro ao salvar: ' + error.message)
      await loadProducts()
    }
  }

  // Filtrar e ordenar produtos
  const getFilteredProducts = () => {
    let filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter

      // Filtro de disponibilidade
      const isAvailable = p.is_active !== false
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && isAvailable) ||
        (availabilityFilter === 'unavailable' && !isAvailable)

      // Filtro de promoção
      const isPromo = p.isPromo || p.is_promo
      const matchesPromo = promoFilter === 'all' ||
        (promoFilter === 'promo' && isPromo) ||
        (promoFilter === 'not-promo' && !isPromo)

      return matchesSearch && matchesCategory && matchesAvailability && matchesPromo
    })

    // Ordenação
    switch (sortBy) {
      case 'stock-desc':
        filtered = [...filtered].sort((a, b) => (b.stock || 0) - (a.stock || 0))
        break
      case 'stock-asc':
        filtered = [...filtered].sort((a, b) => (a.stock || 0) - (b.stock || 0))
        break
      case 'name':
        filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'category':
        filtered = [...filtered].sort((a, b) => (a.category || '').localeCompare(b.category || ''))
        break
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0))
        break
    }

    return filtered
  }

  const filteredProducts = getFilteredProducts()

  // Produtos em promoção ordenados (backend usa display_order)
  const promoProducts = products
    .filter(p => p.isPromo || p.is_promo)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))

  // Inicializar lista de ordenação quando mudar para a view de promo-order
  useEffect(() => {
    if (view === 'promo-order') {
      setPromoOrderList([...promoProducts])
      setHasOrderChanges(false)
    }
  }, [view, products.length])

  // Mover item na lista local (sem salvar ainda)
  const moveItemInList = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= promoOrderList.length) return

    const newList = [...promoOrderList]
    const [movedItem] = newList.splice(fromIndex, 1)
    newList.splice(toIndex, 0, movedItem)

    setPromoOrderList(newList)
    setHasOrderChanges(true)
  }

  // Salvar ordem no backend
  const savePromoOrder = async () => {
    setSavingOrder(true)
    try {
      const orderData = promoOrderList.map((product, index) => ({
        id: product.id,
        display_order: index + 1
      }))

      console.log('📊 Salvando ordem:', orderData)
      await api.updateProductsOrder(orderData)

      setHasOrderChanges(false)
      await loadProducts()
      alert('✅ Ordem salva com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao salvar ordem:', error)
      alert('Erro ao salvar ordem: ' + error.message)
    } finally {
      setSavingOrder(false)
    }
  }

  // Drag and Drop handlers
  const [dragState, setDragState] = useState({ dragging: null, over: null })

  const handleDragStart = (e, index) => {
    setDragState({ dragging: index, over: null })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragState.dragging !== null && dragState.dragging !== index) {
      setDragState(prev => ({ ...prev, over: index }))
    }
  }

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, over: null }))
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()

    if (dragState.dragging !== null && dragState.dragging !== targetIndex) {
      moveItemInList(dragState.dragging, targetIndex)
    }

    setDragState({ dragging: null, over: null })
  }

  const handleDragEnd = () => {
    setDragState({ dragging: null, over: null })
  }

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
          <p className="text-gray-400">{products.length} produtos • {promoProducts.length} em promoção</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingProduct({}); setShowModal(true) }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>➕</span> Novo Produto
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-[#1a1f26] rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'list' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-100'
            }`}
        >
          📋 Lista de Produtos
        </button>
        <button
          onClick={() => setView('promo-order')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'promo-order' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-100'
            }`}
        >
          🔥 Ordenar Promoções ({promoProducts.length})
        </button>
      </div>

      {view === 'list' ? (
        <>
          {/* Filters */}
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Busca */}
              <div className="lg:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">🔍 Buscar</label>
                <input
                  type="text"
                  placeholder="Nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">🏷️ Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Ordenar */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">📊 Ordenar</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="none">Sem ordenação</option>
                  <option value="stock-desc">Estoque ↓ (maior)</option>
                  <option value="stock-asc">Estoque ↑ (menor)</option>
                  <option value="name">Nome (A-Z)</option>
                  <option value="category">Categoria (A-Z)</option>
                  <option value="price-desc">Preço ↓ (maior)</option>
                  <option value="price-asc">Preço ↑ (menor)</option>
                </select>
              </div>

              {/* Disponibilidade */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">✅ Disponibilidade</label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todos</option>
                  <option value="available">✅ Disponíveis</option>
                  <option value="unavailable">❌ Indisponíveis</option>
                </select>
              </div>

              {/* Promoção */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">🔥 Promoção</label>
                <select
                  value={promoFilter}
                  onChange={(e) => setPromoFilter(e.target.value)}
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todos</option>
                  <option value="promo">🔥 Em Promo</option>
                  <option value="not-promo">Sem Promo</option>
                </select>
              </div>
            </div>

            {/* Segunda linha - contador e limpar */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#2d3640]">

              {/* Limpar filtros */}
              {(search || categoryFilter !== 'all' || sortBy !== 'none' || availabilityFilter !== 'all' || promoFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                    setSortBy('none')
                    setAvailabilityFilter('all')
                    setPromoFilter('all')
                  }}
                  className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  ✕ Limpar filtros
                </button>
              )}

              {/* Contador */}
              <span className="text-sm text-gray-500 ml-auto">
                {filteredProducts.length} de {products.length} produtos
              </span>
            </div>
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
                    <th className="text-center p-4 text-gray-400 font-medium text-sm">Disponível</th>
                    <th className="text-center p-4 text-gray-400 font-medium text-sm">Promo</th>
                    <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
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
                            <p className={`font-medium ${(product.isPromo || product.is_promo) && (product.promoPrice || product.promo_price) ? 'text-gray-500 line-through text-sm' : 'text-gray-100'}`}>
                              {formatCurrency(product.price)}
                            </p>
                            {(product.isPromo || product.is_promo) && (product.promoPrice || product.promo_price) && (
                              <p className="font-bold text-emerald-400">{formatCurrency(product.promoPrice || product.promo_price)}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${product.stock < 0 ? 'text-rose-400 animate-pulse' :
                              product.stock === 0 ? 'text-red-400' :
                                product.stock <= 10 ? 'text-amber-400' :
                                  'text-gray-100'
                            }`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>
                        {/* Disponível */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleAvailable(product)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${(product.is_available ?? product.is_active) !== false ? 'bg-emerald-500' : 'bg-gray-600'
                              }`}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(product.is_available ?? product.is_active) !== false ? 'right-1' : 'left-1'
                              }`} />
                          </button>
                        </td>
                        {/* Promo */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleTogglePromo(product)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${(product.isPromo || product.is_promo) ? 'bg-orange-500' : 'bg-gray-600'
                              }`}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(product.isPromo || product.is_promo) ? 'right-1' : 'left-1'
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
        </>
      ) : (
        /* View: Ordenar Promoções */
        <div className="space-y-4">
          {/* Header com botão salvar */}
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="font-bold text-gray-100">Ordem do Carrossel de Promoções</h3>
                  <p className="text-sm text-gray-500">Arraste e solte para reordenar ou use as setas</p>
                </div>
              </div>

              {/* Botão Salvar */}
              {promoOrderList.length > 0 && (
                <button
                  onClick={savePromoOrder}
                  disabled={!hasOrderChanges || savingOrder}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${hasOrderChanges && !savingOrder
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {savingOrder ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      💾 {hasOrderChanges ? 'Salvar Ordem' : 'Ordem Salva'}
                    </>
                  )}
                </button>
              )}
            </div>

            {hasOrderChanges && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 text-sm">
                ⚠️ Você tem alterações não salvas. Clique em "Salvar Ordem" para aplicar.
              </div>
            )}

            {promoOrderList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2 opacity-50">🔥</div>
                <p>Nenhum produto em promoção</p>
                <p className="text-sm mt-1">Ative a promoção em um produto para ele aparecer aqui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {promoOrderList.map((product, index) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 bg-[#0f1419] rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${dragState.over === index
                        ? 'border-orange-500 bg-orange-500/10 scale-[1.02]'
                        : dragState.dragging === index
                          ? 'border-orange-300 opacity-40 scale-95'
                          : 'border-transparent hover:border-[#2d3640]'
                      }`}
                  >
                    {/* Posição */}
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-orange-400">{index + 1}</span>
                    </div>

                    {/* Handle */}
                    <div className="text-gray-500 cursor-grab text-xl">☰</div>

                    {/* Imagem */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                      {(product.image || product.image_url) && (
                        <img
                          src={product.image || product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-100 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatCurrency(product.promoPrice || product.promo_price || product.price)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs">
                          -{Math.round((1 - (product.promoPrice || product.promo_price || product.price) / product.price) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItemInList(index, index - 1)}
                        disabled={index === 0}
                        className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveItemInList(index, index + 1)}
                        disabled={index === promoOrderList.length - 1}
                        className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => { setEditingProduct(product); setShowModal(true) }}
                        className="p-2 rounded hover:bg-blue-500/20 text-blue-400"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleTogglePromo(product)}
                        className="p-2 rounded hover:bg-red-500/20 text-red-400"
                        title="Remover da promoção"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {promoOrderList.length > 0 && (
            <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
              <h4 className="font-medium text-gray-100 mb-3">👁️ Preview do Carrossel (nova ordem)</h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {promoOrderList.slice(0, 5).map((product, i) => (
                  <div key={product.id} className="flex-shrink-0 w-32 bg-[#0f1419] rounded-lg overflow-hidden">
                    <div className="relative">
                      {(product.image || product.image_url) && (
                        <img
                          src={product.image || product.image_url}
                          alt={product.name}
                          className="w-full h-24 object-cover"
                        />
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                        🔥 #{i + 1}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-100 truncate">{product.name}</p>
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(product.promoPrice || product.promo_price || product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Produto */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null) }}
          onSave={handleSaveProduct}
        />
      )}

      {/* Popup Preço Promocional */}
      {promoPopup.show && promoPopup.product && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-sm shadow-2xl">
            <div className="p-4 border-b border-[#2d3640]">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                🔥 Ativar Promoção
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 bg-[#0f1419] rounded-lg p-3">
                {(promoPopup.product.image || promoPopup.product.image_url) && (
                  <img
                    src={promoPopup.product.image || promoPopup.product.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-100 truncate">{promoPopup.product.name}</p>
                  <p className="text-sm text-gray-500">Preço atual: {formatCurrency(promoPopup.product.price)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Preço Promocional (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={promoPopup.price}
                  onChange={(e) => setPromoPopup(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-[#0f1419] border-2 border-orange-500/50 rounded-lg px-4 py-3 text-xl font-bold text-gray-100 focus:outline-none focus:border-orange-500 text-center"
                  placeholder="0.00"
                  autoFocus
                />
                {promoPopup.price && promoPopup.product.price > 0 && (
                  <p className="text-center text-sm text-orange-400 mt-2">
                    Desconto de {Math.round((1 - parseFloat(promoPopup.price) / promoPopup.product.price) * 100)}%
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#2d3640] flex gap-3">
              <button
                onClick={() => setPromoPopup({ show: false, product: null, price: '' })}
                className="flex-1 px-4 py-2 rounded-lg border border-[#2d3640] text-gray-400 hover:bg-[#242b33] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const price = parseFloat(promoPopup.price)
                  if (!price || price <= 0) {
                    alert('Digite um preço promocional válido')
                    return
                  }
                  handleSavePromo(promoPopup.product, true, price)
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                🔥 Ativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    promoPrice: product?.promoPrice || product?.promo_price || '',
    stock: product?.stock ?? '',
    unit: product?.unit || 'kg',
    category: product?.category || 'vegetais',
    image: product?.image || product?.image_url || '',
    minOrder: product?.minOrder || product?.min_order || 1,
    isPromo: product?.isPromo || product?.is_promo || false,
    is_active: (product?.is_available ?? product?.is_active) !== false,
    display_order: product?.display_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product?.image || product?.image_url || '')
  const fileInputRef = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // SEMPRE usar FormData para garantir compatibilidade com o backend
    const formDataToSend = new FormData()

    // Adicionar campos ao FormData
    formDataToSend.append('name', formData.name)
    formDataToSend.append('description', formData.description || '')
    formDataToSend.append('price', parseFloat(formData.price) || 0)
    if (formData.promoPrice) {
      formDataToSend.append('promo_price', parseFloat(formData.promoPrice))
    }
    formDataToSend.append('stock', parseInt(formData.stock) || 0)
    formDataToSend.append('unit', formData.unit)
    formDataToSend.append('category', formData.category)
    formDataToSend.append('min_order', parseInt(formData.minOrder) || 1)
    formDataToSend.append('is_promo', formData.isPromo)
    formDataToSend.append('is_active', formData.is_active)
    formDataToSend.append('display_order', parseInt(formData.display_order) || 0)

    // Adicionar imagem (arquivo ou URL)
    if (imageFile) {
      formDataToSend.append('image_file', imageFile)
    } else if (formData.image) {
      formDataToSend.append('image_url', formData.image)
    }

    await onSave(formDataToSend, true) // true = isFormData
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
          {/* Imagem */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Imagem do Produto</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                onClick={() => document.getElementById('productImageInput').click()}
                className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${imagePreview ? 'border-emerald-500' : 'border-[#2d3640] hover:border-gray-500'
                  }`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <div className="text-3xl mb-1">🖼️</div>
                    <p className="text-xs text-gray-500">Clique para selecionar</p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  id="productImageInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('productImageInput').click()}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  📤 Upload Imagem
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    🗑️ Remover Imagem
                  </button>
                )}
                <div className="text-xs text-gray-500">ou cole uma URL:</div>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value })
                    setImagePreview(e.target.value)
                    setImageFile(null)
                  }}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome *</label>
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
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$) *</label>
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
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço Promo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.promoPrice}
                onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                placeholder="Deixe vazio se não for promo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Estoque *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Unidade *</label>
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
                <option value="maço">maço</option>
                <option value="caixa">caixa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Categoria *</label>
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
                min="1"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Toggles visuais */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Disponível */}
              <div
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.is_active
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#2d3640] bg-[#0f1419] hover:border-gray-500'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{formData.is_active ? '✅' : '🚫'}</span>
                    <div>
                      <p className="font-medium text-gray-100">Disponível</p>
                      <p className="text-xs text-gray-500">Produto visível na loja</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'
                      }`}></span>
                  </div>
                </div>
              </div>

              {/* Promoção */}
              <div
                onClick={() => setFormData({ ...formData, isPromo: !formData.isPromo })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isPromo
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-[#2d3640] bg-[#0f1419] hover:border-gray-500'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="font-medium text-gray-100">Em Promoção</p>
                      <p className="text-xs text-gray-500">Aparece no carrossel</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isPromo ? 'bg-orange-500' : 'bg-gray-600'
                    }`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPromo ? 'right-1' : 'left-1'
                      }`}></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordem no carrossel (só aparece se for promo) */}
            {formData.isPromo && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Ordem no Carrossel de Promoções</label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  placeholder="0 = primeiro"
                />
                <p className="text-xs text-gray-500 mt-1">Menor número aparece primeiro no carrossel</p>
              </div>
            )}
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
              {saving ? '⏳ Salvando...' : '✓ Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
