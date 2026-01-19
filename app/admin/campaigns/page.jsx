"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Determinar status da campanha baseado em datas e status do backend
function getCampaignStatus(campaign) {
  const now = new Date()
  const startDate = new Date(campaign.start_date)
  const endDate = new Date(campaign.end_date)
  const campaignStatus = campaign.status
  
  // Status baseado no campo status da campanha (do backend)
  if (campaignStatus === 'paused') {
    return { status: 'paused', label: 'Pausada', color: 'bg-amber-500/20 text-amber-400' }
  }
  if (campaignStatus === 'suspended') {
    return { status: 'suspended', label: 'Suspensa', color: 'bg-red-500/20 text-red-400' }
  }
  if (campaignStatus === 'active') {
    return { status: 'active', label: 'Ativa', color: 'bg-emerald-500/20 text-emerald-400' }
  }
  
  // Campanha não tem status explícito - usar datas
  if (now < startDate) {
    return { status: 'scheduled', label: 'Agendada', color: 'bg-blue-500/20 text-blue-400' }
  }
  if (now <= endDate && campaign.is_active) {
    return { status: 'active', label: 'Ativa', color: 'bg-emerald-500/20 text-emerald-400' }
  }
  if (now > endDate) {
    return { status: 'expired', label: 'Expirada', color: 'bg-gray-500/20 text-gray-400' }
  }
  
  return { status: 'inactive', label: 'Inativa', color: 'bg-gray-500/20 text-gray-400' }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'active', 'scheduled', 'paused'
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [campaignsData, productsData] = await Promise.all([
        api.getCampaigns ? api.getCampaigns() : [],
        api.getProducts()
      ])
      setCampaigns(campaignsData || [])
      setProducts(productsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCampaign = async (campaignId) => {
    if (!confirm('Aplicar esta campanha? Os descontos serão aplicados nos produtos.')) return
    setActionLoading(campaignId)
    try {
      if (api.applyCampaign) {
        await api.applyCampaign(campaignId)
      }
      await loadData()
      alert('✅ Campanha aplicada!')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePauseCampaign = async (campaignId) => {
    if (!confirm('Pausar esta campanha?')) return
    setActionLoading(campaignId)
    try {
      if (api.pauseCampaign) {
        await api.pauseCampaign(campaignId)
      }
      await loadData()
      alert('✅ Campanha pausada!')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResumeCampaign = async (campaignId) => {
    if (!confirm('Resumir esta campanha?')) return
    setActionLoading(campaignId)
    try {
      if (api.resumeCampaign) {
        await api.resumeCampaign(campaignId)
      }
      await loadData()
      alert('✅ Campanha resumida!')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspendCampaign = async (campaignId) => {
    if (!confirm('Suspender permanentemente esta campanha?')) return
    setActionLoading(campaignId)
    try {
      if (api.suspendCampaign) {
        await api.suspendCampaign(campaignId)
      }
      await loadData()
      alert('✅ Campanha suspensa!')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Excluir esta campanha permanentemente?')) return
    setActionLoading(campaignId)
    try {
      if (api.deleteCampaign) {
        await api.deleteCampaign(campaignId)
      }
      await loadData()
      alert('✅ Campanha excluída!')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Estatísticas
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => getCampaignStatus(c).status === 'active').length,
    scheduled: campaigns.filter(c => getCampaignStatus(c).status === 'scheduled').length,
    paused: campaigns.filter(c => getCampaignStatus(c).status === 'paused').length,
    expired: campaigns.filter(c => getCampaignStatus(c).status === 'expired').length,
  }

  // Filtrar campanhas
  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true
    return getCampaignStatus(c).status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando campanhas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Campanhas Promocionais</h2>
          <p className="text-gray-400">{stats.total} campanhas • {stats.active} ativas</p>
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setShowModal(true) }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <span>➕</span> Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">🎯</div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">🔥</div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-sm text-gray-400">Ativas</p>
            </div>
          </div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl">📅</div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{stats.scheduled}</p>
              <p className="text-sm text-gray-400">Agendadas</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-2xl">⏸️</div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{stats.paused}</p>
              <p className="text-sm text-gray-400">Pausadas</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center text-2xl">⏱️</div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{stats.expired}</p>
              <p className="text-sm text-gray-400">Expiradas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: `Todas (${stats.total})`, color: 'bg-gray-500' },
          { value: 'active', label: `🔥 Ativas (${stats.active})`, color: 'bg-emerald-500' },
          { value: 'scheduled', label: `📅 Agendadas (${stats.scheduled})`, color: 'bg-cyan-500' },
          { value: 'paused', label: `⏸️ Pausadas (${stats.paused})`, color: 'bg-amber-500' },
          { value: 'expired', label: `⏱️ Expiradas (${stats.expired})`, color: 'bg-gray-500' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f.value
                ? `${f.color} text-white`
                : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg font-medium bg-[#1a1f26] text-gray-400 hover:bg-[#242b33] transition-colors ml-auto"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🎯</div>
          <p className="text-gray-500 text-lg">Nenhuma campanha encontrada</p>
          <p className="text-gray-600 text-sm mt-2">Crie uma nova campanha para começar</p>
          <button
            onClick={() => { setEditingCampaign(null); setShowModal(true) }}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ➕ Criar Campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => {
            const { status, label, color } = getCampaignStatus(campaign)
            const isLoading = actionLoading === campaign.id
            
            const canApply = status === 'scheduled'
            const canPause = status === 'active'
            const canResume = status === 'paused'
            const canSuspend = status !== 'suspended'
            
            const discountDisplay = campaign.discount_type === 'percentage'
              ? `-${campaign.discount_value}%`
              : `-${formatCurrency(campaign.discount_value)}`

            return (
              <div key={campaign.id} className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#2d3640] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color.replace('text-', 'bg-').replace('/20', '/30')}`}>
                      🎯
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-100">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">{campaign.description || 'Sem descrição'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${color}`}>
                    {label}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0f1318] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Desconto</p>
                      <p className="text-lg font-bold text-emerald-400">{discountDisplay}</p>
                    </div>
                    <div className="bg-[#0f1318] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Produtos</p>
                      <p className="text-lg font-bold text-blue-400">{campaign.products?.length || 0}</p>
                    </div>
                    <div className="bg-[#0f1318] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Início</p>
                      <p className="text-sm text-gray-100">{formatDate(campaign.start_date)}</p>
                    </div>
                    <div className="bg-[#0f1318] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Término</p>
                      <p className="text-sm text-gray-100">{formatDate(campaign.end_date)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApplyCampaign(campaign.id)}
                      disabled={!canApply || isLoading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        canApply && !isLoading
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? '...' : '⚡ Aplicar'}
                    </button>
                    <button
                      onClick={() => handlePauseCampaign(campaign.id)}
                      disabled={!canPause || isLoading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        canPause && !isLoading
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? '...' : '⏸️ Pausar'}
                    </button>
                    <button
                      onClick={() => handleResumeCampaign(campaign.id)}
                      disabled={!canResume || isLoading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        canResume && !isLoading
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? '...' : '▶️ Resumir'}
                    </button>
                    <button
                      onClick={() => handleSuspendCampaign(campaign.id)}
                      disabled={!canSuspend || isLoading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        canSuspend && !isLoading
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? '...' : '⛔ Suspender'}
                    </button>
                    <button
                      onClick={() => { setEditingCampaign(campaign); setShowModal(true) }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#242b33] text-gray-300 hover:bg-[#2d3640] transition-colors ml-auto"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      {isLoading ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          products={products}
          onClose={() => setShowModal(false)}
          onSave={async () => { await loadData(); setShowModal(false) }}
        />
      )}
    </div>
  )
}

// Modal para criar/editar campanha
function CampaignModal({ campaign, products, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    discount_type: campaign?.discount_type || 'percentage',
    discount_value: campaign?.discount_value || '',
    start_date: campaign?.start_date?.slice(0, 16) || '',
    end_date: campaign?.end_date?.slice(0, 16) || '',
    products: campaign?.products || [],
  })
  const [saving, setSaving] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const toggleProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.discount_value || !formData.start_date || !formData.end_date) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    
    setSaving(true)
    try {
      if (campaign?.id) {
        if (api.updateCampaign) {
          await api.updateCampaign(campaign.id, formData)
        }
      } else {
        if (api.createCampaign) {
          await api.createCampaign(formData)
        }
      }
      onSave()
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-100">
            {campaign ? '✏️ Editar Campanha' : '➕ Nova Campanha'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Nome da Campanha *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Black Friday"
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição da campanha..."
                rows={2}
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo de Desconto *</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Valor do Desconto *</label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                step="0.01"
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data de Início *</label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data de Término *</label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Products Selection */}
          <div className="pt-4 border-t border-[#2d3640]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">📦 Produtos da Campanha ({formData.products.length} selecionados)</label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="bg-[#0f1318] border border-[#2d3640] rounded-lg px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>
            <div className="max-h-48 overflow-y-auto bg-[#0f1318] rounded-lg border border-[#2d3640]">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum produto encontrado</p>
              ) : (
                filteredProducts.map(product => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#1a1f26] border-b border-[#2d3640] last:border-0 ${
                      formData.products.includes(product.id) ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.products.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image || product.image_url || '/placeholder.jpg'}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-100 text-sm truncate">{product.name}</p>
                      <p className="text-gray-500 text-xs">{formatCurrency(product.price)}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#2d3640]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-[#2d3640] text-gray-300 font-medium hover:bg-[#3d4650] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : (campaign ? '✅ Salvar Alterações' : '➕ Criar Campanha')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
