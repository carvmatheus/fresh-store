"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatOrderNumber(order) {
  if (order.order_number) return order.order_number
  const date = new Date(order.created_at)
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const idStr = order.id?.toString().slice(-4) || '0000'
  return `DH-${dateStr}-${idStr}`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function printSeparationOrder(order, products) {
  const printWindow = window.open('', '_blank')
  
  const getProductInfo = (productId) => products.find(p => p.id === productId) || {}
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Separação - ${formatOrderNumber(order)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #8b5cf6; font-size: 22px; }
        .header .order-num { font-size: 28px; font-weight: bold; margin-top: 5px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 8px; }
        .info-item { text-align: center; }
        .info-label { font-size: 11px; color: #666; text-transform: uppercase; }
        .info-value { font-size: 16px; font-weight: bold; margin-top: 2px; }
        .items-title { background: #8b5cf6; color: white; padding: 10px; font-weight: bold; text-transform: uppercase; font-size: 14px; margin: 20px 0 0 0; }
        .item-row { display: flex; align-items: center; padding: 15px 10px; border-bottom: 2px dashed #ddd; }
        .item-row:last-child { border-bottom: none; }
        .item-check { width: 30px; height: 30px; border: 3px solid #8b5cf6; border-radius: 6px; margin-right: 15px; }
        .item-num { width: 30px; height: 30px; background: #e0e0e0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
        .item-info { flex: 1; }
        .item-name { font-weight: bold; font-size: 16px; }
        .item-category { font-size: 12px; color: #666; margin-top: 2px; }
        .item-qty { text-align: right; }
        .item-qty-value { font-size: 32px; font-weight: black; color: #8b5cf6; }
        .item-qty-label { font-size: 10px; color: #666; text-transform: uppercase; }
        .address-box { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .notes-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #8b5cf6; }
        .signature-line { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-box .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 12px; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 LISTA DE SEPARAÇÃO</h1>
        <p class="order-num">${formatOrderNumber(order)}</p>
      </div>
      
      <div class="info-row">
        <div class="info-item">
          <p class="info-label">Cliente</p>
          <p class="info-value">${order.user?.company_name || order.user?.name || 'Cliente'}</p>
        </div>
        <div class="info-item">
          <p class="info-label">Data</p>
          <p class="info-value">${formatDate(order.created_at)}</p>
        </div>
        <div class="info-item">
          <p class="info-label">Total Itens</p>
          <p class="info-value">${order.items?.reduce((s, i) => s + i.quantity, 0) || 0}</p>
        </div>
        <div class="info-item">
          <p class="info-label">Valor</p>
          <p class="info-value">${formatCurrency(order.total)}</p>
        </div>
      </div>

      <div class="items-title">Itens para Separar</div>
      
      ${order.items?.map((item, idx) => {
        const productInfo = getProductInfo(item.product_id || item.product?.id)
        return `
          <div class="item-row">
            <div class="item-check"></div>
            <div class="item-num">${idx + 1}</div>
            <div class="item-info">
              <p class="item-name">${item.product?.name || item.name}</p>
              <p class="item-category">${productInfo.category || 'Geral'} • ${productInfo.unit || 'un'}</p>
            </div>
            <div class="item-qty">
              <p class="item-qty-value">${item.quantity}</p>
              <p class="item-qty-label">unidades</p>
            </div>
          </div>
        `
      }).join('') || '<p>Sem itens</p>'}

      ${order.shipping_address ? `
        <div class="address-box">
          <p style="font-weight:bold;margin-bottom:5px">📍 Endereço de Entrega</p>
          <p>${order.shipping_address.street}, ${order.shipping_address.number}</p>
          <p>${order.shipping_address.neighborhood} - ${order.shipping_address.city}/${order.shipping_address.state}</p>
          <p>CEP: ${order.shipping_address.cep}</p>
        </div>
      ` : ''}

      ${order.notes ? `
        <div class="notes-box">
          <p style="font-weight:bold;margin-bottom:5px">⚠️ Observações do Cliente</p>
          <p>${order.notes}</p>
        </div>
      ` : ''}

      <div class="signature-line">
        <div class="signature-box">
          <div class="line">Separador</div>
        </div>
        <div class="signature-box">
          <div class="line">Conferente</div>
        </div>
      </div>

      <div class="footer">
        <p style="font-size:12px;color:#666">Gerado em ${new Date().toLocaleString('pt-BR')} • Da Horta Distribuidor</p>
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}

export default function SeparationPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState(null)
  const [separatedItems, setSeparatedItems] = useState({})
  const [updating, setUpdating] = useState(false)
  const [view, setView] = useState('queue') // 'queue' | 'separating'

  useEffect(() => {
    loadData()
    // Carregar estado salvo
    const saved = localStorage.getItem('separationProgress')
    if (saved) setSeparatedItems(JSON.parse(saved))
  }, [])

  const loadData = async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        api.getAllOrders(),
        api.getProducts()
      ])
      setOrders(ordersData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
      setProducts(productsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true)
    try {
      await api.updateOrderStatus(orderId, newStatus)
      // Limpar progresso do pedido
      setSeparatedItems(prev => {
        const updated = { ...prev }
        delete updated[orderId]
        localStorage.setItem('separationProgress', JSON.stringify(updated))
        return updated
      })
      await loadData()
      setActiveOrder(null)
      setView('queue')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setUpdating(false)
    }
  }

  const getProductInfo = (productId) => {
    return products.find(p => p.id === productId) || {}
  }

  const toggleItemSeparated = (orderId, itemIndex) => {
    setSeparatedItems(prev => {
      const orderItems = prev[orderId] || []
      const updated = orderItems.includes(itemIndex)
        ? orderItems.filter(i => i !== itemIndex)
        : [...orderItems, itemIndex]
      
      const newState = { ...prev, [orderId]: updated }
      localStorage.setItem('separationProgress', JSON.stringify(newState))
      return newState
    })
  }

  const markAllSeparated = (orderId, items) => {
    setSeparatedItems(prev => {
      const allIndexes = items.map((_, idx) => idx)
      const newState = { ...prev, [orderId]: allIndexes }
      localStorage.setItem('separationProgress', JSON.stringify(newState))
      return newState
    })
  }

  const clearSeparated = (orderId) => {
    setSeparatedItems(prev => {
      const newState = { ...prev, [orderId]: [] }
      localStorage.setItem('separationProgress', JSON.stringify(newState))
      return newState
    })
  }

  const normalizeStatus = (status) => {
    const map = { 'confirmed': 'confirmado', 'preparing': 'em_preparacao' }
    return map[status] || status
  }

  const pendingOrders = orders.filter(o => ['confirmado', 'confirmed'].includes(o.status))
  const separatingOrders = orders.filter(o => ['em_preparacao', 'preparing'].includes(o.status))
  
  const stats = {
    pending: pendingOrders.length,
    separating: separatingOrders.length,
    totalItems: [...pendingOrders, ...separatingOrders].reduce((sum, o) => 
      sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  // View: Separando um pedido específico
  if (view === 'separating' && activeOrder) {
    const order = orders.find(o => o.id === activeOrder)
    if (!order) {
      setView('queue')
      setActiveOrder(null)
      return null
    }

    const orderSeparated = separatedItems[order.id] || []
    const allItems = order.items || []
    const progress = allItems.length > 0 ? (orderSeparated.length / allItems.length) * 100 : 0
    const isComplete = orderSeparated.length === allItems.length && allItems.length > 0

    return (
      <div className="space-y-4">
        {/* Header com voltar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView('queue'); setActiveOrder(null) }}
            className="w-12 h-12 rounded-xl bg-[#1a1f26] border border-[#2d3640] flex items-center justify-center text-xl hover:bg-[#242b33] transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-100">{formatOrderNumber(order)}</h2>
            <p className="text-sm text-gray-400">{order.user?.company_name || order.user?.name}</p>
          </div>
          <button
            onClick={() => printSeparationOrder(order, products)}
            className="w-12 h-12 rounded-xl bg-[#1a1f26] border border-[#2d3640] flex items-center justify-center text-xl hover:bg-[#242b33] hover:border-blue-500/50 transition-colors"
            title="Imprimir lista de separação"
          >
            🖨️
          </button>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(order.total)}</p>
            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progresso da Separação</span>
            <span className="text-sm font-bold text-emerald-400">{orderSeparated.length}/{allItems.length} itens</span>
          </div>
          <div className="h-3 bg-[#2d3640] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => markAllSeparated(order.id, allItems)}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
            >
              ✓ Marcar Todos
            </button>
            <button
              onClick={() => clearSeparated(order.id)}
              className="flex-1 px-3 py-2 rounded-lg bg-[#2d3640] text-gray-400 hover:bg-[#3d4650] transition-colors text-sm font-medium"
            >
              ✕ Limpar
            </button>
          </div>
        </div>

        {/* Lista de Itens para Separar */}
        <div className="space-y-3">
          {allItems.map((item, idx) => {
            const productInfo = getProductInfo(item.product_id || item.product?.id)
            const isSeparated = orderSeparated.includes(idx)
            
            return (
              <div
                key={idx}
                onClick={() => toggleItemSeparated(order.id, idx)}
                className={`bg-[#1a1f26] rounded-xl border-2 p-4 cursor-pointer transition-all active:scale-[0.98] ${
                  isSeparated 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-[#2d3640] hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox visual */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${
                    isSeparated ? 'bg-emerald-500 text-white' : 'bg-[#2d3640] text-gray-500'
                  }`}>
                    {isSeparated ? '✓' : idx + 1}
                  </div>

                  {/* Imagem do produto */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2d3640] flex-shrink-0">
                    <Image
                      src={productInfo.image || item.product?.image || '/placeholder.jpg'}
                      alt={item.product?.name || item.name}
                      width={64}
                      height={64}
                      className={`w-full h-full object-cover ${isSeparated ? 'opacity-50' : ''}`}
                    />
                  </div>

                  {/* Info do produto */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg ${isSeparated ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                      {item.product?.name || item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                        {productInfo.category || 'Geral'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {productInfo.unit || 'un'}
                      </span>
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className={`text-right ${isSeparated ? 'opacity-50' : ''}`}>
                    <p className="text-3xl font-black text-emerald-400">{item.quantity}</p>
                    <p className="text-xs text-gray-500 uppercase">unidades</p>
                  </div>
                </div>

                {/* Estoque atual */}
                <div className="mt-3 pt-3 border-t border-[#2d3640] flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estoque disponível:</span>
                  <span className={`text-sm font-bold ${
                    (productInfo.stock || 0) >= item.quantity ? 'text-emerald-400' :
                    (productInfo.stock || 0) > 0 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {productInfo.stock || 0} {productInfo.unit || 'un'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Endereço de Entrega */}
        {order.shipping_address && (
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-2">
              📍 Endereço de Entrega
            </h4>
            <p className="text-gray-100 font-medium">
              {order.shipping_address.street}, {order.shipping_address.number}
            </p>
            <p className="text-gray-400">
              {order.shipping_address.neighborhood} - {order.shipping_address.city}/{order.shipping_address.state}
            </p>
            {order.shipping_address.complement && (
              <p className="text-gray-500 text-sm mt-1">Complemento: {order.shipping_address.complement}</p>
            )}
          </div>
        )}

        {/* Observações */}
        {order.notes && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <h4 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2">
              ⚠️ Observações do Cliente
            </h4>
            <p className="text-gray-300">{order.notes}</p>
          </div>
        )}

        {/* Ações */}
        <div className="sticky bottom-4 bg-[#0f1419] rounded-xl border border-[#2d3640] p-4 shadow-2xl">
          {isComplete ? (
            <button
              onClick={() => handleUpdateStatus(order.id, 'em_transporte')}
              disabled={updating}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>🚚 Enviar para Transporte</>
              )}
            </button>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-400">Marque todos os itens para liberar o pedido</p>
              <p className="text-sm text-gray-500 mt-1">Faltam {allItems.length - orderSeparated.length} itens</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // View: Fila de pedidos
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="text-3xl font-bold text-blue-400">{stats.pending}</p>
              <p className="text-xs text-gray-400">Na fila</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">📦</div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{stats.separating}</p>
              <p className="text-xs text-gray-400">Separando</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{stats.totalItems}</p>
              <p className="text-xs text-gray-400">Itens total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Atualizar */}
      <div className="flex justify-end">
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg bg-[#1a1f26] border border-[#2d3640] text-gray-400 hover:text-gray-100 hover:border-emerald-500/50 transition-colors text-sm flex items-center gap-2"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      {/* Pedidos para separar */}
      {pendingOrders.length === 0 && separatingOrders.length === 0 ? (
        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-12 text-center">
          <div className="text-6xl mb-4 opacity-50">✅</div>
          <p className="text-gray-400 text-xl">Nenhum pedido para separar!</p>
          <p className="text-gray-500 mt-2">Novos pedidos confirmados aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pedidos em separação primeiro */}
          {separatingOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                📦 Em Separação ({separatingOrders.length})
              </h3>
              <div className="space-y-3">
                {separatingOrders.map(order => {
                  const itemCount = order.items?.length || 0
                  const separated = (separatedItems[order.id] || []).length
                  const progress = itemCount > 0 ? (separated / itemCount) * 100 : 0
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => { setActiveOrder(order.id); setView('separating') }}
                      className="bg-[#1a1f26] rounded-xl border-2 border-purple-500/50 p-4 cursor-pointer hover:border-purple-500 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-100">{formatOrderNumber(order)}</p>
                          <p className="text-sm text-gray-400">{order.user?.company_name || order.user?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-gray-500">{order.items?.reduce((s, i) => s + i.quantity, 0) || 0} itens</p>
                        </div>
                      </div>
                      
                      {/* Mini progress */}
                      <div className="h-2 bg-[#2d3640] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{separated}/{itemCount} itens separados</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pedidos pendentes */}
          {pendingOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-blue-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                📋 Aguardando Separação ({pendingOrders.length})
              </h3>
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={async () => {
                      // Muda status para em_preparacao e abre
                      await handleUpdateStatus(order.id, 'em_preparacao').catch(() => {})
                      setActiveOrder(order.id)
                      setView('separating')
                    }}
                    className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4 cursor-pointer hover:border-blue-500/50 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <span className="text-2xl">📋</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-100">{formatOrderNumber(order)}</p>
                          <p className="text-sm text-gray-400">{order.user?.company_name || order.user?.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">{formatCurrency(order.total)}</p>
                        <p className="text-sm text-gray-500">{order.items?.reduce((s, i) => s + i.quantity, 0) || 0} itens</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} produtos</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-[#2d3640] flex items-center justify-between">
                      <span className="text-sm text-gray-500">Clique para iniciar separação</span>
                      <span className="text-blue-400">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
