"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { getCurrentUser } from "@/lib/auth"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'Nunca'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRoleIcon(role) {
  switch (role) {
    case 'god': return '⚡'
    case 'admin': return '👑'
    case 'consultor': return '🎯'
    default: return '👤'
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'god': return 'GOD'
    case 'admin': return 'Administrador'
    case 'consultor': return 'Consultor'
    default: return 'Cliente'
  }
}

function getBusinessTypeLabel(type) {
  const types = {
    'restaurante': 'Restaurante',
    'mercado': 'Mercado',
    'hortifruti': 'Hortifruti',
    'sacolao': 'Sacolão',
    'feira': 'Feira',
    'hotel': 'Hotel',
    'cozinha_industrial': 'Cozinha Industrial',
    'outros': 'Outros'
  }
  return types[type] || type || 'Não informado'
}

function getApprovalLabel(status) {
  const labels = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'suspended': 'Suspenso'
  }
  return labels[status] || status
}

function getApprovalColor(status) {
  const colors = {
    'pending': 'bg-amber-500/20 text-amber-400',
    'approved': 'bg-emerald-500/20 text-emerald-400',
    'rejected': 'bg-red-500/20 text-red-400',
    'suspended': 'bg-gray-500/20 text-gray-400'
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400'
}

function getTierLabel(tier) {
  if (!tier) return 'Bronze'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

function getTierColor(tier) {
  const colors = {
    'bronze': 'bg-orange-700/20 text-orange-400',
    'prata': 'bg-gray-400/20 text-gray-300',
    'ouro': 'bg-yellow-500/20 text-yellow-400',
    'platina': 'bg-indigo-300/20 text-indigo-200',
    'diamante': 'bg-cyan-400/20 text-cyan-300'
  }
  return colors[tier?.toLowerCase()] || 'bg-orange-700/20 text-orange-400'
}

function getUserStatus(user) {
  if (user.approval_status === 'suspended' && user.suspension_reason?.includes('Rejeitado')) {
    return 'rejected'
  }
  return user.approval_status
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [businessFilter, setBusinessFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewingPassword, setViewingPassword] = useState(null)
  const [editingPassword, setEditingPassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordHash, setPasswordHash] = useState('')
  const [isGod, setIsGod] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setIsGod(currentUser?.role === 'god')
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

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await api.updateUser(editingUser.id, editingUser)
      await loadUsers()
      setEditingUser(null)
      setSelectedUser(null)
      alert('✅ Usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert('❌ Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSuspendUser = async (userId) => {
    if (!confirm('Deseja suspender este usuário?')) return
    try {
      await api.updateUserApproval(userId, 'suspend')
      await loadUsers()
      alert('✅ Usuário suspenso')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const handleReactivateUser = async (userId) => {
    if (!confirm('Deseja reativar este usuário?')) return
    try {
      await api.updateUserApproval(userId, 'approve')
      await loadUsers()
      alert('✅ Usuário reativado')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    }
  }

  const handleViewPassword = async (user) => {
    try {
      const data = await api.getUserPassword(user.id)
      setPasswordHash(data.hashed_password)
      setViewingPassword(user)
    } catch (error) {
      alert('❌ Erro ao obter senha: ' + error.message)
    }
  }

  const handleEditPassword = (user) => {
    setEditingPassword(user)
    setNewPassword('')
  }

  const handleSavePassword = async () => {
    if (!editingPassword || !newPassword) {
      alert('⚠️ Digite a nova senha')
      return
    }
    if (newPassword.length < 6) {
      alert('⚠️ A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (!confirm('Deseja realmente alterar a senha deste usuário?')) return
    
    try {
      await api.updateUserPassword(editingPassword.id, newPassword)
      setEditingPassword(null)
      setNewPassword('')
      alert('✅ Senha atualizada com sucesso!')
    } catch (error) {
      alert('❌ Erro ao atualizar senha: ' + error.message)
    }
  }

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase()
    const matchesSearch = u.name?.toLowerCase().includes(searchLower) ||
      u.company_name?.toLowerCase().includes(searchLower) ||
      u.company?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.cnpj?.includes(search)

    const status = getUserStatus(u)
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    const matchesBusiness = businessFilter === 'all' || u.business_type === businessFilter
    const matchesRole = roleFilter === 'all' || u.role === roleFilter

    return matchesSearch && matchesStatus && matchesBusiness && matchesRole
  })

  // Estatísticas
  const stats = {
    total: users.length,
    approved: users.filter(u => u.approval_status === 'approved').length,
    pending: users.filter(u => u.approval_status === 'pending').length,
    suspended: users.filter(u => u.approval_status === 'suspended').length,
  }

  // Lista única de tipos de negócio
  const businessTypes = [...new Set(users.map(u => u.business_type).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Clientes</h2>
          <p className="text-gray-400">{stats.total} clientes cadastrados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-3xl font-bold text-blue-400">{stats.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{stats.approved}</p>
              <p className="text-sm text-gray-400">Aprovados</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-sm text-gray-400">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-2xl">⛔</div>
            <div>
              <p className="text-3xl font-bold text-red-400">{stats.suspended}</p>
              <p className="text-sm text-gray-400">Suspensos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">🔍 Buscar</label>
            <input
              type="text"
              placeholder="Nome, empresa, email ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">📋 Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="suspended">Suspensos</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">🏢 Tipo de Negócio</label>
            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{getBusinessTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">👤 Perfil</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos</option>
              <option value="cliente">Clientes</option>
              <option value="admin">Administradores</option>
              <option value="consultor">Consultores</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2d3640]">
          <span className="text-sm text-gray-500">
            {filteredUsers.length} de {users.length} usuários
          </span>
          {(search || statusFilter !== 'all' || businessFilter !== 'all' || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setBusinessFilter('all')
                setRoleFilter('all')
              }}
              className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3640]">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Cliente</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Perfil</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Tier</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Empresa / CNPJ</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden md:table-cell">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Último Login</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden lg:table-cell">Última Compra</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm hidden md:table-cell">Total Gasto</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2d3640] hover:bg-[#242b33] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-100">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${user.role === 'god' ? 'bg-yellow-500/20 text-yellow-400' :
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'consultor' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTierColor(user.tier)}`}>
                        {getTierLabel(user.tier)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-gray-100">{user.company_name || user.company || '-'}</p>
                        <p className="text-xs text-gray-500 font-mono">{user.cnpj || ''}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                        {getBusinessTypeLabel(user.business_type)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-400 text-sm">
                      {formatDateTime(user.last_login)}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-400 text-sm">
                      {formatDateTime(user.last_purchase)}
                    </td>
                    <td className="p-4 hidden md:table-cell text-emerald-400 font-medium">
                      {formatCurrency(user.total_spent || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getApprovalColor(getUserStatus(user))}`}>
                        {getApprovalLabel(getUserStatus(user))}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-lg hover:bg-[#2d3640] transition-colors"
                          title="Ver detalhes"
                        >
                          👁️
                        </button>
                        {isGod && (
                          <button
                            onClick={() => handleViewPassword(user)}
                            className="p-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                            title="Ver senha"
                          >
                            🔑
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingUser({ ...user }); setSelectedUser(null) }}
                          className="p-2 rounded-lg hover:bg-[#2d3640] transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {isGod && (
                          <button
                            onClick={() => handleEditPassword(user)}
                            className="p-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                            title="Editar senha"
                          >
                            🔐
                          </button>
                        )}
                        {user.approval_status === 'approved' ? (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Suspender"
                          >
                            ⛔
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateUser(user.id)}
                            className="p-2 rounded-lg hover:bg-emerald-500/20 transition-colors"
                            title="Reativar"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">{selectedUser.name}</h3>
                  <div className="flex gap-2 items-center">
                    <p className="text-gray-500">{selectedUser.email}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getTierColor(selectedUser.tier)}`}>
                      {selectedUser.tier || 'BRONZE'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Razão Social</p>
                  <p className="text-gray-100">{selectedUser.razao_social || '-'}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Nome Fantasia</p>
                  <p className="text-gray-100">{selectedUser.company_name || selectedUser.company || '-'}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                  <p className="text-gray-100 font-mono">{selectedUser.cnpj || '-'}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Telefone</p>
                  <p className="text-gray-100">{selectedUser.phone || '-'}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Tipo de Negócio</p>
                  <p className="text-gray-100">{getBusinessTypeLabel(selectedUser.business_type)}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Forma de Pagamento</p>
                  <p className="text-gray-100 capitalize">{selectedUser.payment_preference || '-'}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Data de Cadastro</p>
                  <p className="text-gray-100">{formatDateTime(selectedUser.created_at)}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Último Login</p>
                  <p className="text-gray-100">{formatDateTime(selectedUser.last_login)}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Última Compra</p>
                  <p className="text-gray-100">{formatDateTime(selectedUser.last_purchase)}</p>
                </div>
                <div className="bg-[#0f1318] rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Gasto</p>
                  <p className="text-emerald-400 font-bold">{formatCurrency(selectedUser.total_spent || 0)}</p>
                </div>
              </div>

              {/* Address */}
              {(selectedUser.address_street || selectedUser.address?.street) && (
                <div className="pt-4 border-t border-[#2d3640]">
                  <p className="text-xs text-gray-500 mb-2">📍 Endereço de Entrega</p>
                  <div className="bg-[#0f1318] rounded-lg p-4">
                    <p className="text-gray-100">
                      {selectedUser.address_street || selectedUser.address?.street}, {selectedUser.address_number || selectedUser.address?.number}
                      {(selectedUser.address_complement || selectedUser.address?.complement) && ` - ${selectedUser.address_complement || selectedUser.address?.complement}`}
                    </p>
                    <p className="text-gray-400">
                      {selectedUser.address_neighborhood || selectedUser.address?.neighborhood} - {selectedUser.address_city || selectedUser.address?.city}/{selectedUser.address_state || selectedUser.address?.state}
                    </p>
                    <p className="text-gray-500">CEP: {selectedUser.address_cep || selectedUser.address?.cep}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#2d3640]">
                <button
                  onClick={() => { setEditingUser({ ...selectedUser }); setSelectedUser(null) }}
                  className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  ✏️ Editar Cliente
                </button>
                {selectedUser.approval_status === 'approved' ? (
                  <button
                    onClick={() => { handleSuspendUser(selectedUser.id); setSelectedUser(null) }}
                    className="py-3 px-6 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                  >
                    ⛔ Suspender
                  </button>
                ) : (
                  <button
                    onClick={() => { handleReactivateUser(selectedUser.id); setSelectedUser(null) }}
                    className="py-3 px-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
                  >
                    ✅ Reativar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-100">✏️ Editar Cliente</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Tier (Nível do Cliente)</label>
                  <select
                    value={editingUser.tier || 'bronze'}
                    onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="prata">Prata</option>
                    <option value="ouro">Ouro</option>
                    <option value="platina">Platina</option>
                    <option value="diamante">Diamante</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                  <input
                    type="text"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nome Fantasia</label>
                  <input
                    type="text"
                    value={editingUser.company_name || editingUser.company || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, company_name: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Razão Social</label>
                  <input
                    type="text"
                    value={editingUser.razao_social || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, razao_social: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CNPJ</label>
                  <input
                    type="text"
                    value={editingUser.cnpj || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cnpj: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={editingUser.ie || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, ie: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo de Negócio</label>
                  <select
                    value={editingUser.business_type || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, business_type: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="mercado">Mercado</option>
                    <option value="hortifruti">Hortifruti</option>
                    <option value="sacolao">Sacolão</option>
                    <option value="feira">Feira</option>
                    <option value="hotel">Hotel</option>
                    <option value="cozinha_industrial">Cozinha Industrial</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Forma de Pagamento Preferida</label>
                  <select
                    value={editingUser.payment_preference || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, payment_preference: e.target.value })}
                    className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="prazo">A Prazo</option>
                  </select>
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t border-[#2d3640]">
                <p className="text-sm font-medium text-gray-300 mb-3">📍 Endereço</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Rua</label>
                    <input
                      type="text"
                      value={editingUser.address_street || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_street: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Número</label>
                    <input
                      type="text"
                      value={editingUser.address_number || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_number: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Complemento</label>
                    <input
                      type="text"
                      value={editingUser.address_complement || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_complement: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Bairro</label>
                    <input
                      type="text"
                      value={editingUser.address_neighborhood || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_neighborhood: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">CEP</label>
                    <input
                      type="text"
                      value={editingUser.address_cep || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_cep: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Cidade</label>
                    <input
                      type="text"
                      value={editingUser.address_city || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_city: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Estado</label>
                    <input
                      type="text"
                      value={editingUser.address_state || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, address_state: e.target.value })}
                      className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                      maxLength={2}
                      placeholder="RJ"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2d3640] flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 rounded-lg bg-[#2d3640] text-gray-300 font-medium hover:bg-[#3d4650] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : '✅ Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Senha */}
      {viewingPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-lg">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-100">🔑 Senha do Usuário</h3>
                <p className="text-sm text-gray-400 mt-1">{viewingPassword.name} ({viewingPassword.email})</p>
              </div>
              <button onClick={() => { setViewingPassword(null); setPasswordHash('') }} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-xs text-yellow-400 mb-2">⚠️ Esta é a senha criptografada (hash). Não é possível descriptografar.</p>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Senha Criptografada (Hash)</label>
                <div className="bg-[#0f1318] border border-[#2d3640] rounded-lg p-4">
                  <code className="text-xs text-gray-300 break-all font-mono">{passwordHash || 'Carregando...'}</code>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2d3640]">
              <button
                onClick={() => { setViewingPassword(null); setPasswordHash('') }}
                className="w-full py-3 rounded-lg bg-[#2d3640] text-gray-300 font-medium hover:bg-[#3d4650] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Senha */}
      {editingPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-lg">
            <div className="p-6 border-b border-[#2d3640] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-100">🔐 Alterar Senha</h3>
                <p className="text-sm text-gray-400 mt-1">{editingPassword.name} ({editingPassword.email})</p>
              </div>
              <button onClick={() => { setEditingPassword(null); setNewPassword('') }} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-xs text-red-400 mb-2">⚠️ ATENÇÃO: Esta ação alterará a senha do usuário permanentemente!</p>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  className="w-full bg-[#0f1318] border border-[#2d3640] rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
            </div>

            <div className="p-6 border-t border-[#2d3640] flex gap-3">
              <button
                onClick={() => { setEditingPassword(null); setNewPassword('') }}
                className="flex-1 py-3 rounded-lg bg-[#2d3640] text-gray-300 font-medium hover:bg-[#3d4650] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                disabled={!newPassword || newPassword.length < 6}
                className="flex-1 py-3 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔐 Alterar Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
