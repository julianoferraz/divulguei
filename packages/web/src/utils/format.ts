import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return phone;
}

export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const url = `https://wa.me/${digits}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    sell: 'Vendo',
    buy: 'Compro',
    rent_offer: 'Alugo',
    rent_search: 'Procuro pra alugar',
    service: 'Serviço',
    clt: 'CLT',
    temporary: 'Temporário',
    freelance: 'Freelance',
    internship: 'Estágio',
  };
  return labels[type] || type;
}

export function typeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    sell: 'badge-blue',
    buy: 'badge-green',
    rent_offer: 'badge-orange',
    rent_search: 'badge-purple',
    service: 'badge-red',
  };
  return colors[type] || 'badge-blue';
}
