"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth, getUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Package, Clock, Truck, CheckCircle, XCircle, Loader2, Filter } from "lucide-react"

const statusMap = {
  processando: { label: "Processando", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  em_transito: { label: "Em Trânsito", color: "bg-blue-100 text-blue-800", icon: Truck },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    loadOrders()
  }, [router])

  const loadOrders = async () => {
    try {
      const data = await fetchWithAuth("/api/orders/all")
      setOrders(data)
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await fetchWithAuth(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      
      // Atualizar lista localmente
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      alert("Erro ao atualizar status")
    } finally {
      setUpdating(null)
    }
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status === filter)

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Administração de Pedidos</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os pedidos da plataforma</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pedidos</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado com este filtro.</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = statusMap[order.status]?.icon || Package
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{order.order_number}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className="font-medium">{order.contact_info.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(order.created_at), "PPP 'às' p", { locale: ptBR })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateStatus(order.id, value)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className={`w-[160px] h-8 ${statusMap[order.status]?.color} border-0`}>
                            {updating === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-3 w-3" />
                                <SelectValue />
                              </div>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="processando">Processando</SelectItem>
                            <SelectItem value="em_transito">Em Trânsito</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Itens do Pedido</h3>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                                  {item.quantity}x
                                </span>
                                <span>{item.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>R$ {order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4 text-sm">
                        <div>
                          <h3 className="font-semibold mb-1">Endereço de Entrega</h3>
                          <p className="text-muted-foreground">
                            {order.shipping_address.street}, {order.shipping_address.number}
                            {order.shipping_address.complement && ` - ${order.shipping_address.complement}`}
                            <br />
                            {order.shipping_address.neighborhood} - {order.shipping_address.city}/{order.shipping_address.state}
                            <br />
                            CEP: {order.shipping_address.zipcode}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-1">Contato</h3>
                          <p className="text-muted-foreground">
                            {order.contact_info.phone}
                            <br />
                            {order.contact_info.email}
                          </p>
                        </div>

                        {order.notes && (
                          <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800 text-xs">
                            <span className="font-bold">Observações:</span> {order.notes}
                          </div>
                        )}
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

