"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { BannerHeader } from "@/components/banner-header"
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

// Obter preço efetivo
function getEffectivePrice(item) {
  return (item.isPromo && item.promoPrice) ? item.promoPrice : item.price
}

// Componente de input de quantidade com estado local para edição livre
function QuantityInput({ item, onValidate }) {
  const [inputValue, setInputValue] = useState(String(item.quantity))
  const [isFocused, setIsFocused] = useState(false)
  const minOrder = item.minOrder || 1

  // Sincronizar quando quantity muda externamente (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(String(item.quantity))
    }
  }, [item.quantity, isFocused])

  const handleChange = (e) => {
    // Permitir números e ponto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setInputValue(value)
  }

  const handleBlur = () => {
    setIsFocused(false)
    const newQty = parseFloat(inputValue) || minOrder
    onValidate(item.id, newQty)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*\.?[0-9]*"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      onFocus={(e) => {
        setIsFocused(true)
        e.target.select()
      }}
      className="w-14 text-center font-semibold border border-gray-200 rounded-lg py-1 focus:outline-none focus:border-emerald-500"
    />
  )
}

export default function CarrinhoPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cep, setCep] = useState('')
  const [shippingCalculated, setShippingCalculated] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [checkoutForm, setCheckoutForm] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

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
    
    loadCart()
  }, [router])

  const loadCart = async () => {
    try {
      setLoading(true)
      const response = await api.getCart()
      if (response?.items) {
        setCart(response.items)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar carrinho:', error)
      // Tentar localStorage
      const user = getCurrentUser()
      if (user) {
        const saved = localStorage.getItem(`user_cart_${user.id}`)
        if (saved) setCart(JSON.parse(saved))
      }
    } finally {
      setLoading(false)
    }
  }

  const saveCart = async (newCart) => {
    setCart(newCart)
    try {
      await api.saveCart(newCart)
      const user = getCurrentUser()
      if (user) {
        localStorage.setItem(`user_cart_${user.id}`, JSON.stringify(newCart))
      }
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho:', error)
    }
  }

  // Atualizar quantidade
  const updateQuantity = useCallback((productId, delta) => {
    setCart(prevCart => {
      const item = prevCart.find(i => String(i.id) === String(productId))
      if (!item) return prevCart

      const minOrder = item.minOrder || 1
      const newQty = item.quantity + delta

      if (newQty < minOrder) {
        // Verificar se é segundo clique
        if (pendingRemoval[productId]) {
          const newPending = { ...pendingRemoval }
          delete newPending[productId]
          setPendingRemoval(newPending)
          
          const newCart = prevCart.filter(i => String(i.id) !== String(productId))
          saveCart(newCart)
          showToast('Produto removido', '🗑️')
          return newCart
        }
        
        // Primeiro clique - marcar pendente
        setPendingRemoval(prev => ({ ...prev, [productId]: true }))
        showToast(`Mínimo: ${minOrder} ${item.unit}. Clique novamente para remover.`, '⚠️')
        
        setTimeout(() => {
          setPendingRemoval(prev => {
            const newP = { ...prev }
            delete newP[productId]
            return newP
          })
        }, 3000)
        
        return prevCart
      }

      if (newQty > item.stock) {
        showToast('Estoque insuficiente', '❌')
        return prevCart
      }

      // Limpar pendente
      if (pendingRemoval[productId]) {
        setPendingRemoval(prev => {
          const newP = { ...prev }
          delete newP[productId]
          return newP
        })
      }

      const newCart = prevCart.map(i => 
        String(i.id) === String(productId) ? { ...i, quantity: newQty } : i
      )
      saveCart(newCart)
      return newCart
    })
  }, [pendingRemoval])

  // Remover item
  const removeItem = useCallback((productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => String(item.id) !== String(productId))
      saveCart(newCart)
      showToast('Produto removido', '🗑️')
      return newCart
    })
  }, [])

  // Limpar carrinho
  const clearCart = async () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      setCart([])
      await saveCart([])
      showToast('Carrinho limpo', '🗑️')
    }
  }

  // Calcular frete
  const calculateShipping = () => {
    if (!cep || cep.length < 8) {
      alert('Digite um CEP válido')
      return
    }
    setShippingCalculated(true)
    showToast('Frete calculado!', '🚚')
  }

  // Toast
  const showToast = (message, icon = '✓') => {
    const existing = document.querySelector('.toast-notification')
    if (existing) existing.remove()

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

  // Abrir checkout e pré-preencher dados do usuário
  const openCheckout = () => {
    const user = getCurrentUser()
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipcode: user.cep || cep.replace('-', '') || ''
      }))
    }
    setShowCheckout(true)
  }

  // Enviar pedido
  const handleCheckout = async (e) => {
    e.preventDefault()

    // Validar campos obrigatórios
    const required = ['street', 'number', 'neighborhood', 'city', 'state', 'zipcode', 'name', 'email', 'phone']
    const missing = required.filter(f => !checkoutForm[f]?.trim())
    if (missing.length > 0) {
      showToast('Preencha todos os campos obrigatórios', '⚠️')
      return
    }

    setSubmitting(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: String(item.id),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'un',
          price: getEffectivePrice(item),
          image: item.image || null
        })),
        shipping_address: {
          street: checkoutForm.street,
          number: checkoutForm.number,
          complement: checkoutForm.complement || null,
          neighborhood: checkoutForm.neighborhood,
          city: checkoutForm.city,
          state: checkoutForm.state,
          zipcode: checkoutForm.zipcode.replace(/\D/g, '')
        },
        contact_info: {
          name: checkoutForm.name,
          email: checkoutForm.email,
          phone: checkoutForm.phone
        },
        delivery_fee: shippingCalculated ? 15 : 0,
        notes: checkoutForm.notes || undefined
      }

      const order = await api.createOrder(orderData)

      // Limpar carrinho
      setCart([])
      await api.clearCart().catch(() => {})
      const user = getCurrentUser()
      if (user) localStorage.removeItem(`user_cart_${user.id}`)

      setOrderSuccess(order)
      setShowCheckout(false)
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      showToast(error.message || 'Erro ao criar pedido', '❌')
    } finally {
      setSubmitting(false)
    }
  }

  // Formatar CEP
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5, 8)
    }
    setCep(value)
  }

  // Validar quantidade digitada
  const validateQuantityInput = (productId, newQuantity) => {
    const item = cart.find(i => String(i.id) === String(productId))
    if (!item) return

    let newQty = newQuantity
    
    if (newQty < (item.minOrder || 1)) {
      showToast(`Quantidade mínima: ${item.minOrder || 1} ${item.unit}`, '⚠️')
      newQty = item.minOrder || 1
    }
    
    if (newQty > item.stock) {
      showToast(`Estoque insuficiente. Máximo: ${item.stock}`, '❌')
      newQty = item.stock
    }

    // Só atualiza se realmente mudou
    if (newQty === item.quantity) return

    const newCart = cart.map(i => 
      String(i.id) === String(productId) ? { ...i, quantity: newQty } : i
    )
    saveCart(newCart)
    setCart(newCart)
  }

  // Calcular totais
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0)
  const originalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalSavings = originalTotal - subtotal

  // Filtrar itens pela busca
  const filteredCart = searchQuery 
    ? cart.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : cart

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <BannerHeader />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          {!searchMode ? (
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMenuOpen(true)}
                  className="flex flex-col gap-[5px] p-2 rounded-md hover:bg-gray-100"
                >
                  <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
                  <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
                  <span className="block w-6 h-[3px] bg-gray-900 rounded"></span>
                </button>
                <Link 
                  href="/"
                  className="bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-emerald-600 transition-all text-sm"
                >
                  ← Continuar Comprando
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSearchMode(true)}
                  className="w-11 h-11 rounded-lg border-2 border-gray-200 bg-white flex items-center justify-center hover:border-emerald-500"
                >
                  🔍
                </button>
                <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2">
                  🛒 Carrinho
                  <span className="bg-white text-emerald-500 px-2 py-0.5 rounded-full text-sm font-bold">
                    {totalItems}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setSearchMode(false); setSearchQuery(''); }}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200"
              >
                ← Voltar
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar itens do carrinho..."
                  autoFocus
                  className="w-full py-2.5 px-4 pr-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2 text-emerald-500 font-medium">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">1</span>
            <span>Carrinho</span>
          </div>
          <div className="w-16 h-[3px] bg-gray-200 mx-4"></div>
          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm">2</span>
            <span>Dados</span>
          </div>
          <div className="w-16 h-[3px] bg-gray-200 mx-4"></div>
          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm">3</span>
            <span>Pagamento</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🛒 Meu Carrinho</h1>
          <p className="text-gray-500">Revise seus produtos antes de continuar</p>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <div className="text-6xl opacity-30 mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Explore nossos produtos frescos e adicione ao carrinho</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-all"
            >
              🥬 Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Items Section */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  📦 Itens do Pedido
                  <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                    {totalItems}
                  </span>
                </h2>
                <button 
                  onClick={clearCart}
                  className="text-gray-500 hover:text-red-500 text-sm flex items-center gap-1"
                >
                  🗑️ Limpar
                </button>
              </div>

              <div className="divide-y divide-gray-100 p-4 space-y-4">
                {filteredCart.map((item) => {
                  const effectivePrice = getEffectivePrice(item)
                  const hasPromo = item.isPromo && item.promoPrice
                  const discountPercent = hasPromo ? Math.round((1 - item.promoPrice / item.price) * 100) : 0

                  return (
                    <div 
                      key={item.id}
                      className={`flex gap-4 p-4 rounded-2xl transition-colors ${
                        hasPromo 
                          ? 'bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 shadow-sm' 
                          : 'bg-gray-50 hover:bg-emerald-50/30'
                      }`}
                    >
                      {/* Imagem com badge de desconto */}
                      <div className="relative flex-shrink-0">
                        {hasPromo && (
                          <div className="absolute top-1 left-1 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-md">
                            -{discountPercent}%
                          </div>
                        )}
                        <div className="w-[100px] h-[100px] rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={item.image || '/placeholder.jpg'}
                            alt={item.name}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover object-right-bottom"
                          />
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Nome e preço unitário */}
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                            {item.name}
                            {hasPromo && (
                              <span className="inline-block bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                                🔥 Promo
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {hasPromo && (
                              <>
                                <s className="text-gray-400">{formatCurrency(item.price)}</s>{' '}
                              </>
                            )}
                            <span className={hasPromo ? 'text-emerald-500 font-semibold' : ''}>
                              {formatCurrency(effectivePrice)}
                            </span>
                            {' / '}{item.unit}
                          </div>
                        </div>

                        {/* Controles de quantidade */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 w-fit mt-3">
                          <button
                            onClick={() => updateQuantity(item.id, -(item.minOrder || 1))}
                            className="w-8 h-8 rounded-full bg-white text-gray-700 font-semibold flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          >
                            −
                          </button>
                          <QuantityInput
                            item={item}
                            onValidate={validateQuantityInput}
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.minOrder || 1)}
                            className="w-8 h-8 rounded-full bg-white text-gray-700 font-semibold flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Coluna direita: lixeira e preço total */}
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all p-1 text-xl"
                        >
                          🗑️
                        </button>
                        
                        <div className="text-right">
                          {hasPromo && (
                            <div className="text-sm text-gray-400 line-through">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          )}
                          <div className={`text-xl font-bold ${hasPromo ? 'text-emerald-500' : 'text-gray-800'}`}>
                            {formatCurrency(effectivePrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden sticky top-20">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4">
                <h2 className="text-lg font-bold flex items-center gap-2">📋 Resumo do Pedido</h2>
              </div>

              <div className="p-6">
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Frete</span>
                  <span className={shippingCalculated ? 'text-emerald-500' : ''}>
                    {shippingCalculated ? 'R$ 15,00' : 'Calcular'}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 p-3 rounded-lg text-center my-2 font-semibold">
                    🎉 Você economiza: <strong className="text-green-700">{formatCurrency(totalSavings)}</strong>
                  </div>
                )}

                <div className="flex justify-between py-4 text-xl font-bold text-gray-900 border-t-2 border-dashed border-gray-200 mt-2">
                  <span>Total</span>
                  <span className="text-emerald-500">{formatCurrency(subtotal + (shippingCalculated ? 15 : 0))}</span>
                </div>

                {/* Calcular Frete */}
                <div className="bg-emerald-50 rounded-xl p-4 mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🚚 Calcular Frete
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={calculateShipping}
                      className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all"
                    >
                      OK
                    </button>
                  </div>
                </div>

                {/* Cupom */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cupom de desconto"
                      className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button className="px-4 py-2.5 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                      Aplicar
                    </button>
                  </div>
                </div>

                <button
                  onClick={openCheckout}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  💳 Finalizar Compra
                </button>

                <Link 
                  href="/"
                  className="block text-center mt-4 text-gray-500 text-sm hover:text-emerald-500 transition-colors"
                >
                  ← Continuar comprando
                </Link>

                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">🔒 Seguro</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">✓ Verificado</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">🚚 Entrega Rápida</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">🚚</div>
            <div className="font-semibold text-gray-800 text-sm">Entrega Rápida</div>
            <div className="text-xs text-gray-500">Produtos frescos na sua porta</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">🔒</div>
            <div className="font-semibold text-gray-800 text-sm">Pagamento Seguro</div>
            <div className="text-xs text-gray-500">Seus dados protegidos</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">💬</div>
            <div className="font-semibold text-gray-800 text-sm">Suporte</div>
            <div className="text-xs text-gray-500">Atendimento dedicado</div>
          </div>
        </div>
      </main>

      {/* Tela de Sucesso */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Realizado!</h2>
            <p className="text-gray-600 mb-1">
              Número do pedido: <strong className="text-emerald-600">{orderSuccess.order_number}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Total: <strong>{formatCurrency(orderSuccess.total)}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="py-3 px-6 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl my-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold">📋 Dados do Pedido</h2>
              <button onClick={() => setShowCheckout(false)} className="text-white/80 hover:text-white text-2xl">✕</button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Contato */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">👤 Contato</h3>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Nome completo *"
                    value={checkoutForm.name}
                    onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="E-mail *"
                      value={checkoutForm.email}
                      onChange={e => setCheckoutForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Telefone *"
                      value={checkoutForm.phone}
                      onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📍 Endereço de Entrega</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <input
                      type="text"
                      placeholder="Rua / Avenida *"
                      value={checkoutForm.street}
                      onChange={e => setCheckoutForm(f => ({ ...f, street: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nº *"
                      value={checkoutForm.number}
                      onChange={e => setCheckoutForm(f => ({ ...f, number: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Complemento"
                      value={checkoutForm.complement}
                      onChange={e => setCheckoutForm(f => ({ ...f, complement: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Bairro *"
                      value={checkoutForm.neighborhood}
                      onChange={e => setCheckoutForm(f => ({ ...f, neighborhood: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_80px_120px] gap-3">
                    <input
                      type="text"
                      placeholder="Cidade *"
                      value={checkoutForm.city}
                      onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="UF *"
                      maxLength={2}
                      value={checkoutForm.state}
                      onChange={e => setCheckoutForm(f => ({ ...f, state: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="CEP *"
                      maxLength={9}
                      value={checkoutForm.zipcode}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '')
                        if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8)
                        setCheckoutForm(f => ({ ...f, zipcode: v }))
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📝 Observações</h3>
                <textarea
                  placeholder="Informações adicionais sobre o pedido (opcional)"
                  value={checkoutForm.notes}
                  onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Resumo */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{cart.length} produto(s)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Frete</span>
                  <span>{shippingCalculated ? 'R$ 15,00' : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span className="text-emerald-500">{formatCurrency(subtotal + (shippingCalculated ? 15 : 0))}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>⏳ Enviando pedido...</>
                ) : (
                  <>✅ Confirmar Pedido</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
