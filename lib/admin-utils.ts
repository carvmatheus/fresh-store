// Utilitários para o Admin Dashboard

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0))
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTimeLocal(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  // Se for string, tentar extrair diretamente sem conversão de timezone
  if (typeof date === 'string') {
    // Se tem Z no final (UTC), converter para local
    if (date.endsWith('Z')) {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    // Se não tem Z, extrair diretamente (já está em horário local)
    const match = date.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
    if (match) {
      return match[1]
    }
  }
  
  // Fallback: usar conversão padrão
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return formatDate(date)
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pendente': 'Pendente',
    'confirmado': 'Confirmado',
    'em_preparacao': 'Em Preparação',
    'em_transporte': 'Em Transporte',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'reembolsado': 'Reembolsado'
  }
  return labels[status] || status
}

export function getStatusOptions(currentStatus: string, context: 'default' | 'transport' | 'separation' = 'default') {
  let options: Array<{ value: string; label: string }> = []
  
  switch (context) {
    case 'transport':
      options = [
        { value: 'em_transporte', label: 'Em Transporte' },
        { value: 'concluido', label: 'Concluído' }
      ]
      break
    case 'separation':
      options = [
        { value: 'em_preparacao', label: 'Em Preparação' },
        { value: 'em_transporte', label: 'Em Transporte' }
      ]
      break
    default:
      options = [
        { value: 'pendente', label: 'Pendente' },
        { value: 'confirmado', label: 'Confirmado' },
        { value: 'em_preparacao', label: 'Em Preparação' },
        { value: 'em_transporte', label: 'Em Transporte' },
        { value: 'concluido', label: 'Concluído' },
        { value: 'cancelado', label: 'Cancelado' },
        { value: 'reembolsado', label: 'Reembolsado' }
      ]
  }
  
  return options
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'verduras': 'Verduras',
    'vegetais': 'Vegetais',
    'frutas': 'Frutas',
    'graos': 'Grãos',
    'temperos': 'Temperos',
    'exoticos': 'Exóticos',
    'granjeiro': 'Granjeiro',
    'processados': 'Processados',
    'outros': 'Outros'
  }
  return labels[category] || category || '-'
}

export function getBusinessTypeLabel(type: string | null | undefined): string {
  const labels: Record<string, string> = {
    'hotel': '🏨 Hotel',
    'mercado': '🏪 Mercado',
    'restaurante': '🍽️ Restaurante',
    'padaria': '🥖 Padaria',
    'lanchonete': '🍔 Lanchonete',
    'bar': '🍺 Bar',
    'cafeteria': '☕ Cafeteria',
    'outros': '📦 Outros'
  }
  return labels[type || ''] || type || '-'
}

export function getPaymentPreferenceLabel(preference: string | null | undefined): string {
  const labels: Record<string, string> = {
    'pix': '💳 PIX',
    'cartao_credito': '💳 Cartão de Crédito',
    'boleto_7dias': '📄 Boleto (7 dias)',
    'boleto_10dias': '📄 Boleto (10 dias)',
    'faturamento': '📋 Faturamento'
  }
  return labels[preference || ''] || preference || '-'
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'admin': 'Administrador',
    'consultor': 'Consultor',
    'cliente': 'Cliente'
  }
  return labels[role] || role
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case 'admin': return '👑'
    case 'consultor': return '🎯'
    default: return '👤'
  }
}

export function getApprovalLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'pending': 'Pendente',
    'approved': 'Ativo',
    'suspended': 'Suspenso'
  }
  return labels[status || ''] || status || '-'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

