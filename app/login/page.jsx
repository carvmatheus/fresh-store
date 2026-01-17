"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { login, getCurrentUser, getRedirectUrl } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirecionar se já estiver logado
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      const redirectUrl = getRedirectUrl(currentUser)
      router.replace(redirectUrl)
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await login(email.trim(), password)
      const redirectUrl = getRedirectUrl(data.user)
      router.push(redirectUrl)
    } catch (err) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Load failed')) {
        setError('Erro de conexão com o servidor. Verifique sua internet.')
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Usuário ou senha incorretos')
      } else {
        setError(err.message || "Erro ao fazer login")
      }
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Header */}
      <div 
        className="w-full overflow-hidden cursor-pointer transition-opacity hover:opacity-95"
        style={{ background: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)' }}
        onClick={() => router.push('/')}
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

      {/* Login Container */}
      <main className="container mx-auto flex items-center justify-center min-h-[calc(100vh-300px)] px-4 py-8">
        <div className="bg-white rounded-2xl p-6 md:p-10 max-w-[480px] w-full shadow-xl border border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">
            Bem-vindo! 👋
          </h1>
          <p className="text-center text-gray-600 mb-8 text-base">
            Entre com suas credenciais para acessar o catálogo
          </p>

          {/* Alert de Erro */}
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="loginEmail" 
                className="block font-semibold text-gray-700 mb-2 text-sm"
              >
                E-mail ou Usuário
              </label>
              <input
                type="text"
                id="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com ou nome de usuário"
                required
                autoComplete="username"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
              />
            </div>

            <div>
              <label 
                htmlFor="loginPassword" 
                className="block font-semibold text-gray-700 mb-2 text-sm"
              >
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                required
                  autoComplete="current-password"
                disabled={loading}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 p-2 opacity-70 hover:opacity-100 transition-opacity"
                  title="Mostrar/Ocultar senha"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg rounded-lg transition-all transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="relative text-center my-8">
            <span className="bg-white px-4 text-gray-500 text-sm relative z-10">ou</span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -z-0" />
          </div>

          {/* Link para Cadastro */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ainda não tem conta?
            </h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Cadastre sua empresa e tenha acesso ao nosso catálogo completo de produtos frescos!
            </p>
            <Link
              href="/register"
              className="inline-block py-4 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            >
              📝 Criar Conta Agora
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
