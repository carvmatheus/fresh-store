"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { getCategoryName } from "./category-icons"

// Formatar número
function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0,00'
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function PromotedCarousel({ products, onAddToCart }) {
  const carouselRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Filtrar apenas produtos em promoção
  const promotedProducts = products
    .filter(p => p.isPromo === true)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

  // Auto-scroll a cada 3 segundos
  useEffect(() => {
    if (promotedProducts.length === 0) return

    const interval = setInterval(() => {
      moveCarousel(1)
    }, 4000)

    return () => clearInterval(interval)
  }, [promotedProducts.length])

  const moveCarousel = (direction) => {
    const carousel = carouselRef.current
    if (!carousel || isAnimating) return

    const cards = carousel.querySelectorAll('.promo-card')
    if (cards.length === 0) return

    const cardWidth = cards[0].offsetWidth + 24
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const itemsToScroll = isMobile ? 2 : 3
    const moveAmount = cardWidth * itemsToScroll
    const currentScroll = carousel.scrollLeft
    const maxScroll = carousel.scrollWidth - carousel.clientWidth

    let newScroll

    if (direction > 0) {
      newScroll = currentScroll + moveAmount
      if (newScroll > maxScroll) {
        if (currentScroll >= maxScroll - 10) {
          newScroll = 0
        } else {
          newScroll = maxScroll
        }
      }
    } else {
      newScroll = currentScroll - moveAmount
      if (newScroll < 0) newScroll = 0
    }

    smoothScrollTo(carousel, newScroll, 1200)
  }

  const smoothScrollTo = (element, targetPosition, duration) => {
    setIsAnimating(true)
    const startPosition = element.scrollLeft
    const distance = targetPosition - startPosition
    let startTime = null

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)

      const easeInOut = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      element.scrollLeft = startPosition + (distance * easeInOut)

      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animation)
  }

  if (promotedProducts.length === 0) return null

  return (
    <div className="overflow-hidden px-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            🔥 Produtos em Destaque
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{promotedProducts.length} ofertas especiais</p>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => moveCarousel(-1)}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 flex items-center justify-center text-sm hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
          >
            ❮
          </button>
          <button 
            onClick={() => moveCarousel(1)}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 flex items-center justify-center text-sm hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
          >
            ❯
          </button>
        </div>
      </div>

      <div 
        ref={carouselRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide rounded-xl"
      >
        <div className="flex flex-nowrap gap-3 pb-2">
          {promotedProducts.map((product) => {
            const originalPrice = formatNumber(product.price)
            const promoPrice = product.promoPrice ? formatNumber(product.promoPrice) : formatNumber(product.price * 0.9)
            const discountPercent = product.promoPrice 
              ? Math.round((1 - product.promoPrice / product.price) * 100) 
              : 10

            return (
              <div 
                key={product.id}
                className="promo-card bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 relative cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-emerald-400 flex-shrink-0"
                style={{ width: 'calc(25% - 12px)', minWidth: '240px' }}
                onClick={(e) => onAddToCart(product.id, e)}
                title="Clique para adicionar ao carrinho"
              >
                {/* Badge de Oferta */}
                <div 
                  className="promo-badge absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white text-xs font-bold uppercase z-[5] animate-pulse-badge"
                  style={{ 
                    background: 'linear-gradient(135deg, #EC1841, #c41235)',
                    boxShadow: '0 2px 8px rgba(236, 24, 65, 0.4)'
                  }}
                >
                  🔥 -{discountPercent}%
                </div>

                {/* Imagem maior */}
                <div className="w-full aspect-square relative bg-gray-50">
                  <Image
                    src={product.image || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover object-right-bottom"
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1 mb-2">{product.name}</h3>
                  
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-sm text-gray-400 line-through">R$ {originalPrice}</span>
                    <span className="text-xl font-bold text-emerald-600">R$ {promoPrice}</span>
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToCart(product.id, e)
                    }}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white text-sm bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    🛒 Adicionar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
