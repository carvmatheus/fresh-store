"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { getUser } from "@/lib/auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const statusMap = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  em_preparacao: { label: "Em Preparação", color: "bg-indigo-100 text-indigo-800", icon: Package },
  em_transporte: { label: "Em Transporte", color: "bg-purple-100 text-purple-800", icon: Truck },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800", icon: CheckCircle }, // Compatibilidade
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
  reembolsado: { label: "Reembolsado", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
}

export default function UserOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)

    const loadOrders = async () => {
      try {
        const data = await api.getOrders()
        setOrders(data)
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não fez nenhum pedido.</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const StatusIcon = statusMap[order.status]?.icon || Package

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pedido #{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "PPP 'às' p", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`w-fit flex items-center gap-1 ${statusMap[order.status]?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium w-8 text-center bg-muted rounded px-2 py-1">
                                {item.quantity}x
                              </span>
                              <span className="text-sm">{item.product_name || item.name}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {/* Verifica se price existe, senão unit_price, senão calcula do total */}
                              R$ {((item.price || item.unit_price || (item.total / item.quantity)) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {/* Verifica se shipping_address existe e é objeto ou string */}
                          {order.shipping_address && (
                            <p>
                              Entrega em: {
                                typeof order.shipping_address === 'string'
                                  ? order.shipping_address
                                  : `${order.shipping_address.street}, ${order.shipping_address.number}`
                              }
                            </p>
                          )}
                          {order.delivery_date && (
                            <p className="text-primary mt-1">
                              Previsão: {format(new Date(order.delivery_date), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Frete: {(!order.delivery_fee || order.delivery_fee === 0) ? "Grátis" : `R$ ${order.delivery_fee?.toFixed(2)}`}
                          </p>
                          <p className="text-lg font-bold mt-1">
                            Total: R$ {Number(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

