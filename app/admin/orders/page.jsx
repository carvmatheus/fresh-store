"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"

function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  { value: 'confirmado', label: 'Confirmado', color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { value: 'em_preparacao', label: 'Em Preparação', color: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  { value: 'em_transporte', label: 'Em Transporte', color: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { value: 'concluido', label: 'Concluído', color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { value: 'cancelado', label: 'Cancelado', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400' },
  { value: 'reembolsado', label: 'Reembolsado', color: 'gray', bg: 'bg-gray-500/20', text: 'text-gray-400' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [pendingStatusChanges, setPendingStatusChanges] = useState({})
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersData, productsData, usersData] = await Promise.all([
        api.getAllOrders(),
        api.getProducts(),
        api.getUsers().catch(() => []) // Fail silently if users can't be loaded
      ])
      setOrders(ordersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      setProducts(productsData)
      // Filtra apenas usuários aprovados (pode ser is_approved ou approval_status)
      const approvedUsers = Array.isArray(usersData) 
        ? usersData.filter(u => u.approval_status === 'approved' || u.is_approved === true)
        : []
      console.log('👥 Usuários carregados:', approvedUsers.length, approvedUsers)
      setUsers(approvedUsers)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId) => {
    const newStatus = pendingStatusChanges[orderId]
    if (!newStatus) return
    
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }))
    
    try {
      await api.updateOrderStatus(orderId, newStatus)
      // Atualiza localmente
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
      // Limpa pending change
      setPendingStatusChanges(prev => {
        const updated = { ...prev }
        delete updated[orderId]
        return updated
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do pedido')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.stock || 0
  }

  const getStatusInfo = (status) => {
    // Mapeamento de valores antigos em inglês para português
    const statusMap = {
      'pending': 'pendente',
      'confirmed': 'confirmado',
      'preparing': 'em_preparacao',
      'shipped': 'em_transporte',
      'delivered': 'concluido',
      'cancelled': 'cancelado',
      'refunded': 'reembolsado',
    }
    const normalizedStatus = statusMap[status] || status
    return statusOptions.find(s => s.value === normalizedStatus) || statusOptions[0]
  }

  const formatOrderNumber = (order) => {
    // Se tiver order_number, usa ele. Senão, cria baseado na data e id
    if (order.order_number) return order.order_number
    const date = new Date(order.created_at)
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const idStr = order.id?.toString().slice(-4) || '0000'
    return `DH-${dateStr}-${idStr}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Gera HTML de nota fiscal para um pedido
  const generateInvoiceHTML = (order) => {
    const statusInfo = getStatusInfo(order.status)
    const paymentMethod = 
      order.user?.payment_preference === 'pix' ? 'PIX' :
      order.user?.payment_preference === 'boleto' ? 'Boleto Bancário' :
      order.user?.payment_preference === 'cartao' ? 'Cartão de Crédito' :
      order.user?.payment_preference === 'dinheiro' ? 'Dinheiro' :
      'A definir'
    
    // Logo URL (arquivo em /public/images/)
    const logoUrl = '/images/LOGO DAHORTA 1.png'
    
    return `
      <div class="invoice">
        <!-- Cabeçalho da Nota -->
        <div class="invoice-header">
          <div class="company-logo">
            <img src="${logoUrl}" alt="Da Horta Distribuidor" onerror="this.style.display='none'" />
          </div>
          <div class="company-info">
            <h1>DA HORTA DISTRIBUIDOR</h1>
            <p>CNPJ: 00.000.000/0001-00</p>
            <p>compredahorta.com.br</p>
          </div>
          <div class="invoice-title">
            <h2>NOTA DE VENDA</h2>
            <div class="invoice-number">${formatOrderNumber(order)}</div>
          </div>
        </div>

        <!-- Dados do Cliente -->
        <div class="client-section">
          <div class="section-title">DADOS DO CLIENTE</div>
          <div class="client-grid">
            <div class="client-field">
              <span class="field-label">Razão Social/Nome:</span>
              <span class="field-value">${order.user?.company_name || order.user?.razao_social || order.user?.name || 'Cliente'}</span>
            </div>
            ${order.user?.name && order.user?.company_name && order.user?.name !== order.user?.company_name ? `
            <div class="client-field">
              <span class="field-label">Responsável:</span>
              <span class="field-value">${order.user.name}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Endereço de Entrega -->
        ${order.shipping_address ? `
        <div class="address-section">
          <div class="section-title">ENDEREÇO DE ENTREGA</div>
          <div class="address-grid">
            <div class="address-field wide">
              <span class="field-label">Logradouro:</span>
              <span class="field-value">${order.shipping_address.street}, ${order.shipping_address.number}${order.shipping_address.complement ? ` - ${order.shipping_address.complement}` : ''}</span>
            </div>
            <div class="address-field">
              <span class="field-label">Bairro:</span>
              <span class="field-value">${order.shipping_address.neighborhood}</span>
            </div>
            <div class="address-field">
              <span class="field-label">Cidade/UF:</span>
              <span class="field-value">${order.shipping_address.city}/${order.shipping_address.state || 'RJ'}</span>
            </div>
            <div class="address-field">
              <span class="field-label">CEP:</span>
              <span class="field-value">${order.shipping_address.cep}</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Itens do Pedido -->
        <div class="items-section">
          <div class="section-title">ITENS DO PEDIDO</div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="item-num">#</th>
                <th class="item-desc">DESCRIÇÃO DO PRODUTO</th>
                <th class="item-qty">QTD</th>
                <th class="item-unit">UNIT.</th>
                <th class="item-price">VL. UNIT.</th>
                <th class="item-total">VL. TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item, idx) => `
                <tr>
                  <td class="item-num">${String(idx + 1).padStart(2, '0')}</td>
                  <td class="item-desc">${item.product?.name || item.name}</td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-unit">${item.product?.unit || 'UN'}</td>
                  <td class="item-price">${formatCurrency(item.price)}</td>
                  <td class="item-total">${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6">Sem itens</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Totais e Pagamento -->
        <div class="totals-section">
          <div class="payment-info">
            <div class="section-title">FORMA DE PAGAMENTO</div>
            <div class="payment-method">${paymentMethod}</div>
            <div class="order-date">
              <span class="field-label">Data do Pedido:</span>
              <span class="field-value">${formatDate(order.created_at)}</span>
            </div>
            <div class="order-status">
              <span class="field-label">Status:</span>
              <span class="status-badge">${statusInfo.label}</span>
            </div>
          </div>
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(order.total - (order.delivery_fee || 0))}</span>
            </div>
            <div class="total-row">
              <span>Entrega:</span>
              <span>${formatCurrency(order.delivery_fee || 0)}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <!-- Observações -->
        ${order.notes && !order.notes.includes('Contato:') ? `
        <div class="notes-section">
          <div class="section-title">OBSERVAÇÕES</div>
          <p>${order.notes}</p>
        </div>
        ` : ''}

        <!-- Rodapé -->
        <div class="invoice-footer">
          <div class="footer-line"></div>
          <p>Documento gerado em ${new Date().toLocaleString('pt-BR')} | Da Horta Distribuidor</p>
          <p class="footer-note">Este documento não possui valor fiscal. Para nota fiscal, solicite pelo WhatsApp.</p>
        </div>
      </div>
    `
  }

  // CSS para nota fiscal
  const invoiceStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; font-size: 11px; line-height: 1.4; }
    
    .invoice { 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      page-break-after: always;
    }
    .invoice:last-child { page-break-after: auto; }
    
    /* Cabeçalho */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 2px solid #1a1a1a;
      padding: 15px;
      margin-bottom: 15px;
      gap: 15px;
    }
    .company-logo {
      flex-shrink: 0;
    }
    .company-logo img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }
    .company-info { flex: 1; }
    .company-info h1 { font-size: 18px; color: #10b981; margin-bottom: 3px; }
    .company-info p { color: #666; font-size: 9px; line-height: 1.4; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 12px; color: #666; margin-bottom: 5px; }
    .invoice-number { 
      font-size: 16px; 
      font-weight: bold; 
      color: #1a1a1a;
      background: #f0fdf4;
      padding: 6px 12px;
      border: 1px solid #10b981;
    }
    
    /* Seções */
    .section-title {
      background: #1a1a1a;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
      padding: 5px 10px;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    /* Cliente */
    .client-section, .address-section { 
      border: 1px solid #ddd; 
      padding: 10px; 
      margin-bottom: 10px; 
    }
    .client-grid, .address-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .client-field, .address-field {
      display: flex;
      gap: 5px;
    }
    .address-field.wide { grid-column: span 2; }
    .field-label { font-size: 9px; color: #666; text-transform: uppercase; min-width: 80px; }
    .field-value { font-weight: 600; }
    
    /* Tabela de Itens */
    .items-section { margin-bottom: 15px; }
    .items-table { 
      width: 100%; 
      border-collapse: collapse;
      font-size: 10px;
    }
    .items-table th {
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 8px 5px;
      text-align: left;
      font-size: 9px;
      font-weight: bold;
    }
    .items-table td {
      border: 1px solid #ddd;
      padding: 6px 5px;
    }
    .item-num { width: 5%; text-align: center !important; }
    .item-desc { width: 40%; }
    .item-qty { width: 10%; text-align: center !important; font-weight: bold; font-size: 12px; }
    .item-unit { width: 10%; text-align: center !important; }
    .item-price { width: 17.5%; text-align: right !important; }
    .item-total { width: 17.5%; text-align: right !important; font-weight: bold; }
    
    /* Totais */
    .totals-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 15px;
    }
    .payment-info {
      flex: 1;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .payment-method {
      font-size: 16px;
      font-weight: bold;
      color: #10b981;
      margin: 10px 0;
    }
    .order-date, .order-status { margin-top: 8px; }
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
    }
    .totals-box {
      width: 250px;
      border: 2px solid #1a1a1a;
      padding: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px dashed #ddd;
    }
    .total-row:last-child { border-bottom: none; }
    .grand-total {
      font-size: 16px;
      font-weight: bold;
      color: #10b981;
      border-top: 2px solid #1a1a1a;
      margin-top: 5px;
      padding-top: 10px;
    }
    
    /* Observações */
    .notes-section {
      border: 1px solid #f59e0b;
      border-left: 4px solid #f59e0b;
      padding: 10px;
      margin-bottom: 15px;
      background: #fffbeb;
    }
    .notes-section p { margin-top: 5px; }
    
    /* Rodapé */
    .invoice-footer {
      text-align: center;
      color: #666;
      font-size: 9px;
      margin-top: 20px;
    }
    .footer-line {
      height: 2px;
      background: linear-gradient(to right, transparent, #10b981, transparent);
      margin-bottom: 10px;
    }
    .footer-note { font-style: italic; margin-top: 5px; }
    
    @media print {
      body { padding: 0; }
      .invoice { padding: 10px; margin: 0; }
    }
  `

  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank')
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota - ${formatOrderNumber(order)}</title>
        <style>${invoiceStyles}</style>
      </head>
      <body>
        ${generateInvoiceHTML(order)}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Imprimir múltiplos pedidos
  const handlePrintMultiple = () => {
    if (selectedOrders.length === 0) return
    
    const ordersToPrint = orders.filter(o => selectedOrders.includes(o.id))
    const printWindow = window.open('', '_blank')
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Notas de Venda (${ordersToPrint.length})</title>
        <style>${invoiceStyles}</style>
      </head>
      <body>
        ${ordersToPrint.map(order => generateInvoiceHTML(order)).join('')}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    setSelectedOrders([])
  }

  // Selecionar/deselecionar pedido
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  // Selecionar todos os pedidos filtrados
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1f26] border border-[#2d3640] rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os Status</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1f26] border border-[#2d3640] rounded-lg text-gray-400 hover:text-gray-100 hover:border-emerald-500/50 transition-colors"
          >
            🔄 Atualizar
          </button>

          {/* Botão Selecionar Todos */}
          <button
            onClick={toggleSelectAll}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              selectedOrders.length === filteredOrders.length && filteredOrders.length > 0
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-[#1a1f26] border-[#2d3640] text-gray-400 hover:text-gray-100 hover:border-emerald-500/50'
            }`}
          >
            {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? '✓' : '☐'} Selecionar Todos
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão Criar Pedido */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Novo Pedido
          </button>
          
          {/* Botão Imprimir Selecionados */}
          {selectedOrders.length > 0 && (
            <button
              onClick={handlePrintMultiple}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              🖨️ Imprimir {selectedOrders.length} Nota{selectedOrders.length > 1 ? 's' : ''}
            </button>
          )}
          <p className="text-sm text-gray-500">{filteredOrders.length} pedidos</p>
        </div>
      </div>

      {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
          <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] p-12 text-center">
            <div className="text-4xl mb-4 opacity-50">🛒</div>
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
          ) : (
            filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            const isExpanded = expandedOrder === order.id
            const currentStatus = pendingStatusChanges[order.id] || order.status
            const hasChange = pendingStatusChanges[order.id] && pendingStatusChanges[order.id] !== order.status
            const isUpdating = updatingStatus[order.id]
            
            // Contadores
            const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
            const totalProducts = order.items?.length || 0
            const address = order.shipping_address?.street || order.user?.address?.street || ''
            
            const isSelected = selectedOrders.includes(order.id)
              
              return (
              <div
                key={order.id}
                className={`bg-[#1a1f26] rounded-xl border overflow-hidden transition-colors ${
                  isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-[#2d3640]'
                }`}
              >
                {/* Card Header */}
                <div className="p-5">
                  {/* Linha 1: Checkbox, Código e Status/Valor */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox de seleção */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelectOrder(order.id)
                        }}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-500 hover:border-emerald-500'
                        }`}
                      >
                        {isSelected && <span className="text-xs">✓</span>}
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-gray-100">
                          {formatOrderNumber(order)}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          👤 {order.user?.company_name || order.user?.name || order.user?.razao_social || order.user?.email || order.customer_name || 'Cliente não identificado'} 
                          {order.user?.company_name && order.user?.name && order.user?.company_name !== order.user?.name && (
                            <span className="text-gray-500"> • {order.user?.name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-xl font-bold text-emerald-400 mt-2">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Linha 2: Resumo */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 py-3 border-y border-[#2d3640]">
                    <span>🛒 <strong className="text-gray-100">{totalItems}</strong> itens</span>
                    <span>{totalProducts} produtos</span>
                    {address && <span>📍 {address}</span>}
                  </div>

                  {/* Linha 3: Ações */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d3640] text-gray-400 hover:text-gray-100 hover:border-[#3d4650] transition-colors text-sm"
                      >
                        {isExpanded ? '▲' : '▼'} Ver Detalhes
                      </button>
                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2d3640] text-gray-400 hover:text-gray-100 hover:border-blue-500/50 transition-colors text-sm"
                        title="Imprimir pedido"
                      >
                        🖨️ Imprimir
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={currentStatus}
                        onChange={(e) => setPendingStatusChanges(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="bg-[#0f1419] border border-[#2d3640] rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 text-sm min-w-[140px]"
                      >
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => handleUpdateStatus(order.id)}
                        disabled={!hasChange || isUpdating}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          hasChange && !isUpdating
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-[#2d3640] text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isUpdating ? '...' : 'Atualizar'}
                      </button>
                    </div>
                  </div>
                              </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div className="border-t border-[#2d3640] bg-[#0f1419]/50">
                    {/* Itens do Pedido */}
                    <div className="p-5">
                      <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Itens do Pedido</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#2d3640]">
                              <th className="text-left py-2 px-2 text-gray-500 font-medium">Produto</th>
                              <th className="text-center py-2 px-2 text-gray-500 font-medium w-20">Qtd</th>
                              <th className="text-center py-2 px-2 text-gray-500 font-medium w-20">Estoque</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium w-24">Preço</th>
                              <th className="text-right py-2 px-2 text-gray-500 font-medium w-24">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items?.map((item, idx) => {
                              const stock = getProductStock(item.product_id || item.product?.id)
                              return (
                                <tr key={idx} className="border-b border-[#2d3640]/50">
                                  <td className="py-3 px-2 text-gray-100">{item.product?.name || item.name}</td>
                                  <td className="py-3 px-2 text-center font-bold text-gray-100">{item.quantity}</td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      stock >= item.quantity ? 'bg-emerald-500/20 text-emerald-400' :
                                      stock > 0 ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-red-500/20 text-red-400'
                                    }`}>
                                      {stock}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right text-gray-400">{formatCurrency(item.price)}</td>
                                  <td className="py-3 px-2 text-right font-medium text-emerald-400">{formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-[#2d3640]">
                              <td colSpan={4} className="py-3 px-2 text-right font-bold text-gray-100">Total:</td>
                              <td className="py-3 px-2 text-right font-bold text-lg text-emerald-400">{formatCurrency(order.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-t border-[#2d3640]">
                      {/* Cliente */}
                      <div className="bg-[#1a1f26] rounded-lg p-4">
                        <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Cliente</h4>
                        <p className="font-medium text-gray-100">{order.user?.name || order.user?.company_name || '-'}</p>
                        {order.user?.company_name && order.user?.company_name !== order.user?.name && (
                          <p className="text-sm text-gray-400">{order.user.company_name}</p>
                        )}
                              </div>

                      {/* Pagamento */}
                      <div className="bg-[#1a1f26] rounded-lg p-4">
                        <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Pagamento</h4>
                        <p className="font-medium text-gray-100">
                          {order.user?.payment_preference === 'pix' && '💰 PIX'}
                          {order.user?.payment_preference === 'boleto' && '📄 Boleto'}
                          {order.user?.payment_preference === 'cartao' && '💳 Cartão'}
                          {order.user?.payment_preference === 'dinheiro' && '💵 Dinheiro'}
                          {!order.user?.payment_preference && '💰 PIX'}
                        </p>
                      </div>
                      
                      {/* Endereço */}
                      {order.shipping_address && (
                        <div className="bg-[#1a1f26] rounded-lg p-4">
                          <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Entrega</h4>
                          <p className="text-sm text-gray-100">
                            {order.shipping_address.street}, {order.shipping_address.number}
                          </p>
                          <p className="text-sm text-gray-400">
                            {order.shipping_address.neighborhood} - {order.shipping_address.city}
                          </p>
                        </div>
                      )}
                        </div>

                    {/* Notas - só mostra se tiver observações relevantes */}
                    {order.notes && !order.notes.includes('Contato:') && (
                      <div className="p-5 border-t border-[#2d3640]">
                        <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase">Observações</h4>
                        <p className="text-sm text-gray-300 bg-[#1a1f26] rounded-lg p-3">{order.notes}</p>
                          </div>
                        )}
                      </div>
                )}
                    </div>
              )
            })
          )}
      </div>

      {/* Modal Criar Pedido */}
      {showCreateModal && (
        <CreateOrderModal
          users={users}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadData() }}
        />
      )}
    </div>
  )
}

// Modal para criar pedido em nome de terceiro
function CreateOrderModal({ users, products, onClose, onCreated }) {
  const [step, setStep] = useState(1) // 1: Cliente, 2: Produtos, 3: Entrega, 4: Resumo
  const [searchUser, setSearchUser] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localUsers, setLocalUsers] = useState(users || [])
  
  // Recarregar usuários quando o modal abrir
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await api.getUsers()
        const approvedUsers = Array.isArray(usersData) 
          ? usersData.filter(u => u.approval_status === 'approved' || u.is_approved === true)
          : []
        console.log('👥 Usuários carregados no modal:', approvedUsers.length)
        setLocalUsers(approvedUsers)
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        setLocalUsers(users || [])
      }
    }
    loadUsers()
  }, [])
  
  // Dados novo cliente (campos para NF)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    cnpj: '',
    ie: '', // Inscrição Estadual
    payment_preference: 'pix'
  })
  
  // Endereço
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'RJ',
    cep: ''
  })
  
  // Produtos do pedido
  const [orderItems, setOrderItems] = useState([])
  const [searchProduct, setSearchProduct] = useState('')
  
  // Notas
  const [notes, setNotes] = useState('')

  const filteredUsers = localUsers.filter(u => {
    if (!searchUser) {
      // Se não há busca, mostrar todos (limitado a 20 para performance)
      return true
    }
    const search = searchUser.toLowerCase().trim()
    const searchNumbers = searchUser.replace(/\D/g, '')
    
    // Buscar em todos os campos possíveis
    const matches = (
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.company?.toLowerCase().includes(search) ||
      u.company_name?.toLowerCase().includes(search) ||
      u.razao_social?.toLowerCase().includes(search) ||
      u.phone?.replace(/\D/g, '').includes(searchNumbers) ||
      u.cnpj?.replace(/\D/g, '').includes(searchNumbers) ||
      u.username?.toLowerCase().includes(search)
    )
    
    return matches
  })
  
  console.log('🔍 Busca:', searchUser, '| Resultados:', filteredUsers.length, '| Total usuários:', localUsers.length)

  // Mostrar todos os produtos disponíveis, filtrando apenas se houver busca
  const filteredProducts = products.filter(p => {
    // Sempre mostrar apenas produtos disponíveis
    if (p.is_active === false || p.is_available === false) return false
    
    // Se houver busca, filtrar por nome
    if (searchProduct) {
      return p.name?.toLowerCase().includes(searchProduct.toLowerCase())
    }
    
    // Sem busca, mostrar todos os disponíveis
    return true
  })

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setIsNewUser(false)
    // Preencher endereço se existir
    if (user.address_street || user.street) {
      setAddress({
        street: user.address_street || user.street || '',
        number: user.address_number || user.number || '',
        complement: user.address_complement || user.complement || '',
        neighborhood: user.address_neighborhood || user.neighborhood || '',
        city: user.address_city || user.city || '',
        state: user.address_state || user.state || 'RJ',
        cep: user.address_cep || user.cep || ''
      })
    }
  }

  const handleAddProduct = (product) => {
    const existing = orderItems.find(i => i.product_id === product.id)
    if (existing) {
      setOrderItems(prev => prev.map(i => 
        i.product_id === product.id 
          ? { ...i, quantity: i.quantity + (product.min_order || 1) }
          : i
      ))
    } else {
      setOrderItems(prev => [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.isPromo && product.promoPrice ? product.promoPrice : product.price,
        quantity: product.min_order || 1,
        unit: product.unit,
        stock: product.stock
      }])
    }
  }

  const handleUpdateQty = (productId, qty) => {
    if (qty <= 0) {
      setOrderItems(prev => prev.filter(i => i.product_id !== productId))
    } else {
      setOrderItems(prev => prev.map(i => 
        i.product_id === productId ? { ...i, quantity: qty } : i
      ))
    }
  }

  const orderTotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  const canProceedStep1 = selectedUser || (isNewUser && newUser.name && newUser.phone)
  const canProceedStep2 = orderItems.length > 0
  const canProceedStep3 = address.street && address.number && address.neighborhood && address.city

  // Funções de formatação
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length <= 5) {
      return numbers
    }
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14)
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return numbers.replace(/(\d{2})(\d)/, '$1.$2')
    } else if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3')
    } else if (numbers.length <= 12) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4')
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/, '$1.$2.$3/$4-$5')
    }
  }

  const handleViaCep = async (cepValue) => {
    const cepNumbers = cepValue?.replace(/\D/g, '') || address.cep?.replace(/\D/g, '')
    if (cepNumbers?.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
        const data = await resp.json()
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }))
        } else {
          console.warn('CEP não encontrado')
        }
      } catch (e) {
        console.error('Erro ao buscar CEP:', e)
      }
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Se novo cliente, criar primeiro
      let userId = selectedUser?.id
      if (isNewUser) {
        // Gerar username baseado no email ou nome
        const username = newUser.email 
          ? newUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
          : newUser.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) + Date.now().toString().slice(-4)
        
        const createdUser = await api.register({
          name: newUser.name,
          email: newUser.email || `${Date.now()}@manual.com`,
          username: username,
          password: Math.random().toString(36).slice(-8),
          phone: newUser.phone?.replace(/\D/g, ''), // Remove formatação
          company: newUser.company,
          cnpj: newUser.cnpj?.replace(/\D/g, ''), // Remove formatação
          ie: newUser.ie,
          payment_preference: newUser.payment_preference,
          // Endereço como objeto (formato esperado pelo backend)
          address: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            cep: address.cep?.replace(/\D/g, '') // Remove formatação
          }
        })
        userId = createdUser.user?.id
      }

      // Buscar dados do cliente para contact_info
      const clientInfo = isNewUser 
        ? { name: newUser.name, email: newUser.email || '', phone: newUser.phone?.replace(/\D/g, '') || '' }
        : selectedUser 
          ? { name: selectedUser.name || '', email: selectedUser.email || '', phone: selectedUser.phone?.replace(/\D/g, '') || '' }
          : { name: '', email: '', phone: '' }

      // Criar pedido no formato esperado pelo backend
      const orderData = {
        items: orderItems.map(item => {
          // Buscar produto completo para pegar name, unit, image
          const product = products.find(p => String(p.id) === String(item.product_id))
          return {
            product_id: String(item.product_id), // Backend espera string
            name: item.name || product?.name || 'Produto',
            quantity: Number(item.quantity),
            unit: item.unit || product?.unit || 'un',
            price: Number(item.price),
            image: product?.image || product?.image_url || null
          }
        }),
        shipping_address: {
          street: address.street,
          number: address.number,
          complement: address.complement || null,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipcode: address.cep?.replace(/\D/g, '') || '' // Backend espera zipcode, não cep
        },
        contact_info: {
          name: clientInfo.name,
          email: clientInfo.email || `${Date.now()}@manual.com`,
          phone: clientInfo.phone || '00000000000'
        },
        delivery_fee: 0, // Pode ser calculado depois se necessário
        notes: notes || `Pedido criado manualmente via painel admin`
      }

      console.log('📦 Dados do pedido:', JSON.stringify(orderData, null, 2))
      await api.createOrder(orderData)
      onCreated()
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error))
      alert('Erro ao criar pedido:\n\n' + errorMsg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f26] rounded-xl border border-[#2d3640] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#2d3640] flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-100">Criar Pedido Manual</h3>
            <p className="text-sm text-gray-500">Passo {step} de 4</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-2xl">✕</button>
        </div>

        {/* Progress */}
        <div className="px-5 py-3 border-b border-[#2d3640]">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {s}
                </div>
                <span className={`text-xs hidden sm:block ${step >= s ? 'text-gray-100' : 'text-gray-500'}`}>
                  {s === 1 ? 'Cliente' : s === 2 ? 'Produtos' : s === 3 ? 'Entrega' : 'Resumo'}
                </span>
                {s < 4 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Cliente */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => { setIsNewUser(false); setSelectedUser(null) }}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    !isNewUser ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#2d3640] hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <p className="font-medium text-gray-100">Cliente Existente</p>
                  <p className="text-xs text-gray-500">Buscar na base</p>
                </button>
                <button
                  onClick={() => { setIsNewUser(true); setSelectedUser(null) }}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    isNewUser ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#2d3640] hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">➕</div>
                  <p className="font-medium text-gray-100">Novo Cliente</p>
                  <p className="text-xs text-gray-500">Cadastrar agora</p>
                </button>
              </div>

              {!isNewUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="🔍 Buscar por nome, email, empresa, CNPJ ou telefone..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="flex-1 bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                    {localUsers.length > 0 && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {filteredUsers.length} de {localUsers.length}
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {!searchUser && (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        Digite para buscar clientes cadastrados
                      </p>
                    )}
                    {searchUser && filteredUsers.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">Nenhum cliente encontrado</p>
                        <p className="text-xs text-gray-600">Tente buscar por nome, email, empresa ou CNPJ</p>
                      </div>
                    )}
                    {filteredUsers.slice(0, 20).map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedUser?.id === user.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-[#2d3640] hover:border-gray-500 bg-[#0f1419]'
                        }`}
                      >
                        <p className="font-medium text-gray-100">{user.company_name || user.company || user.razao_social || user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.name && user.name !== (user.company_name || user.company) && <span>👤 {user.name} • </span>}
                          {user.email} {user.phone && `• ${user.phone}`}
                        </p>
                        {user.cnpj && <p className="text-xs text-gray-400">CNPJ: {user.cnpj}</p>}
                      </button>
                    ))}
                  </div>
                  {selectedUser && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-sm font-medium text-emerald-400">✓ Cliente selecionado</p>
                      <p className="text-xs text-gray-400">{selectedUser.company_name || selectedUser.company || selectedUser.name}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Nome/Razão Social *</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      onBlur={(e) => {
                        // Capitalizar primeira letra de cada palavra
                        const formatted = e.target.value
                          .toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        setNewUser({...newUser, name: formatted})
                      }}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telefone *</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setNewUser({...newUser, phone: formatted})
                      }}
                      onBlur={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setNewUser({...newUser, phone: formatted})
                      }}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                      placeholder="(21) 99999-9999"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome Fantasia/Empresa</label>
                    <input
                      type="text"
                      value={newUser.company}
                      onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                      onBlur={(e) => {
                        // Capitalizar primeira letra de cada palavra
                        const formatted = e.target.value
                          .toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        setNewUser({...newUser, company: formatted})
                      }}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={newUser.cnpj}
                      onChange={(e) => {
                        const formatted = formatCNPJ(e.target.value)
                        setNewUser({...newUser, cnpj: formatted})
                      }}
                      onBlur={(e) => {
                        const formatted = formatCNPJ(e.target.value)
                        setNewUser({...newUser, cnpj: formatted})
                      }}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={newUser.ie}
                      onChange={(e) => setNewUser({...newUser, ie: e.target.value})}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Forma de Pagamento</label>
                    <select
                      value={newUser.payment_preference}
                      onChange={(e) => setNewUser({...newUser, payment_preference: e.target.value})}
                      className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="cartao">Cartão</option>
                      <option value="dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Produtos */}
          {step === 2 && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="🔍 Buscar produto..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />

              {filteredProducts.length === 0 && searchProduct && (
                <p className="text-center text-gray-500 py-4">Nenhum produto encontrado</p>
              )}
              {filteredProducts.length > 0 && (
                <p className="text-sm text-gray-500">
                  {searchProduct ? `${filteredProducts.length} produto(s) encontrado(s)` : `${filteredProducts.length} produtos disponíveis`}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="flex items-center gap-3 p-3 bg-[#0f1419] border border-[#2d3640] rounded-lg text-left hover:border-emerald-500 transition-colors"
                  >
                    <div className="w-12 h-12 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                      {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-100 truncate">{product.name}</p>
                      <p className="text-sm text-emerald-400">{formatCurrency(product.isPromo && product.promoPrice ? product.promoPrice : product.price)}/{product.unit}</p>
                    </div>
                    <span className="text-xl">➕</span>
                  </button>
                ))}
              </div>

              {orderItems.length > 0 && (
                <div className="border-t border-[#2d3640] pt-4 mt-4">
                  <h4 className="font-medium text-gray-100 mb-3">Itens do Pedido ({orderItems.length})</h4>
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div key={item.product_id} className="flex items-center justify-between bg-[#0f1419] rounded-lg p-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-gray-100">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)}/{item.unit || 'un'} × <span className="font-bold text-emerald-400">{item.quantity} {item.unit || 'un'}</span> = {formatCurrency(item.price * item.quantity)}
                          </p>
                          {item.stock !== undefined && item.quantity > item.stock && (
                            <p className="text-xs text-amber-400 mt-1">⚠️ Estoque: {item.stock} {item.unit}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleUpdateQty(item.product_id, item.quantity - 1)} className="w-8 h-8 rounded bg-gray-700 text-gray-100 hover:bg-gray-600">−</button>
                          <span className="w-12 text-center font-bold text-gray-100">{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.product_id, item.quantity + 1)} className="w-8 h-8 rounded bg-gray-700 text-gray-100 hover:bg-gray-600">+</button>
                          <button onClick={() => handleUpdateQty(item.product_id, 0)} className="ml-2 text-red-400 hover:text-red-300">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t border-[#2d3640]">
                    <span className="font-bold text-gray-100">Total:</span>
                    <span className="text-xl font-bold text-emerald-400">{formatCurrency(orderTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Entrega */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">CEP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address.cep}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value)
                      setAddress({...address, cep: formatted})
                    }}
                    onBlur={async (e) => {
                      const formatted = formatCEP(e.target.value)
                      setAddress(prev => ({...prev, cep: formatted}))
                      // Buscar CEP quando completa 8 dígitos
                      const cepNumbers = formatted.replace(/\D/g, '')
                      if (cepNumbers.length === 8) {
                        await handleViaCep(cepNumbers)
                      }
                    }}
                    maxLength={9}
                    className="flex-1 bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                    placeholder="00000-000"
                  />
                  <button 
                    onClick={() => handleViaCep(address.cep)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    type="button"
                  >
                    🔍
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estado</label>
                <select
                  value={address.state}
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="SP">São Paulo</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="ES">Espírito Santo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Rua/Logradouro *</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({...address, street: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Número *</label>
                <input
                  type="text"
                  value={address.number}
                  onChange={(e) => setAddress({...address, number: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Complemento</label>
                <input
                  type="text"
                  value={address.complement}
                  onChange={(e) => setAddress({...address, complement: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Apt, Bloco, etc"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bairro *</label>
                <input
                  type="text"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cidade *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Observações do Pedido</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0f1419] border border-[#2d3640] rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-emerald-500"
                  rows={2}
                  placeholder="Instruções de entrega, etc..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Resumo */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#0f1419] rounded-lg p-4">
                <h4 className="font-medium text-gray-100 mb-2">👤 Cliente</h4>
                {selectedUser ? (
                  <div className="text-gray-300">
                    <p className="font-medium">{selectedUser.company || selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.phone} • {selectedUser.email}</p>
                  </div>
                ) : isNewUser && (
                  <div className="text-gray-300">
                    <p className="font-medium">{newUser.company || newUser.name}</p>
                    <p className="text-sm text-gray-500">{newUser.phone} • {newUser.email}</p>
                    {newUser.cnpj && <p className="text-xs text-gray-400">CNPJ: {newUser.cnpj}</p>}
                  </div>
                )}
              </div>

              <div className="bg-[#0f1419] rounded-lg p-4">
                <h4 className="font-medium text-gray-100 mb-2">📍 Entrega</h4>
                <p className="text-gray-300">{address.street}, {address.number}</p>
                <p className="text-sm text-gray-500">{address.neighborhood} - {address.city}/{address.state}</p>
                <p className="text-xs text-gray-400">CEP: {address.cep}</p>
              </div>

              <div className="bg-[#0f1419] rounded-lg p-4">
                <h4 className="font-medium text-gray-100 mb-2">🛒 Itens ({orderItems.length})</h4>
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.quantity}x {item.name}</span>
                      <span className="text-emerald-400">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-3 border-t border-[#2d3640]">
                  <span className="font-bold text-gray-100">Total:</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              {notes && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-amber-400 mb-1">📝 Observações</h4>
                  <p className="text-sm text-gray-300">{notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2d3640] flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
          >
            {step === 1 ? 'Cancelar' : '← Voltar'}
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? '⏳ Criando...' : '✓ Criar Pedido'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
