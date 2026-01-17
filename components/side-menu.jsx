"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { getCurrentUser, logout, isAdmin } from "@/lib/auth"

export function SideMenu({ isOpen, onClose }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Side Menu */}
      <nav 
        className={`fixed left-0 top-0 w-[300px] max-w-[85%] h-screen bg-white shadow-xl transition-transform duration-300 z-[100] flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Menu</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 px-6 py-4 mb-2 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 flex items-center justify-center text-2xl shadow">
              👤
            </div>
            <p className="font-semibold text-gray-900">
              {user ? user.name : 'Visitante'}
            </p>
          </div>

          {/* Menu List */}
          <ul className="space-y-1">
            <li>
              <Link 
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all"
              >
                🏠 Início
              </Link>
            </li>
            <li>
              <Link 
                href="/carrinho"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all"
              >
                🛒 Carrinho
              </Link>
            </li>
            
            {user && user.role === 'cliente' && (
              <li>
                <Link 
                  href="/cliente"
                  onClick={onClose}
                  className="flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all"
                >
                  📦 Meus Pedidos
                </Link>
              </li>
            )}

            {user && (user.role === 'admin' || user.role === 'consultor') && (
              <li>
                <Link 
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all"
                >
                  ⚙️ Administração
                </Link>
              </li>
            )}

            <li className="h-px bg-gray-200 mx-6 my-2" />

            {!user ? (
              <li>
                <Link 
                  href="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all"
                >
                  🔐 Entrar
                </Link>
              </li>
            ) : (
              <li>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:text-emerald-500 transition-all text-left"
                >
                  🚪 Sair
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  )
}
