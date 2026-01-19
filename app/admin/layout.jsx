"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { api } from "@/lib/api-client"

const menuItems = [
  { id: "dashboard", href: "/admin", icon: "📊", label: "Dashboard" },
  { id: "products", href: "/admin/products", icon: "📦", label: "Produtos" },
  { id: "stock", href: "/admin/stock", icon: "🏬", label: "Estoque", badgeType: "stock" },
  { id: "campaigns", href: "/admin/campaigns", icon: "🎯", label: "Campanhas" },
  { id: "orders", href: "/admin/orders", icon: "🛒", label: "Pedidos" },
  { id: "separation", href: "/admin/separation", icon: "📦", label: "Separação" },
  { id: "transport", href: "/admin/transport", icon: "🚚", label: "Transporte" },
  { id: "users", href: "/admin/users", icon: "👥", label: "Clientes" },
  { id: "approvals", href: "/admin/approvals", icon: "✅", label: "Aprovações", badgeType: "pending" },
]

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [stockAlerts, setStockAlerts] = useState(0)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.replace('/login')
      return
    }
    if (!isAdmin()) {
      router.replace('/')
      return
    }
    setUser(currentUser)
    setLoading(false)

    // Carregar contadores apenas se autenticado
    if (currentUser && isAdmin()) {
      loadCounts()
    }
    
    // Forçar fundo escuro em html e body para admin
    document.documentElement.style.backgroundColor = '#0f1419'
    document.body.style.backgroundColor = '#0f1419'
    document.documentElement.setAttribute('data-admin', 'true')
    
    // Cleanup ao sair
    return () => {
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = ''
      document.documentElement.removeAttribute('data-admin')
    }
  }, [router])

  const loadCounts = async () => {
    try {
      // Usa getUsers() que retorna todos os usuários
      const users = await api.getUsers()
      if (Array.isArray(users)) {
        const pending = users.filter(u => u.approval_status === 'pending')
        setPendingCount(pending.length)
      }

      const products = await api.getProducts()
      if (Array.isArray(products)) {
        const lowStock = products.filter(p => p.stock <= 10)
        setStockAlerts(lowStock.length)
      }
    } catch (error) {
      console.warn('Não foi possível carregar contadores:', error.message)
    }
  }

  const handleLogout = () => {
    api.logout()
    router.push('/login')
  }

  const getPageTitle = () => {
    const item = menuItems.find(m => m.href === pathname)
    return item?.label || 'Dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-gray-100 flex" style={{ backgroundColor: '#0f1419' }}>
      {/* Sidebar - Fixed em todas as resoluções */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-[#1a1f26] border-r border-[#2d3640] flex flex-col z-50 transform transition-transform duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#2d3640] flex items-center justify-center min-h-[80px]">
          <Image
            src="/images/LOGO DAHORTA 2.png"
            alt="Da Horta Distribuidor"
            width={180}
            height={60}
            className="object-contain drop-shadow-lg hover:scale-[1.02] transition-transform"
            priority
          />
        </div>

        {/* Navigation - Scroll independente, footer fica fixo embaixo */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-gray-400 hover:bg-[#242b33] hover:text-gray-100'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                    )}
                    
                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="font-medium flex-1">{item.label}</span>
                    
                    {/* Badges */}
                    {item.badgeType === 'pending' && pendingCount > 0 && (
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                    {item.badgeType === 'stock' && stockAlerts > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
                        {stockAlerts}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d3640] space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#242b33] hover:text-gray-100 transition-all group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🏠</span>
            <span className="font-medium">Voltar à Loja</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Com margem para compensar sidebar fixa */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] bg-[#0f1419]" style={{ backgroundColor: '#0f1419', minHeight: '100vh' }}>
        {/* Header */}
        <header className="h-16 bg-[#1a1f26] border-b border-[#2d3640] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg hover:bg-[#242b33] transition-colors flex items-center justify-center"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1.5">
                <span className="w-5 h-0.5 bg-gray-400 rounded-full"></span>
                <span className="w-5 h-0.5 bg-gray-400 rounded-full"></span>
                <span className="w-5 h-0.5 bg-gray-400 rounded-full"></span>
              </div>
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-gray-100">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-100">{user?.name || user?.company_name}</p>
              <p className="text-xs text-emerald-400">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-lg shadow-lg">
              👤
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-[#0f1419]" style={{ backgroundColor: '#0f1419' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="h-10 bg-[#1a1f26] border-t border-[#2d3640] flex items-center justify-center px-4">
          <p className="text-xs text-gray-500">
            © 2026 Da Horta Distribuidor • Painel Administrativo
          </p>
        </footer>
      </div>
    </div>
  )
}
