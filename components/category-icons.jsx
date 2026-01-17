"use client"

import Image from "next/image"

const ICONS_PATH = '/images/icons/'

const categories = [
  { id: "all", name: "Todos", icon: "todos" },
  { id: "ofertas", name: "Ofertas", icon: "ofertas" },
  { id: "vegetais", name: "Vegetais", icon: "vegetais" },
  { id: "frutas", name: "Frutas", icon: "frutas" },
  { id: "verduras", name: "Verduras", icon: "verduras" },
  { id: "exoticos", name: "Exóticos", icon: "exoticos" },
  { id: "granjeiro", name: "Granjeiro", icon: "granjeiro" },
  { id: "processados", name: "Processados", icon: "processados" },
  { id: "outros", name: "Outros", icon: "graos" }
]

export function CategoryIcons({ selectedCategory = 'all', onCategorySelect }) {
  return (
    <div className="py-4 px-4">
      <div className="flex justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide max-w-6xl mx-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            className={`flex flex-col items-center gap-2 cursor-pointer transition-all flex-shrink-0 px-3 py-3 rounded-2xl ${
              selectedCategory === cat.id 
                ? 'bg-emerald-50 shadow-sm' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div 
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                selectedCategory === cat.id 
                  ? 'bg-emerald-600 ring-3 ring-emerald-200 shadow-lg' 
                  : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg'
              }`}
            >
              <Image
                src={`${ICONS_PATH}${cat.icon}.svg`}
                alt={cat.name}
                width={28}
                height={28}
                className="md:w-8 md:h-8 brightness-0 invert"
              />
            </div>
            <span 
              className={`text-xs md:text-sm font-medium text-center whitespace-nowrap ${
                selectedCategory === cat.id ? 'text-emerald-700 font-bold' : 'text-gray-600'
              }`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function getCategoryName(categoryId) {
  const category = categories.find(cat => cat.id === categoryId)
  return category ? category.name : categoryId
}

export { categories }
