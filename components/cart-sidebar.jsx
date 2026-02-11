"use client"

import { useState, useEffect } from "react"
import { X, Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

// Obter preço efetivo (promocional ou normal)
function getEffectivePrice(item) {
  return (item.isPromo && item.promoPrice) ? item.promoPrice : item.price
}

// Componente de item do carrinho com estado local para edição de quantidade
function CartItem({ item, onUpdateQuantity, onRemoveItem, isWarned = false }) {
  const [inputValue, setInputValue] = useState(String(item.quantity))
  const [isFocused, setIsFocused] = useState(false)
  const effectivePrice = getEffectivePrice(item)
  const hasPromo = item.isPromo && item.promoPrice
  const minOrder = item.minOrder || 1

  // Sincronizar input quando quantity muda externamente (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(String(item.quantity))
    }
  }, [item.quantity, isFocused])

  const handleInputChange = (e) => {
    // Permitir números e ponto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setInputValue(value)
  }

  const handleInputBlur = () => {
    // Ao sair do input, aplicar a mudança usando valor absoluto
    const newQty = parseFloat(inputValue) || minOrder
    const finalQty = Math.max(minOrder, newQty)
    setInputValue(String(finalQty))
    
    // Usa o terceiro parâmetro (isAbsolute = true) para setar quantidade direta
    onUpdateQuantity(item.id, finalQty, true)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <div 
      className={`flex gap-4 p-4 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isWarned 
          ? 'border-red-400 bg-gradient-to-br from-red-50 to-white animate-pulse' 
          : hasPromo 
            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white' 
            : 'border-gray-100 hover:border-emerald-300'
      }`}
    >
      <div className="w-[70px] h-[70px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={item.image || '/placeholder.jpg'}
          alt={item.name}
          width={70}
          height={70}
          className="w-full h-full object-cover object-right-bottom"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="font-semibold text-gray-800 text-sm">
            {item.name}
            {hasPromo && (
              <span className="inline-block bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2">
                🔥 Promo
              </span>
            )}
          </span>
          <div className="mt-1">
            {hasPromo && (
              <span className="text-xs text-gray-400 line-through block">
                {formatCurrency(item.price * item.quantity)}
              </span>
            )}
            <span className={`font-bold ${hasPromo ? 'text-emerald-500' : 'text-gray-800'}`}>
              {formatCurrency(effectivePrice * item.quantity)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onUpdateQuantity(item.id, -minOrder)}
              className="w-7 h-7 rounded-full bg-white text-gray-700 font-semibold flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
            >
              −
            </button>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => {
                setIsFocused(false)
                handleInputBlur()
              }}
              onKeyPress={handleKeyPress}
              onFocus={(e) => {
                setIsFocused(true)
                e.target.select()
              }}
              className="w-12 text-center font-semibold text-sm border border-gray-200 rounded-md py-1 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => onUpdateQuantity(item.id, minOrder)}
              className="w-7 h-7 rounded-full bg-white text-gray-700 font-semibold flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
            >
              +
            </button>
          </div>
          <button 
            onClick={() => onRemoveItem(item.id)}
            className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all p-1"
            title="Remover"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export function CartSidebar({ 
  isOpen, 
  onClose, 
  cart = [], 
  onUpdateQuantity, 
  onRemoveItem,
  showToast
}) {
  // Estado para rastrear itens que já foram avisados sobre quantidade mínima
  const [warnedItems, setWarnedItems] = useState({})
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = cart.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0)
  
  // Handler para atualização com lógica de aviso/remoção
  const handleUpdateWithWarning = (itemId, newQty, isAbsolute) => {
    const item = cart.find(i => String(i.id) === String(itemId))
    if (!item) return
    
    const minOrder = item.minOrder || 1
    const effectiveQty = isAbsolute ? newQty : item.quantity + newQty
    
    // Se a quantidade resultante for menor que o mínimo
    if (effectiveQty < minOrder) {
      if (warnedItems[itemId]) {
        // Segunda vez: remover do carrinho
        onRemoveItem(itemId)
        setWarnedItems(prev => {
          const newState = { ...prev }
          delete newState[itemId]
          return newState
        })
        if (showToast) showToast(`${item.name} removido do carrinho`, '🗑️')
      } else {
        // Primeira vez: avisar sobre o mínimo
        setWarnedItems(prev => ({ ...prev, [itemId]: true }))
        if (showToast) showToast(`Quantidade mínima: ${minOrder} ${item.unit || 'un'}. Diminua novamente para remover.`, '⚠️')
      }
      return
    }
    
    // Limpar aviso se voltou para quantidade válida
    if (warnedItems[itemId]) {
      setWarnedItems(prev => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })
    }
    
    // Atualizar normalmente
    onUpdateQuantity(itemId, newQty, isAbsolute)
  }

  return (
    <>
      {/* Cart Sidebar */}
      <aside 
        className={`fixed right-0 top-0 w-[420px] max-w-full h-screen bg-gradient-to-b from-white to-gray-50 shadow-xl transition-all duration-400 z-[1000] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.15)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <div>
              <h3 className="text-xl font-bold">Meu Carrinho</h3>
              <span className="text-sm opacity-90">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full border-2 border-white/30 bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20 hover:rotate-90"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="text-6xl mb-4 opacity-30">🛒</div>
              <h4 className="text-xl text-gray-700 mb-2">Seu carrinho está vazio</h4>
              <p className="text-gray-500 text-sm mb-6">Explore nossos produtos e adicione ao carrinho</p>
              <button 
                onClick={onClose}
                className="bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-all hover:-translate-y-0.5"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <CartItem 
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateWithWarning}
                  onRemoveItem={onRemoveItem}
                  isWarned={!!warnedItems[item.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="mb-4">
              <div className="flex justify-between py-2 text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between py-3 text-xl font-bold text-gray-900 border-t-2 border-dashed border-gray-200 mt-2">
                <span>Total</span>
                <span className="text-emerald-500">{formatCurrency(totalValue)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link 
                href="/carrinho"
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-3.5 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold transition-all hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50"
              >
                <span>📋</span> Ver Carrinho
              </Link>
              <Link 
                href="/carrinho#checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span>💳</span> Finalizar Pedido
              </Link>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">🔒 Pagamento 100% seguro</p>
          </div>
        )}
      </aside>

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
