"use client"

import Image from "next/image"
import { ShoppingCart, Package, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useRef } from "react"

export default function ProductCard({ product, onAddToCart }) {
  const [isAdded, setIsAdded] = useState(false)
  const imageRef = useRef(null)

  const handleAddToCart = (e) => {
    // Trigger animation
    animateFlyToCart(imageRef.current)
    
    onAddToCart(product)
    setIsAdded(true)
    
    // Remove visual feedback after 1.5 seconds
    setTimeout(() => {
      setIsAdded(false)
    }, 1500)
  }

  const animateFlyToCart = (sourceElement) => {
    if (!sourceElement) return

    const cartIcon = document.getElementById('cart-icon')
    if (!cartIcon) return

    // Clone the image element
    const flyingImage = sourceElement.cloneNode(true)
    const rect = sourceElement.getBoundingClientRect()
    const cartRect = cartIcon.getBoundingClientRect()

    // Initial styles
    flyingImage.style.position = 'fixed'
    flyingImage.style.left = `${rect.left}px`
    flyingImage.style.top = `${rect.top}px`
    flyingImage.style.width = `${rect.width}px`
    flyingImage.style.height = `${rect.height}px`
    flyingImage.style.borderRadius = '50%' // Make it circular
    flyingImage.style.zIndex = '9999'
    flyingImage.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' // Smooth curve
    flyingImage.style.opacity = '0.8'
    flyingImage.style.pointerEvents = 'none' // Don't block interactions
    
    // Remove next/image specific styles that might conflict
    flyingImage.style.maxWidth = 'none'
    flyingImage.style.maxHeight = 'none'

    document.body.appendChild(flyingImage)

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      flyingImage.style.left = `${cartRect.left + cartRect.width / 4}px`
      flyingImage.style.top = `${cartRect.top + cartRect.height / 4}px`
      flyingImage.style.width = '20px'
      flyingImage.style.height = '20px'
      flyingImage.style.opacity = '0'
    })

    // Clean up
    setTimeout(() => {
      if (flyingImage.parentNode) {
        flyingImage.parentNode.removeChild(flyingImage)
      }
    }, 800)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted" ref={imageRef}>
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base sm:text-lg text-balance leading-tight">{product.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {product.category}
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground text-pretty line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>
            Estoque: {product.stock} {product.unit}
          </span>
        </div>

        {product.minOrder && product.minOrder > 1 && (
          <p className="text-xs text-muted-foreground">
            Pedido mínimo: {product.minOrder} {product.unit}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xl sm:text-2xl font-bold text-primary">R$ {product.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">por {product.unit}</p>
        </div>

        <Button 
          onClick={handleAddToCart} 
          size="sm" 
          className={`min-h-[44px] gap-2 transition-all duration-200 ${isAdded ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionado!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
