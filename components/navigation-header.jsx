"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, ShoppingCart, User, X } from "lucide-react"
import Link from "next/link"
import { getCurrentUser, logout, isAdmin } from "@/lib/auth"

export function NavigationHeader({ 
  onMenuToggle, 
  onCartToggle, 
  cartCount = 0,
  onSearch
}) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleLoginClick = () => {
    if (user) {
      if (isAdmin()) {
        router.push('/admin')
      } else {
        router.push('/cliente')
      }
    } else {
      router.push('/login')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu */}
            <button 
              onClick={onMenuToggle}
              className="flex flex-col gap-[5px] p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
              <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
              <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
            </button>

            {/* Login Button */}
            <button 
              onClick={handleLoginClick}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 px-4 py-2 rounded-lg font-semibold transition-all hover:border-emerald-500 hover:text-emerald-500 hover:bg-gray-50 whitespace-nowrap text-gray-700"
            >
              <span className="text-xl">👤</span>
              <span className="hidden md:inline text-sm">
                {user ? user.name?.split(' ')[0] : 'Entrar'}
              </span>
            </button>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-[600px]">
            {/* Search */}
            <div className="relative flex-1 max-w-[400px]">
              <input 
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Buscar produtos..."
                className="w-full py-2.5 px-4 pr-10 border-2 border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                🔍
              </span>
            </div>

            {/* Cart Button */}
            <button 
              onClick={onCartToggle}
              className="cart-btn relative bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
            >
              🛒 <span className="hidden sm:inline">Carrinho</span>
              <span 
                id="cartBadge"
                className="cart-badge bg-white text-emerald-500 px-2 py-0.5 rounded-full text-sm font-bold min-w-[1.5rem] text-center transition-all duration-300"
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
