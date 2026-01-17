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
  { id: "stock", href: "/admin/stock", icon: "🏬", label: "Estoque" },
  { id: "campaigns", href: "/admin/campaigns", icon: "🎯", label: "Campanhas" },
  { id: "orders", href: "/admin/orders", icon: "🛒", label: "Pedidos" },
  { id: "users", href: "/admin/users", icon: "👥", label: "Clientes" },
  { id: "approvals", href: "/admin/approvals", icon: "✅", label: "Aprovações" },
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

    // Carregar contadores
    loadCounts()
  }, [router])

  const loadCounts = async () => {
    try {
      // Carregar usuários pendentes
      const users = await api.getAllUsers()
      const pending = users.filter(u => u.approval_status === 'pending')
      setPendingCount(pending.length)

      // Carregar alertas de estoque
      const products = await api.getProducts()
      const lowStock = products.filter(p => p.stock <= 10)
      setStockAlerts(lowStock.length)
    } catch (error) {
      console.error('Erro ao carregar contadores:', error)
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
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#1a1f26] border-r border-[#2d3640] flex flex-col z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#2d3640] flex items-center justify-center">
          <Image
            src="/images/LOGO DAHORTA 2.png"
            alt="Da Horta"
            width={180}
            height={60}
            className="object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'text-gray-400 hover:bg-[#242b33] hover:text-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    
                    {/* Badges */}
                    {item.id === 'approvals' && pendingCount > 0 && (
                      <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                    {item.id === 'stock' && stockAlerts > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
        <div className="p-4 border-t border-[#2d3640] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#242b33] hover:text-gray-100 transition-all"
          >
            <span className="text-xl">🏠</span>
            <span className="font-medium">Voltar à Loja</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-[#1a1f26] border-b border-[#2d3640] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#242b33] transition-colors"
            >
              <div className="w-5 h-0.5 bg-gray-400 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-400 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-400"></div>
            </button>

            <h1 className="text-xl font-bold text-gray-100">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-100">{user?.name || user?.company_name}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">
              👤
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
