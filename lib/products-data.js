export const categories = [
  { id: "all", name: "Todos os Produtos" },
  { id: "verduras", name: "Verduras" },
  { id: "legumes", name: "Legumes" },
  { id: "frutas", name: "Frutas" },
  { id: "temperos", name: "Temperos" },
  { id: "graos", name: "Grãos e Cereais" },
]

export const products = [
  {
    id: 1,
    name: "Alface Americana",
    category: "verduras",
    price: 4.5,
    unit: "unidade",
    minOrder: 5,
    stock: 150,
    image: "/fresh-lettuce.png",
    description: "Alface fresca e crocante",
  },
  {
    id: 2,
    name: "Tomate Italiano",
    category: "legumes",
    price: 6.9,
    unit: "kg",
    minOrder: 2,
    stock: 200,
    image: "/italian-tomatoes.jpg",
    description: "Tomate italiano premium",
  },
  {
    id: 3,
    name: "Cebola Roxa",
    category: "legumes",
    price: 5.5,
    unit: "kg",
    minOrder: 3,
    stock: 180,
    image: "/red-onion.jpg",
    description: "Cebola roxa de qualidade",
  },
  {
    id: 4,
    name: "Rúcula Orgânica",
    category: "verduras",
    price: 8.9,
    unit: "maço",
    minOrder: 3,
    stock: 100,
    image: "/organic-arugula.jpg",
    description: "Rúcula orgânica fresca",
  },
  {
    id: 5,
    name: "Batata Inglesa",
    category: "legumes",
    price: 4.2,
    unit: "kg",
    minOrder: 5,
    stock: 300,
    image: "/batata-inglesa.jpg",
    description: "Batata inglesa selecionada",
  },
  {
    id: 6,
    name: "Cenoura",
    category: "legumes",
    price: 3.8,
    unit: "kg",
    minOrder: 5,
    stock: 250,
    image: "/cenoura-fresca.jpg",
    description: "Cenoura fresca e doce",
  },
  {
    id: 7,
    name: "Banana Prata",
    category: "frutas",
    price: 5.5,
    unit: "kg",
    minOrder: 5,
    stock: 200,
    image: "/banana-prata.jpg",
    description: "Banana prata madura",
  },
  {
    id: 8,
    name: "Maçã Fuji",
    category: "frutas",
    price: 7.9,
    unit: "kg",
    minOrder: 3,
    stock: 150,
    image: "/ma---fuji-vermelha.jpg",
    description: "Maçã fuji importada",
  },
  {
    id: 9,
    name: "Manjericão Fresco",
    category: "temperos",
    price: 6.5,
    unit: "maço",
    minOrder: 2,
    stock: 80,
    image: "/manjeric-o-fresco.jpg",
    description: "Manjericão fresco aromático",
  },
  {
    id: 10,
    name: "Alho Nacional",
    category: "temperos",
    price: 18.9,
    unit: "kg",
    minOrder: 1,
    stock: 120,
    image: "/alho-branco.jpg",
    description: "Alho nacional de primeira",
  },
  {
    id: 11,
    name: "Arroz Integral",
    category: "graos",
    price: 12.9,
    unit: "kg",
    minOrder: 10,
    stock: 500,
    image: "/arroz-integral.jpg",
    description: "Arroz integral tipo 1",
  },
  {
    id: 12,
    name: "Feijão Preto",
    category: "graos",
    price: 8.5,
    unit: "kg",
    minOrder: 10,
    stock: 400,
    image: "/feij-o-preto.jpg",
    description: "Feijão preto selecionado",
  },
]

export function getProducts(category = "all") {
  if (category === "all") {
    return products
  }
  return products.filter((product) => product.category === category)
}

export async function calculateDelivery(cep, cartTotal) {
  // Simula um delay de API
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Remove formatação do CEP
  const cleanCep = cep.replace(/\D/g, "")

  if (cleanCep.length !== 8) {
    throw new Error("CEP inválido")
  }

  // Simula cálculo de distância baseado no CEP
  // Usa os últimos 3 dígitos para gerar uma distância "aleatória" mas consistente
  const lastDigits = Number.parseInt(cleanCep.slice(-3))
  const distance = Math.floor((lastDigits / 1000) * 50) + 5 // Entre 5 e 55 km

  // Calcula tempo estimado (aproximadamente 1 hora para cada 20km)
  const hours = Math.floor(distance / 20)
  const minutes = Math.floor(((distance % 20) / 20) * 60)
  const estimatedTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutos`

  // Calcula taxa de entrega baseada na distância
  let deliveryFee = 0
  let minOrderValue = 100

  if (distance <= 10) {
    deliveryFee = 0 // Grátis até 10km
    minOrderValue = 100
  } else if (distance <= 20) {
    deliveryFee = 15
    minOrderValue = 150
  } else if (distance <= 30) {
    deliveryFee = 25
    minOrderValue = 200
  } else {
    deliveryFee = 35
    minOrderValue = 250
  }

  // Se o valor do carrinho for maior que o dobro do pedido mínimo, entrega grátis
  if (cartTotal >= minOrderValue * 2) {
    deliveryFee = 0
  }

  return {
    distance,
    estimatedTime,
    deliveryFee,
    minOrderValue,
    cep: cep,
  }
}
