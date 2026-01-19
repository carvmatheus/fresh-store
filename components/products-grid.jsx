"use client"

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

export function ProductsGrid({ products, onAddToCart, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-4 mb-12">
        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-md">
          <span className="text-5xl mb-4">⏳</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Carregando produtos...</h3>
          <p className="text-gray-600">Aguarde enquanto buscamos os produtos disponíveis.</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-4 mb-12">
        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-md">
          <span className="text-5xl mb-4 opacity-60">🔍</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600 text-lg">Tente ajustar os filtros ou busca.</p>
        </div>
      </div>
    )
  }

  // Ordenar produtos em ordem alfabética
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 px-4 pb-8">
      {sortedProducts.map((product) => {
        const hasPromo = product.isPromo && product.promoPrice
        const displayPrice = hasPromo ? product.promoPrice : product.price
        const discountPercent = hasPromo ? Math.round((1 - product.promoPrice / product.price) * 100) : 0
        const isAvailable = product.stock > 0

        return (
          <div 
            key={product.id}
            className={`relative bg-white rounded-xl overflow-hidden shadow-sm border transition-all flex flex-col ${
              !isAvailable 
                ? 'border-gray-200 opacity-70 cursor-not-allowed' 
                : hasPromo 
                  ? 'border-emerald-400 hover:border-emerald-500 cursor-pointer hover:-translate-y-1 hover:shadow-md' 
                  : 'border-gray-200 hover:border-emerald-400 cursor-pointer hover:-translate-y-1 hover:shadow-md'
            }`}
            onClick={(e) => isAvailable && onAddToCart(product.id, e)}
            title={isAvailable ? "Clique para adicionar ao carrinho" : "Produto indisponível"}
          >
            {/* Badge de Oferta */}
            {hasPromo && isAvailable && (
              <div 
                className="promo-badge absolute top-2 left-2 px-1.5 py-0.5 rounded text-white text-[9px] font-bold uppercase z-[5] animate-pulse-badge"
                style={{ 
                  background: 'linear-gradient(135deg, #EC1841, #c41235)',
                  boxShadow: '0 2px 6px rgba(236, 24, 65, 0.3)'
                }}
              >
                🔥 -{discountPercent}%
              </div>
            )}

            {/* Badge Indisponível */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-gray-900/40 z-[5] flex items-center justify-center">
                <span className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                  Indisponível
                </span>
              </div>
            )}

            {/* Imagem */}
            <div className="w-full aspect-square relative bg-gray-50">
              <Image
                src={product.image || '/placeholder.jpg'}
                alt={product.name}
                fill
                className={`object-cover object-right-bottom ${!isAvailable ? 'grayscale' : ''}`}
              />
            </div>

            {/* Conteúdo */}
            <div className="p-3 flex flex-col flex-1">
              {/* Categoria e Disponibilidade */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] md:text-[10px] text-emerald-600 font-medium uppercase tracking-wide">
                  {getCategoryName(product.category)}
                </span>
                {isAvailable && (
                  <span className="text-[9px] text-emerald-500 font-medium flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Disponível
                  </span>
                )}
              </div>

              {/* Nome */}
              <h4 className="text-sm font-semibold leading-tight text-gray-900 line-clamp-2 mb-2">
                {product.name}
              </h4>

              {/* Preço e Botão */}
              <div className="mt-auto pt-2 border-t border-gray-100">
                <div className="flex items-baseline gap-1 mb-2">
                  {hasPromo && (
                    <span className="text-[10px] text-gray-400 line-through">
                      R$ {formatNumber(product.price)}
                    </span>
                  )}
                  <span className={`text-base font-bold ${hasPromo ? 'text-emerald-600' : 'text-gray-900'}`}>
                    R$ {formatNumber(displayPrice)}
                  </span>
                  <span className="text-[10px] text-gray-500">/{product.unit}</span>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAvailable) onAddToCart(product.id, e)
                  }}
                  disabled={!isAvailable}
                  className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 text-xs transition-colors ${
                    isAvailable 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? '🛒 Adicionar' : 'Esgotado'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
