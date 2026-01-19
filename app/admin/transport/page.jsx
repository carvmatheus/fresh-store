"use client"

import { useState, useEffect } from "react"
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

export default function TransportPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('em_transporte')
  const [selectedOrders, setSelectedOrders] = useState([])
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await api.getAllOrders()
      // Ordenar por data de criação (mais antigos primeiro)
      setOrders(data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await api.updateOrderStatus(orderId, newStatus)
      await loadOrders()
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setUpdating(null)
    }
  }

  const handleBulkDeliver = async () => {
    if (selectedOrders.length === 0) return
    if (!confirm(`Marcar ${selectedOrders.length} pedido(s) como entregue(s)?`)) return
    
    for (const orderId of selectedOrders) {
      await handleUpdateStatus(orderId, 'concluido')
    }
    setSelectedOrders([])
  }

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  // Normalizar status
  const normalizeStatus = (status) => {
    const map = {
      'shipped': 'em_transporte',
      'delivered': 'concluido',
    }
    return map[status] || status
  }

  const filteredOrders = orders.filter(o => {
    const status = normalizeStatus(o.status)
    if (filter === 'em_transporte') return status === 'em_transporte'
    if (filter === 'concluido') return status === 'concluido'
    if (filter === 'all') return ['em_transporte', 'concluido'].includes(status)
    return false
  })

  const inTransitCount = orders.filter(o => normalizeStatus(o.status) === 'em_transporte').length
  const deliveredCount = orders.filter(o => normalizeStatus(o.status) === 'concluido').length
  const todayDelivered = orders.filter(o => {
    if (normalizeStatus(o.status) !== 'concluido') return false
    const today = new Date().toDateString()
    return o.updated_at && new Date(o.updated_at).toDateString() === today
  }).length

  // Agrupar por região/bairro
  const groupedByNeighborhood = filteredOrders.reduce((acc, order) => {
    const neighborhood = order.shipping_address?.neighborhood || 'Não informado'
    if (!acc[neighborhood]) acc[neighborhood] = []
    acc[neighborhood].push(order)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <p className="text-gray-400">{inTransitCount} entregas em andamento</p>
        </div>
        {selectedOrders.length > 0 && filter === 'em_transporte' && (
          <button
            onClick={handleBulkDeliver}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
          >
            ✅ Marcar {selectedOrders.length} como Entregue
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl">🚚</div>
            <div>
              <p className="text-3xl font-bold text-cyan-400">{inTransitCount}</p>
              <p className="text-sm text-gray-400">Em transporte</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{todayDelivered}</p>
              <p className="text-sm text-gray-400">Entregues hoje</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">📍</div>
            <div>
              <p className="text-3xl font-bold text-blue-400">{Object.keys(groupedByNeighborhood).length}</p>
              <p className="text-sm text-gray-400">Regiões</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">📦</div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{deliveredCount}</p>
              <p className="text-sm text-gray-400">Total concluídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilter('em_transporte'); setSelectedOrders([]) }}
          className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
            filter === 'em_transporte'
              ? 'bg-cyan-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          🚚 Em Transporte ({inTransitCount})
        </button>
        <button
          onClick={() => { setFilter('concluido'); setSelectedOrders([]) }}
          className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
            filter === 'concluido'
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          ✅ Concluídos ({deliveredCount})
        </button>
        <button
          onClick={() => { setFilter('all'); setSelectedOrders([]) }}
          className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          Todos ({inTransitCount + deliveredCount})
        </button>
        <button
          onClick={loadOrders}
          className="px-4 py-2.5 rounded-lg font-medium bg-[#1a1f26] text-gray-400 hover:bg-[#242b33] transition-colors ml-auto"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Orders by Region */}
      {Object.keys(groupedByNeighborhood).length === 0 ? (
        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🚚</div>
          <p className="text-gray-500 text-lg">Nenhuma entrega pendente</p>
          <p className="text-gray-600 text-sm mt-2">Pedidos separados aparecerão aqui para entrega</p>
        </div>
      ) : (
        Object.entries(groupedByNeighborhood).map(([neighborhood, regionOrders]) => (
          <div key={neighborhood} className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
            {/* Region Header */}
            <div className="p-4 border-b border-[#2d3640] bg-[#242b33]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl">📍</div>
                  <div>
                    <h3 className="font-bold text-gray-100">{neighborhood}</h3>
                    <p className="text-sm text-gray-500">{regionOrders.length} entregas</p>
                  </div>
                </div>
                {filter === 'em_transporte' && regionOrders.some(o => normalizeStatus(o.status) === 'em_transporte') && (
                  <button
                    onClick={() => {
                      const regionIds = regionOrders
                        .filter(o => normalizeStatus(o.status) === 'em_transporte')
                        .map(o => o.id)
                      const allSelected = regionIds.every(id => selectedOrders.includes(id))
                      if (allSelected) {
                        setSelectedOrders(prev => prev.filter(id => !regionIds.includes(id)))
                      } else {
                        setSelectedOrders(prev => [...new Set([...prev, ...regionIds])])
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1f26] text-gray-400 hover:bg-[#2d3640] transition-colors text-sm"
                  >
                    Selecionar todos
                  </button>
                )}
              </div>
            </div>

            {/* Orders List */}
            <div className="divide-y divide-[#2d3640]">
              {regionOrders.map((order) => {
                const status = normalizeStatus(order.status)
                const isSelected = selectedOrders.includes(order.id)
                const isUpdating = updating === order.id
                
                return (
                  <div
                    key={order.id}
                    className={`p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors ${
                      isSelected ? 'bg-emerald-500/10' : 'hover:bg-[#242b33]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {filter === 'em_transporte' && status === 'em_transporte' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0"
                        />
                      )}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                        status === 'concluido' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
                      }`}>
                        {status === 'concluido' ? '✅' : '🚚'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-100">{formatOrderNumber(order)}</p>
                          <span className="text-gray-600">•</span>
                          <p className="text-gray-400 truncate">
                            {order.user?.company_name || order.user?.name}
                          </p>
                        </div>
                        {order.shipping_address && (
                          <p className="text-sm text-gray-500 truncate">
                            {order.shipping_address.street}, {order.shipping_address.number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-initial">
                        <p className="font-bold text-emerald-400">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} produtos</p>
                      </div>
                      {status === 'em_transporte' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'concluido')}
                          disabled={isUpdating}
                          className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium flex-shrink-0 disabled:opacity-50"
                        >
                          {isUpdating ? '...' : '✅ Entregue'}
                        </button>
                      )}
                      {status === 'concluido' && (
                        <span className="px-4 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium flex-shrink-0">
                          ✅ Concluído
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
