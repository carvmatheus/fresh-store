"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"

export default function ApprovalsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      await api.approveUser(userId)
      await loadUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error)
      alert('Erro ao aprovar usuário')
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) return
    try {
      await api.rejectUser(userId)
      await loadUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error)
      alert('Erro ao rejeitar usuário')
    }
  }

  const handleSuspend = async (userId) => {
    try {
      await api.suspendUser(userId)
      await loadUsers()
    } catch (error) {
      console.error('Erro ao suspender usuário:', error)
    }
  }

  const filteredUsers = users.filter(u => {
    const isRejected = u.approval_status === 'suspended' && u.suspension_reason?.includes('Rejeitado')

    if (filter === 'pending') return u.approval_status === 'pending'
    if (filter === 'approved') return u.approval_status === 'approved'
    if (filter === 'rejected') return isRejected
    if (filter === 'suspended') return u.approval_status === 'suspended' && !isRejected
    return true
  })

  const pendingCount = users.filter(u => u.approval_status === 'pending').length

  const getStatusBadge = (user) => {
    let status = user.approval_status
    if (status === 'suspended' && user.suspension_reason?.includes('Rejeitado')) {
      status = 'rejected'
    }

    const styles = {
      pending: 'bg-amber-500/20 text-amber-400',
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-gray-500/20 text-gray-400',
    }
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      suspended: 'Suspenso',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Aprovações de Clientes</h2>
        <p className="text-gray-400">
          {pendingCount > 0
            ? `${pendingCount} cadastro${pendingCount > 1 ? 's' : ''} aguardando aprovação`
            : 'Nenhum cadastro pendente'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'pending', label: 'Pendentes', count: users.filter(u => u.approval_status === 'pending').length },
          { id: 'approved', label: 'Aprovados', count: users.filter(u => u.approval_status === 'approved').length },
          { id: 'rejected', label: 'Rejeitados', count: users.filter(u => u.approval_status === 'rejected').length },
          { id: 'suspended', label: 'Suspensos', count: users.filter(u => u.approval_status === 'suspended').length },
          { id: 'all', label: 'Todos', count: users.length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f.id
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1a1f26] text-gray-400 hover:bg-[#242b33]'
              }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4 opacity-50">👥</div>
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-5 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">
                    🏢
                  </div>
                  <div>
                    <p className="font-bold text-gray-100">{user.company_name || user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                {getStatusBadge(user)}
              </div>

              <div className="space-y-2 text-sm mb-4">
                {user.cnpj && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">CNPJ:</span>
                    <span className="text-gray-300 font-mono">{user.cnpj}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="text-gray-300">{user.phone}</span>
                  </div>
                )}
                {user.business_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="text-gray-300 capitalize">{user.business_type}</span>
                  </div>
                )}
                {user.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cadastro:</span>
                    <span className="text-gray-300">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#242b33] text-gray-300 hover:bg-[#2d3640] transition-colors text-sm font-medium"
                >
                  Ver Detalhes
                </button>
                {user.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      title="Aprovar"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Rejeitar"
                    >
                      ✕
                    </button>
                  </>
                )}
                {user.approval_status === 'approved' && (
                  <button
                    onClick={() => handleSuspend(user.id)}
                    className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                    title="Suspender"
                  >
                    ⏸
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-100">Detalhes do Cliente</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Empresa */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Dados da Empresa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Razão Social</p>
                    <p className="text-gray-100">{selectedUser.razao_social || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-100">{selectedUser.company_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CNPJ</p>
                    <p className="text-gray-100 font-mono">{selectedUser.cnpj || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Inscrição Estadual</p>
                    <p className="text-gray-100">{selectedUser.inscricao_estadual || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tipo de Negócio</p>
                    <p className="text-gray-100 capitalize">{selectedUser.business_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Preferência de Pagamento</p>
                    <p className="text-gray-100 capitalize">{selectedUser.payment_preference || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Contato</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="text-gray-100">{selectedUser.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-gray-100">{selectedUser.phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-100">{selectedUser.email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {selectedUser.address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Endereço de Entrega</h4>
                  <div className="bg-[#0f1419] rounded-lg p-4">
                    <p className="text-gray-100">
                      {selectedUser.address.street}, {selectedUser.address.number}
                      {selectedUser.address.complement && ` - ${selectedUser.address.complement}`}
                    </p>
                    <p className="text-gray-400">
                      {selectedUser.address.neighborhood} - {selectedUser.address.city}/{selectedUser.address.state}
                    </p>
                    <p className="text-gray-500">CEP: {selectedUser.address.cep}</p>
                  </div>
                </div>
              )}

              {/* Justificativa */}
              {selectedUser.billing_justification && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Justificativa para Faturamento</h4>
                  <p className="text-gray-300 bg-[#0f1419] rounded-lg p-4">{selectedUser.billing_justification}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2d3640]">
                <div>
                  <p className="text-xs text-gray-500">Status atual</p>
                  {getStatusBadge(selectedUser)}
                </div>

                <div className="flex gap-2">
                  {selectedUser.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(selectedUser.id)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleApprove(selectedUser.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
                      >
                        Aprovar Cliente
                      </button>
                    </>
                  )}
                  {selectedUser.approval_status === 'approved' && (
                    <button
                      onClick={() => handleSuspend(selectedUser.id)}
                      className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors font-medium"
                    >
                      Suspender Conta
                    </button>
                  )}
                  {selectedUser.approval_status === 'suspended' && (
                    <button
                      onClick={() => handleApprove(selectedUser.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium"
                    >
                      Reativar Conta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
