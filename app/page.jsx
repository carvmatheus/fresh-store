"use client"

import { useState } from "react"
import Header from "@/components/header"
import CategoryFilter from "@/components/category-filter"
import ProductGrid from "@/components/product-grid"
import DeliverySimulator from "@/components/delivery-simulator"
import { categories, getProducts } from "@/lib/products-data"

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState([])

  const products = getProducts(selectedCategory)

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + (product.minOrder || 1) } : item,
        )
      }
      return [...prevCart, { ...product, quantity: product.minOrder || 1 }]
    })
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
    } else {
      setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemsCount={cartItemsCount}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        cartTotal={cartTotal}
      />

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3 md:space-y-4 py-6 md:py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
            Fornecimento Profissional para Restaurantes
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Verduras, legumes e produtos frescos de qualidade premium com entrega rápida
          </p>
        </section>

        {/* Delivery Simulator */}
        <DeliverySimulator cartTotal={cartTotal} />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Products Grid */}
        <ProductGrid products={products} onAddToCart={addToCart} />
      </main>
    </div>
  )
}
