"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { api } from "@/lib/api-client"
import { getCurrentUser } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showJustificativa, setShowJustificativa] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState("")
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    businessType: "",
    cnpj: "",
    ie: "",
    razaoSocial: "",
    nomeFantasia: "",
    contactName: "",
    contactPhone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    paymentType: "",
    justificativaFaturamento: "",
    acceptTerms: false
  })

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/")
    }
  }, [router])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))

    // Toggle justificativa
    if (name === "paymentType") {
      setShowJustificativa(value === "faturamento")
      updatePaymentInfo(value)
    }
  }

  const updatePaymentInfo = (type) => {
    const infos = {
      pix: { icon: "⚡", title: "PIX", desc: "Pagamento instantâneo. Receba a confirmação na hora!" },
      cartao_credito: { icon: "💳", title: "Cartão de Crédito", desc: "Parcele em até 3x sem juros. Aprovação imediata." },
      boleto_7dias: { icon: "📄", title: "Boleto 7 dias", desc: "Vencimento em 7 dias após a emissão do pedido." },
      boleto_10dias: { icon: "📄", title: "Boleto 10 dias", desc: "Vencimento em 10 dias após a emissão do pedido." },
      faturamento: { icon: "📊", title: "Faturamento (A Prazo)", desc: "Pagamento faturado conforme acordo comercial. Sujeito a análise de crédito." }
    }
    setPaymentInfo(infos[type] || null)
  }

  // Máscaras
  const handleCNPJChange = (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 14) value = value.slice(0, 14)
    
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1.$2.$3/$4")
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d+)$/, "$1.$2.$3")
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d+)$/, "$1.$2")
    }
    setFormData(prev => ({ ...prev, cnpj: value }))
  }

  const handleCEPChange = (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 8) value = value.slice(0, 8)
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d+)$/, "$1-$2")
    }
    setFormData(prev => ({ ...prev, cep: value }))
  }

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)
    
    if (value.length > 7) {
      value = value.replace(/^(\d{2})(\d{5})(\d+)$/, "($1) $2-$3")
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d+)$/, "($1) $2")
    }
    setFormData(prev => ({ ...prev, contactPhone: value }))
  }

  // Buscar CEP
  const searchCEP = async () => {
    const cep = formData.cep.replace(/\D/g, "")
    if (cep.length !== 8) {
      alert("Digite um CEP válido")
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        alert("CEP não encontrado")
        return
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || ""
      }))
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      alert("Erro ao buscar CEP")
    }
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validações
    if (formData.password !== formData.passwordConfirm) {
      setError("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (!formData.acceptTerms) {
      setError("Você deve aceitar os termos de uso")
      return
    }

    if (formData.paymentType === "faturamento" && !formData.justificativaFaturamento) {
      setError("Por favor, preencha a justificativa para faturamento")
      return
    }

    setLoading(true)

    try {
      // Estrutura de dados IDÊNTICA ao original (register.html)
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.contactName,
        company: formData.nomeFantasia,
        // Dados da empresa
        business_type: formData.businessType,
        cnpj: formData.cnpj,
        ie: formData.ie,
        razao_social: formData.razaoSocial,
        phone: formData.contactPhone,
        // Endereço (objeto aninhado como no original)
        address: {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state
        },
        // Dados de Pagamento
        payment_preference: formData.paymentType,
        payment_justification: formData.justificativaFaturamento || null
      }

      await api.register(userData)
      
      // Comportamento idêntico ao original: mostrar mensagem e redirecionar para login
      alert('✅ Cadastro realizado com sucesso!\n\n⏳ Seu cadastro está pendente de aprovação.\nVocê receberá um e-mail quando for aprovado.\n\nAguarde a aprovação para fazer login.')
      router.replace("/login")
    } catch (err) {
      console.error("Erro no registro:", err)
      setError(err.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Header */}
      <div 
        className="w-full overflow-hidden cursor-pointer transition-opacity hover:opacity-95"
        style={{ background: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)' }}
        onClick={() => router.push('/login')}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/header_da_horta_mobile.png" />
          <Image
            src="/images/Header_da_horta.png"
            alt="Da Horta Distribuidor"
            width={1200}
            height={300}
            className="w-full h-auto max-h-[300px] object-contain object-center"
            priority
          />
        </picture>
      </div>

      {/* Register Container */}
      <main className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">🌱 Criar Conta</h1>
            <p className="opacity-90 text-lg">Preencha seus dados para começar a comprar</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-8 mt-6 bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            {/* Dados de Acesso */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🔐 Dados de Acesso
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Escolha um nome de usuário"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      placeholder="Digite novamente"
                      required
                      minLength={6}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none ${
                        formData.passwordConfirm && formData.password !== formData.passwordConfirm
                          ? 'border-red-400 focus:border-red-500'
                          : formData.passwordConfirm && formData.password === formData.passwordConfirm
                          ? 'border-emerald-400 focus:border-emerald-500'
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
                    >
                      {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados da Empresa */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🏢 Dados da Empresa
              </h2>

              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">
                  Tipo de Estabelecimento *
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="hotel">Hotel</option>
                  <option value="mercado">Mercado</option>
                  <option value="padaria">Padaria</option>
                  <option value="lanchonete">Lanchonete</option>
                  <option value="bar">Bar</option>
                  <option value="cafeteria">Cafeteria</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    required
                    maxLength={18}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    name="ie"
                    value={formData.ie}
                    onChange={handleChange}
                    placeholder="000.000.000.000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">
                  Razão Social *
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={handleChange}
                  placeholder="Nome jurídico da empresa"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2 text-sm">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={handleChange}
                  placeholder="Nome comercial"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📞 Contato
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Nome completo"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Telefone/WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📍 Endereço de Entrega
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                    required
                    maxLength={9}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={searchCEP}
                    className="px-6 py-3 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                  >
                    🔍 Buscar CEP
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">
                  Endereço *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Rua, Avenida..."
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 mb-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Número *
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="Nº"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    placeholder="Sala, Andar..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_80px] gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Bairro"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Cidade"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    UF *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="SP"
                    required
                    maxLength={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                💳 Forma de Pagamento Preferida
              </h2>

              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">
                  Tipo de Faturamento *
                </label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="boleto_7dias">Boleto com 7 dias</option>
                  <option value="boleto_10dias">Boleto com 10 dias</option>
                  <option value="faturamento">Faturamento (A Prazo)</option>
                </select>
              </div>

              {showJustificativa && (
                <div className="mb-4">
                  <label className="block font-semibold text-gray-700 mb-2 text-sm">
                    Justificativa para Faturamento *
                  </label>
                  <textarea
                    name="justificativaFaturamento"
                    value={formData.justificativaFaturamento}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Por favor, explique o motivo da solicitação de faturamento a prazo..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-y"
                  />
                  <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    ⚠️ O faturamento está sujeito a análise de crédito. Nossa equipe entrará em contato.
                  </p>
                </div>
              )}

              {paymentInfo && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border-4 border-emerald-500">
                  <span className="text-2xl">{paymentInfo.icon}</span>
                  <div>
                    <strong className="block text-gray-900 mb-1">{paymentInfo.title}</strong>
                    <p className="text-gray-600 text-sm">{paymentInfo.desc}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Termos */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  required
                  className="w-5 h-5 mt-0.5 cursor-pointer"
                />
                <span>
                  Aceito os <a href="#" className="text-emerald-500 font-semibold">termos de uso</a> e{" "}
                  <a href="#" className="text-emerald-500 font-semibold">política de privacidade</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Minha Conta"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-emerald-500 font-semibold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
