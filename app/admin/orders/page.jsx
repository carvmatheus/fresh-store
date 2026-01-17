"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusOptions = [
  { value: 'pending', label: 'Pendente', color: 'amber' },
  { value: 'confirmed', label: 'Confirmado', color: 'blue' },
  { value: 'preparing', label: 'Preparando', color: 'purple' },
  { value: 'shipped', label: 'Enviado', color: 'cyan' },
  { value: 'delivered', label: 'Entregue', color: 'emerald' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await api.getAllOrders()
      // Ordenar por data mais recente
      setOrders(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      await loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      preparing: 'bg-purple-500/20 text-purple-400',
      shipped: 'bg-cyan-500/20 text-cyan-400',
      delivered: 'bg-emerald-500/20 text-emerald-400',
      cancelled: 'bg-red-500/20 text-red-400',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getStatusLabel = (status) => {
    return statusOptions.find(s => s.value === status)?.label || status
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Pedidos</h2>
          <p className="text-gray-400">{orders.length} pedidos no total</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
          }`}
        >
          Todos ({orders.length})
        </button>
        {statusOptions.map(status => {
          const count = orders.filter(o => o.status === status.value).length
          return (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
              }`}
            >
              {status.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3640]">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Pedido</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Cliente</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Data</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Itens</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Total</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#2d3640] hover:bg-[#242b33] transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-emerald-400">#{order.id?.toString().slice(-6) || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-100">{order.user?.company_name || order.user?.name || 'Cliente'}</p>
                        <p className="text-sm text-gray-500">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {order.items?.length || 0} itens
                    </td>
                    <td className="p-4 font-medium text-emerald-400">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#242b33] text-gray-300 hover:bg-[#2d3640] transition-colors text-sm"
                        >
                          Detalhes
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  Pedido #{selectedOrder.id?.toString().slice(-6)}
                </h3>
                <p className="text-gray-500">
                  {selectedOrder.created_at && new Date(selectedOrder.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Update */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Atualizar Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedOrder.status === status.value
                          ? `bg-${status.color}-500 text-white`
                          : `bg-${status.color}-500/20 text-${status.color}-400 hover:bg-${status.color}-500/30`
                      }`}
                      style={{
                        backgroundColor: selectedOrder.status === status.value 
                          ? `var(--${status.color}-500, #22c55e)` 
                          : undefined
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Cliente</p>
                <div className="bg-[#0f1419] rounded-lg p-4">
                  <p className="font-medium text-gray-100">{selectedOrder.user?.company_name || selectedOrder.user?.name}</p>
                  <p className="text-sm text-gray-400">{selectedOrder.user?.email}</p>
                  {selectedOrder.user?.phone && <p className="text-sm text-gray-400">{selectedOrder.user.phone}</p>}
                </div>
              </div>

              {/* Endereço */}
              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Endereço de Entrega</p>
                  <div className="bg-[#0f1419] rounded-lg p-4">
                    <p className="text-gray-100">
                      {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}
                    </p>
                    <p className="text-gray-400">
                      {selectedOrder.shipping_address.neighborhood} - {selectedOrder.shipping_address.city}
                    </p>
                    <p className="text-gray-500">CEP: {selectedOrder.shipping_address.cep}</p>
                  </div>
                </div>
              )}

              {/* Itens */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Itens do Pedido</p>
                <div className="bg-[#0f1419] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2d3640]">
                        <th className="text-left p-3 text-gray-500 text-xs font-medium">Produto</th>
                        <th className="text-center p-3 text-gray-500 text-xs font-medium">Qtd</th>
                        <th className="text-right p-3 text-gray-500 text-xs font-medium">Preço Unit.</th>
                        <th className="text-right p-3 text-gray-500 text-xs font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#2d3640]/50">
                          <td className="p-3 text-gray-100">{item.product?.name || item.name}</td>
                          <td className="p-3 text-center text-gray-400">{item.quantity}</td>
                          <td className="p-3 text-right text-gray-400">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-right text-emerald-400">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#2d3640]">
                        <td colSpan={3} className="p-3 text-right font-bold text-gray-100">Total:</td>
                        <td className="p-3 text-right font-bold text-emerald-400 text-lg">{formatCurrency(selectedOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Observações</p>
                  <div className="bg-[#0f1419] rounded-lg p-4">
                    <p className="text-gray-300">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
