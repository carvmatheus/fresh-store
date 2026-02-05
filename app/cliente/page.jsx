"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BannerHeader } from "@/components/banner-header"
import { NavigationHeader } from "@/components/navigation-header"
import { SideMenu } from "@/components/side-menu"
import { api } from "@/lib/api-client"
import { getCurrentUser, isUserApproved, isAdmin } from "@/lib/auth"

// Formatar moeda
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Formatar data
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: '⏳ Pendente' },
    pendente: { bg: 'bg-amber-100', text: 'text-amber-800', label: '⏳ Pendente' },
    confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✅ Confirmado' },
    confirmado: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✅ Confirmado' },
    delivering: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚚 Em Entrega' },
    em_entrega: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚚 Em Entrega' },
    delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✅ Entregue' },
    entregue: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✅ Entregue' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Cancelado' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Cancelado' }
  }

  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export default function ClientePage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cartCount, setCartCount] = useState(0)

  // Verificar autenticação
  useEffect(() => {
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      router.replace('/login')
      return
    }
    
    // Verificar aprovação
    if (currentUser.role !== 'admin' && currentUser.role !== 'god' && currentUser.role !== 'consultor') {
      if (currentUser.approval_status === 'pending' || currentUser.approval_status === 'suspended') {
        router.replace('/')
        return
      }
    }
    
    loadOrders()
    loadCartCount()
  }, [router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const ordersData = await api.getOrders()
      setOrders(ordersData)
      setFilteredOrders(ordersData)
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCartCount = async () => {
    try {
      const response = await api.getCart()
      if (response?.items) {
        const count = response.items.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(count)
      }
    } catch (error) {
      console.warn('Erro ao carregar carrinho')
    }
  }

  // Filtrar e ordenar pedidos
  useEffect(() => {
    let result = [...orders]
    
    // Filtrar por status
    if (filterStatus) {
      result = result.filter(order => order.status === filterStatus)
    }
    
    // Ordenar
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'value':
        result.sort((a, b) => b.total - a.total)
        break
    }
    
    setFilteredOrders(result)
  }, [orders, filterStatus, sortBy])

  // Calcular estatísticas
  const stats = {
    pendentes: orders.filter(o => o.status === 'pending' || o.status === 'pendente').length,
    confirmados: orders.filter(o => o.status === 'confirmed' || o.status === 'confirmado').length,
    emEntrega: orders.filter(o => o.status === 'delivering' || o.status === 'em_entrega').length,
    total: orders.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BannerHeader />
      <NavigationHeader 
        onMenuToggle={() => setMenuOpen(true)}
        onCartToggle={() => router.push('/carrinho')}
        cartCount={cartCount}
        onSearch={(query) => query && router.push(`/?search=${encodeURIComponent(query)}`)}
      />
      
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Meus Pedidos</h1>
            <p className="text-gray-600">Acompanhe todos os seus pedidos em tempo real</p>
          </div>
          <Link
            href="/"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ➕ Fazer Novo Pedido
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">⏳</div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Pendentes</span>
              <span className="block text-2xl font-bold text-gray-900">{stats.pendentes}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">✅</div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Confirmados</span>
              <span className="block text-2xl font-bold text-gray-900">{stats.confirmados}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">🚚</div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Em Entrega</span>
              <span className="block text-2xl font-bold text-gray-900">{stats.emEntrega}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="text-3xl w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl">📊</div>
            <div>
              <span className="text-sm text-gray-600 font-medium">Total de Pedidos</span>
              <span className="block text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrar por status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="em_entrega">Em Entrega</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="recent">Mais Recentes</option>
              <option value="oldest">Mais Antigos</option>
              <option value="value">Maior Valor</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-16 shadow-sm text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não realizou nenhum pedido</p>
            <Link
              href="/"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Começar a Comprar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <strong className="text-lg text-gray-900">#{order.order_number}</strong>
                    <div className="text-sm text-gray-600">{formatDate(order.created_at)}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Itens</span>
                    <span className="text-gray-900 font-medium text-sm">{order.items?.length || 0} produtos</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Entrega</span>
                      <span className="text-gray-900 font-medium text-sm">{formatDate(order.delivery_date)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xl font-bold text-emerald-500">{formatCurrency(order.total)}</span>
                  <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-all">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalhes do Pedido <span className="text-emerald-500">#{selectedOrder.order_number}</span>
              </h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 bg-gray-100 text-gray-700 rounded-lg text-2xl hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Status e Data */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Pedido realizado em {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              {/* Itens */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <strong className="text-gray-900">{item.product_name}</strong>
                        <div className="text-sm text-gray-600">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
                <div className="flex justify-between py-3 font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="h-px bg-gray-300 my-2"></div>
                <div className="flex justify-between py-3 text-xl font-bold text-emerald-500">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <strong className="text-amber-800">Observações:</strong>
                  <p className="text-amber-700 mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
