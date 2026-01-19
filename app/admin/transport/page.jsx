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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Componente de Card do Pedido (igual ao print)
function OrderCard({ order, onUpdateStatus, isUpdating }) {
  const [expanded, setExpanded] = useState(false)
  const status = order.status === 'shipped' ? 'em_transporte' : order.status
  const isInTransit = status === 'em_transporte'
  const isDelivered = status === 'concluido'
  
  const address = order.shipping_address
  const fullAddress = address 
    ? `${address.street}, ${address.number}${address.complement ? ' - ' + address.complement : ''}, ${address.neighborhood}, ${address.city}-${address.state}, ${address.cep}`
    : 'Endereço não informado'
  
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
  
  // Calcular data prevista (dia seguinte ao pedido, por exemplo)
  const expectedDate = order.expected_date || (order.created_at 
    ? new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null)

  return (
    <div className="bg-[#1a1f26] rounded-2xl border border-[#2d3640] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#2d3640]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-100">{formatOrderNumber(order)}</h3>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
            isDelivered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {isDelivered ? 'Concluído' : 'Em Transporte'}
          </span>
        </div>
        <p className="text-gray-500 text-sm">{formatDateTime(order.created_at)}</p>
      </div>
      
      {/* Info Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Comprador */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">👤 COMPRADOR:</p>
            <p className="text-gray-100 font-medium">{order.user?.name || 'Não informado'}</p>
          </div>
          
          {/* Cliente/Empresa */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">🏢 CLIENTE:</p>
            <p className="text-gray-100 font-medium">
              {order.user?.company_name || order.user?.razao_social || order.user?.name || 'Não informado'}
              {order.user?.company_name && order.user?.company_name !== order.user?.name && (
                <span className="text-gray-500"> • {order.user?.name}</span>
              )}
            </p>
          </div>
          
          {/* Quantidade */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">📦 QUANTIDADE:</p>
            <p className="text-gray-100 font-medium">{totalItems} itens</p>
          </div>
          
          {/* Endereço */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">📍 ENDEREÇO:</p>
            <p className="text-gray-100 font-medium text-sm">{fullAddress}</p>
          </div>
          
          {/* Data Prevista */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">📅 DATA PREVISTA:</p>
            <p className="text-gray-100 font-medium">{formatDate(expectedDate)}</p>
          </div>
          
          {/* Total */}
          <div className="bg-[#242b33] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">💰 TOTAL:</p>
            <p className="text-emerald-400 font-bold text-lg">{formatCurrency(order.total)}</p>
          </div>
        </div>
        
        {/* Toggle Items */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 border-t border-[#2d3640] text-gray-400 hover:text-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          📦 Itens do Pedido
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {/* Items List */}
        {expanded && (
          <div className="mt-4">
            <div className="bg-[#0f1318] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2d3640]">
                    <th className="text-left p-3 text-xs text-gray-500 font-medium uppercase">Produto</th>
                    <th className="text-center p-3 text-xs text-gray-500 font-medium uppercase">Quantidade</th>
                    <th className="text-center p-3 text-xs text-gray-500 font-medium uppercase">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#2d3640] last:border-0">
                      <td className="p-3 text-gray-100">{item.product_name || item.name || 'Produto'}</td>
                      <td className="p-3 text-center text-gray-100 font-bold">{item.quantity}</td>
                      <td className="p-3 text-center text-gray-400 uppercase text-sm">{item.unit || 'UN'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <div className="p-5 pt-0">
        {isInTransit && (
          <button
            onClick={() => onUpdateStatus(order.id, 'concluido')}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isUpdating ? '...' : '✅ Concluído'}
          </button>
        )}
        {isDelivered && (
          <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-center">
            ✅ Entrega Concluída
          </div>
        )}
      </div>
    </div>
  )
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
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">📦</div>
            <div>
              <p className="text-3xl font-bold text-purple-400">{deliveredCount}</p>
              <p className="text-sm text-gray-400">Total concluídos</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="text-3xl font-bold text-amber-400">{filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}</p>
              <p className="text-sm text-gray-400">Total de produtos</p>
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

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🚚</div>
          <p className="text-gray-500 text-lg">Nenhuma entrega pendente</p>
          <p className="text-gray-600 text-sm mt-2">Pedidos separados aparecerão aqui para entrega</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updating === order.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
