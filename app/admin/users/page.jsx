"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getAllUsers()
      // Filtrar apenas clientes aprovados
      setUsers(data.filter(u => u.approval_status === 'approved'))
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase()
    return u.name?.toLowerCase().includes(searchLower) ||
           u.company_name?.toLowerCase().includes(searchLower) ||
           u.email?.toLowerCase().includes(searchLower) ||
           u.cnpj?.includes(search)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Clientes</h2>
        <p className="text-gray-400">{users.length} clientes cadastrados</p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nome, empresa, email ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3640]">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Cliente</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">CNPJ</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Contato</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium text-sm">Cadastro</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2d3640] hover:bg-[#242b33] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">
                          🏢
                        </div>
                        <div>
                          <p className="font-medium text-gray-100">{user.company_name || user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-gray-300 text-sm">{user.cnpj || '-'}</td>
                    <td className="p-4 text-gray-300 text-sm">{user.phone || '-'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium capitalize">
                        {user.business_type || 'Não informado'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 rounded-lg bg-[#242b33] text-gray-300 hover:bg-[#2d3640] transition-colors text-sm"
                      >
                        Ver Detalhes
                      </button>
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
              <div>
                <h3 className="text-xl font-bold text-gray-100">{selectedUser.company_name || selectedUser.name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
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
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-gray-100">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Negócio</p>
                  <p className="text-gray-100 capitalize">{selectedUser.business_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Forma de Pagamento</p>
                  <p className="text-gray-100 capitalize">{selectedUser.payment_preference || '-'}</p>
                </div>
              </div>

              {selectedUser.address && (
                <div className="pt-4 border-t border-[#2d3640]">
                  <p className="text-xs text-gray-500 mb-2">Endereço de Entrega</p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
