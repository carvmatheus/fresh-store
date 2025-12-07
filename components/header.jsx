"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart, Leaf, User, LogOut, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Minus, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUser, logout } from "@/lib/auth"

export default function Header({ cartItemsCount, cart, onUpdateQuantity, onRemoveItem, cartTotal }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <span className="text-lg sm:text-xl font-bold">FreshMarket Pro</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/admin/orders">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  Meus Pedidos
                </Link>
              </Button>

              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 bg-transparent" id="cart-icon">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Carrinho de Compras</SheetTitle>
                <SheetDescription>
                  {cart.length === 0 ? "Seu carrinho está vazio" : `${cartItemsCount} itens no carrinho`}
                </SheetDescription>
              </SheetHeader>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Seu carrinho está vazio</p>
                  <p className="text-sm text-muted-foreground mt-2">Adicione produtos para começar seu pedido</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[calc(100vh-250px)] pr-4 mt-6">
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 py-4">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  R$ {item.price.toFixed(2)} / {item.unit}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-transparent"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-6 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <Button className="w-full" size="lg">
                      Finalizar Pedido
                    </Button>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
