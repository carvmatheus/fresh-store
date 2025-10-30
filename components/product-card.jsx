"use client"

import Image from "next/image"
import { ShoppingCart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProductCard({ product, onAddToCart }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
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

        <Button onClick={() => onAddToCart(product)} size="sm" className="min-h-[44px] gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
