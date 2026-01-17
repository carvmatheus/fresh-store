"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BannerHeader } from "@/components/banner-header"
import { NavigationHeader } from "@/components/navigation-header"
import { SideMenu } from "@/components/side-menu"
import { CartSidebar } from "@/components/cart-sidebar"
import { CategoryIcons } from "@/components/category-icons"
import { PromotedCarousel } from "@/components/promoted-carousel"
import { ProductsGrid } from "@/components/products-grid"
import { api } from "@/lib/api-client"
import { getCurrentUser, isUserApproved, isUserPending, isUserSuspended, isAdmin } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estado
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      router.replace('/login')
      return
    }
    
    setUser(currentUser)
    
    // Verificar parâmetro de busca na URL
    const searchFromURL = searchParams.get('search')
    if (searchFromURL) {
      setSearchQuery(searchFromURL.toLowerCase().trim())
    }
    
    // Carregar produtos e carrinho
    loadProducts()
    loadCart()
  }, [router, searchParams])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const productsData = await api.getProducts()
      setProducts(productsData)
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCart = async () => {
    try {
      const user = getCurrentUser()
      if (!user) return
      
      const response = await api.getCart()
      if (response?.items) {
        setCart(response.items)
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar carrinho:', error)
      // Tentar carregar do localStorage
      const cartKey = `user_cart_${getCurrentUser()?.id}`
      const savedCart = localStorage.getItem(cartKey)
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }

  const saveCart = async (newCart) => {
    setCart(newCart)
    try {
      await api.saveCart(newCart)
      // Também salvar localmente
      const user = getCurrentUser()
      if (user) {
        localStorage.setItem(`user_cart_${user.id}`, JSON.stringify(newCart))
      }
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho:', error)
    }
  }

  // Animação fly-to-cart
  const flyToCart = useCallback((event, imageUrl) => {
    const cartBtn = document.querySelector('.cart-btn')
    if (!cartBtn) return

    // Pegar posição do clique ou do elemento
    let startX, startY
    if (event && event.clientX) {
      startX = event.clientX
      startY = event.clientY
    } else if (event && event.target) {
      const rect = event.target.getBoundingClientRect()
      startX = rect.left + rect.width / 2
      startY = rect.top + rect.height / 2
    } else {
      return
    }

    // Posição do carrinho
    const cartRect = cartBtn.getBoundingClientRect()
    const endX = cartRect.left + cartRect.width / 2
    const endY = cartRect.top + cartRect.height / 2

    // Criar elemento que vai voar
    const flyingItem = document.createElement('div')
    flyingItem.className = 'flying-item'
    
    if (imageUrl) {
      const img = document.createElement('img')
      img.src = imageUrl
      img.alt = ''
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;'
      flyingItem.appendChild(img)
    } else {
      flyingItem.textContent = '🛒'
    }

    flyingItem.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 9999;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transform: translate(-50%, -50%) scale(1);
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      overflow: hidden;
    `

    document.body.appendChild(flyingItem)

    // Animar para o carrinho
    requestAnimationFrame(() => {
      flyingItem.style.left = `${endX}px`
      flyingItem.style.top = `${endY}px`
      flyingItem.style.transform = 'translate(-50%, -50%) scale(0.2)'
      flyingItem.style.opacity = '0.5'
    })

    // Efeitos no carrinho após animação
    setTimeout(() => {
      // Shake no botão do carrinho
      cartBtn.classList.add('animate-cart-shake')
      setTimeout(() => cartBtn.classList.remove('animate-cart-shake'), 500)
      
      // Badge fica vermelho e pulsa
      const badge = document.getElementById('cartBadge')
      if (badge) {
        badge.classList.add('animate-success-pulse')
        badge.style.transform = 'scale(1.5)'
        badge.style.background = '#ef4444'
        badge.style.color = 'white'
        
        setTimeout(() => {
          badge.style.transform = 'scale(1)'
          badge.style.background = ''
          badge.style.color = ''
          badge.classList.remove('animate-success-pulse')
        }, 400)
      }
    }, 500)

    // Remover elemento voador após animação
    setTimeout(() => {
      flyingItem.remove()
    }, 600)
  }, [])

  // Adicionar ao carrinho
  const addToCart = useCallback((productId, event) => {
    const product = products.find(p => String(p.id) === String(productId))
    if (!product) return

    // Animação fly-to-cart
    if (event) {
      flyToCart(event, product.image)
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => String(item.id) === String(productId))
      let newCart

      if (existingItem) {
        newCart = prevCart.map(item => 
          String(item.id) === String(productId)
            ? { ...item, quantity: item.quantity + (product.minOrder || 1) }
            : item
        )
      } else {
        newCart = [...prevCart, { ...product, quantity: product.minOrder || 1 }]
      }

      // Salvar carrinho
      saveCart(newCart)
      
      return newCart
    })

    // Feedback visual
    showToast(`${product.name} adicionado!`)
  }, [products, flyToCart])

  // Atualizar quantidade (delta ou absoluto)
  const updateQuantity = useCallback((productId, deltaOrAbsolute, isAbsolute = false) => {
    setCart(prevCart => {
      const item = prevCart.find(i => String(i.id) === String(productId))
      if (!item) return prevCart

      const minOrder = item.minOrder || 1
      // Se isAbsolute, usa o valor diretamente; senão, soma ao atual
      const newQty = isAbsolute ? deltaOrAbsolute : item.quantity + deltaOrAbsolute

      if (newQty < minOrder) {
        // Remover item
        const newCart = prevCart.filter(i => String(i.id) !== String(productId))
        saveCart(newCart)
        return newCart
      }

      if (newQty > item.stock) {
        showToast('Estoque insuficiente', '❌')
        return prevCart
      }

      const newCart = prevCart.map(i => 
        String(i.id) === String(productId)
          ? { ...i, quantity: newQty }
          : i
      )
      saveCart(newCart)
      return newCart
    })
  }, [])

  // Remover do carrinho
  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => String(item.id) !== String(productId))
      saveCart(newCart)
      return newCart
    })
  }, [])

  // Toast notification
  const showToast = (message, icon = '🛒') => {
    const existingToast = document.querySelector('.toast-notification')
    if (existingToast) existingToast.remove()

    const toast = document.createElement('div')
    toast.className = 'toast-notification'
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`
    document.body.appendChild(toast)

    requestAnimationFrame(() => toast.classList.add('show'))

    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 400)
    }, 2500)
  }

  // Filtrar produtos
  const getFilteredProducts = () => {
    let filtered = products

    // Se há busca ativa
    if (searchQuery) {
      filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery) ||
        p.category?.toLowerCase().includes(searchQuery)
      )
    } else {
      // Filtrar por categoria
      if (selectedCategory && selectedCategory !== 'all') {
        if (selectedCategory === 'ofertas') {
          filtered = products.filter(p => p.isPromo === true)
        } else {
          filtered = products.filter(p => 
            p.category?.toLowerCase() === selectedCategory.toLowerCase()
          )
        }
      }
    }

    return filtered
  }

  // Handlers
  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase().trim())
    if (query) {
      setSelectedCategory('all')
    }
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
  }

  // Calcular total do carrinho
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Verificar status do usuário
  const isPending = user && isUserPending()
  const isSuspended = user && isUserSuspended()
  const canViewCatalog = user && (isAdmin() || user.role === 'consultor' || isUserApproved())

  // Se usuário está pendente ou suspenso, mostrar mensagem
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BannerHeader />
        <NavigationHeader 
          onMenuToggle={() => setMenuOpen(true)}
          onCartToggle={() => {}}
          cartCount={0}
        />
        <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        
        <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-12 max-w-lg w-full text-center shadow-xl border border-gray-200">
            <div className="text-6xl mb-6 animate-pulse-slow">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cadastro Pendente de Aprovação</h2>
            <p className="text-gray-600 mb-8">Olá! Seu cadastro foi recebido e está sendo analisado pela nossa equipe.</p>
            
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-4 bg-gray-100 p-4 rounded-xl">
                <span className="text-2xl">📋</span>
                <div>
                  <strong className="block text-gray-800">Status</strong>
                  <p className="text-gray-600 text-sm">Aguardando aprovação</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-gray-100 p-4 rounded-xl">
                <span className="text-2xl">⏰</span>
                <div>
                  <strong className="block text-gray-800">Prazo</strong>
                  <p className="text-gray-600 text-sm">Geralmente em até 24h úteis</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-gray-100 p-4 rounded-xl">
                <span className="text-2xl">📧</span>
                <div>
                  <strong className="block text-gray-800">Notificação</strong>
                  <p className="text-gray-600 text-sm">Você será notificado por e-mail</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Dúvidas? Entre em contato: <a href="mailto:contato@dahorta.com.br" className="text-emerald-500 font-semibold">contato@dahorta.com.br</a>
            </p>
            
            <button 
              onClick={() => {
                api.logout()
                router.push('/login')
              }}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              🚪 Sair
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BannerHeader />
        <NavigationHeader 
          onMenuToggle={() => setMenuOpen(true)}
          onCartToggle={() => {}}
          cartCount={0}
        />
        <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        
        <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-12 max-w-lg w-full text-center shadow-xl border border-gray-200">
            <div className="text-6xl mb-6 animate-pulse-slow">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta Suspensa</h2>
            <p className="text-gray-600 mb-8">Sua conta foi temporariamente suspensa.</p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <p className="text-red-800 mb-4">Entre em contato com nossa equipe para mais informações:</p>
              <a 
                href="mailto:contato@dahorta.com.br" 
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                📧 Falar com Suporte
              </a>
            </div>
            
            <button 
              onClick={() => {
                api.logout()
                router.push('/login')
              }}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              🚪 Sair
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BannerHeader />
      <NavigationHeader 
        onMenuToggle={() => setMenuOpen(true)}
        onCartToggle={() => setCartOpen(true)}
        cartCount={cartCount}
        onSearch={handleSearch}
      />
      
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <CartSidebar 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        showToast={showToast}
      />

      <main className="max-w-7xl mx-auto">
        {/* Produtos em Destaque */}
        <section className="py-4">
          <PromotedCarousel products={products} onAddToCart={addToCart} />
        </section>

        {/* Categorias */}
        <section className="py-2 border-y border-gray-100 bg-white/50">
          <CategoryIcons 
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </section>

        {/* Título da seção de produtos */}
        <section className="px-4 pt-6 pb-2">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedCategory === 'all' ? '📦 Todos os Produtos' : 
             selectedCategory === 'ofertas' ? '🔥 Ofertas Especiais' :
             `📦 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {getFilteredProducts().length} produto{getFilteredProducts().length !== 1 ? 's' : ''} encontrado{getFilteredProducts().length !== 1 ? 's' : ''}
          </p>
        </section>

        {/* Grid de Produtos */}
        <section className="pb-8">
          <ProductsGrid 
            products={getFilteredProducts()}
            onAddToCart={addToCart}
            loading={loading}
          />
        </section>
      </main>
    </div>
  )
}
