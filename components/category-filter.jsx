"use client"

import { Button } from "@/components/ui/button"

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onSelectCategory(category.id)}
          className="whitespace-nowrap min-h-[44px] px-4 sm:px-6"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
