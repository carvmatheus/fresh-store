"use client"

import { useState } from "react"
import { Calculator, MapPin, Clock, Truck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calculateDelivery } from "@/lib/products-data"

export default function DeliverySimulator({ cartTotal }) {
  const [cep, setCep] = useState("")
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleCEPChange = (e) => {
    const formatted = formatCEP(e.target.value)
    setCep(formatted)
    setError("")
  }

  const handleCalculate = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("Por favor, insira um CEP válido")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await calculateDelivery(cep, cartTotal)
      setEstimate(result)
    } catch (err) {
      setError(err.message || "Erro ao calcular entrega. Tente novamente.")
      setEstimate(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
          Simulador de Entrega
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Calcule o prazo e valor da entrega para seu endereço
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            placeholder="Digite seu CEP"
            value={cep}
            onChange={handleCEPChange}
            maxLength={9}
            className="flex-1 min-h-[44px] text-base"
          />
          <Button onClick={handleCalculate} disabled={loading} className="min-h-[44px] sm:w-auto">
            {loading ? "Calculando..." : "Calcular Frete"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {estimate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <Card>
              <CardContent className="pt-5 sm:pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Distância</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{estimate.distance} km</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 sm:pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Tempo Estimado</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">{estimate.estimatedTime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 sm:pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Taxa de Entrega</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {estimate.deliveryFee === 0 ? "GRÁTIS" : `R$ ${estimate.deliveryFee.toFixed(2)}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 sm:pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Pedido Mínimo</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">R$ {estimate.minOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {estimate && estimate.deliveryFee === 0 && (
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription className="text-sm">Entrega grátis para sua região!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
