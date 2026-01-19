"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"

// Formatar moeda
function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formatar código do pedido
function formatOrderNumber(order) {
  if (order.order_number) return order.order_number
  const date = new Date(order.created_at)
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const idStr = order.id?.toString().slice(-4) || '0000'
  return `DH-${dateStr}-${idStr}`
}

// Card de estatística
function StatCard({ icon, label, value, subValue, color = "emerald", href }) {
  const colorClasses = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  }

  const Content = (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} transition-all hover:scale-[1.02] cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`text-3xl font-bold`}>{value}</span>
      </div>
      <p className="text-gray-400 font-medium">{label}</p>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{Content}</Link>
  }
  return Content
}

// Card de ação rápida
function ActionCard({ icon, label, description, href, color = "emerald" }) {
  const colorClasses = {
    emerald: "hover:border-emerald-500/50 hover:bg-emerald-500/5",
    blue: "hover:border-blue-500/50 hover:bg-blue-500/5",
    amber: "hover:border-amber-500/50 hover:bg-amber-500/5",
    purple: "hover:border-purple-500/50 hover:bg-purple-500/5",
  }

  return (
    <Link
      href={href}
      className={`block p-6 rounded-xl border border-[#2d3640] bg-[#1a1f26] transition-all ${colorClasses[color]}`}
    >
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-bold text-gray-100 mb-1">{label}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    lowStock: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Carregar dados em paralelo
      const [products, orders, users] = await Promise.all([
        api.getProducts(),
        api.getAllOrders(),
        api.getUsers(),
      ])

      // Calcular estatísticas
      const pendingApprovals = users.filter(u => u.approval_status === 'pending').length
      const lowStock = products.filter(p => p.stock <= 10).length
      
      // Pedidos de hoje
      const today = new Date().toDateString()
      const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        pendingApprovals,
        lowStock,
        todayOrders: todayOrders.length,
        todayRevenue,
        totalRevenue,
      })

      // Últimos 5 pedidos
      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
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
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          label="Total de Produtos"
          value={stats.totalProducts}
          href="/admin/products"
          color="emerald"
        />
        <StatCard
          icon="🛒"
          label="Total de Pedidos"
          value={stats.totalOrders}
          subValue={`${stats.todayOrders} hoje`}
          href="/admin/orders"
          color="blue"
        />
        <StatCard
          icon="👥"
          label="Clientes"
          value={stats.totalUsers}
          subValue={stats.pendingApprovals > 0 ? `${stats.pendingApprovals} pendentes` : 'Todos aprovados'}
          href="/admin/users"
          color="purple"
        />
        <StatCard
          icon="💰"
          label="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          subValue={`${formatCurrency(stats.todayRevenue)} hoje`}
          color="emerald"
        />
      </div>

      {/* Alerts */}
      {(stats.pendingApprovals > 0 || stats.lowStock > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingApprovals > 0 && (
            <Link
              href="/admin/approvals"
              className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-all"
            >
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="font-bold text-amber-400">{stats.pendingApprovals} aprovações pendentes</p>
                <p className="text-sm text-gray-400">Clique para revisar</p>
              </div>
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link
              href="/admin/stock"
              className="flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all"
            >
              <span className="text-3xl">📉</span>
              <div>
                <p className="font-bold text-red-400">{stats.lowStock} produtos com estoque baixo</p>
                <p className="text-sm text-gray-400">Clique para gerenciar</p>
          </div>
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon="📦"
            label="Gerenciar Produtos"
            description="Adicionar, editar ou remover produtos"
            href="/admin/products"
            color="emerald"
          />
          <ActionCard
            icon="🏬"
            label="Controle de Estoque"
            description="Atualizar quantidades em estoque"
            href="/admin/stock"
            color="blue"
          />
          <ActionCard
            icon="🛒"
            label="Ver Pedidos"
            description="Gerenciar pedidos dos clientes"
            href="/admin/orders"
            color="amber"
          />
          <ActionCard
            icon="✅"
            label="Aprovar Clientes"
            description="Revisar solicitações de cadastro"
            href="/admin/approvals"
            color="purple"
          />
                </div>
            </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100">Pedidos Recentes</h2>
          <Link href="/admin/orders" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            Ver todos →
          </Link>
          </div>

        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d3640]">
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">Pedido</th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">Cliente</th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">Data</th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">Total</th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#2d3640] hover:bg-[#242b33] transition-colors">
                      <td className="p-4 font-mono text-sm text-emerald-400 font-bold">{formatOrderNumber(order)}</td>
                      <td className="p-4 text-gray-300">{order.user?.company_name || order.user?.name || 'Cliente'}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-4 font-medium text-emerald-400">{formatCurrency(order.total)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                  </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            </div>
          </div>
    </div>
  )
}
