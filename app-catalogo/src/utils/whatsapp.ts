import { formatCurrency } from './format';

export interface OrderItemWhatsApp {
  name: string;
  quantity: number;
  salePrice: number;
  code?: string | null;
}

export interface BuildOrderMessageParams {
  storeName: string;
  customerName: string;
  customerPhone: string;
  items: OrderItemWhatsApp[];
  total: number;
  notes?: string;
}

/**
 * Normaliza o telefone e gera a URL de direcionamento para o WhatsApp (wa.me).
 * Adiciona DDI 55 para números brasileiros de 10 ou 11 dígitos caso ausente.
 */
export function formatWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalizedPhone =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Formata o texto do pedido estruturado para ser enviado diretamente ao WhatsApp da loja.
 */
export function buildOrderWhatsAppMessage(params: BuildOrderMessageParams): string {
  const { storeName, customerName, customerPhone, items, total, notes } = params;

  const header = `🧾 *NOVO PEDIDO - ${storeName.toUpperCase()}*\n`;
  const customer = `👤 *Cliente:* ${customerName.trim()}\n📞 *WhatsApp:* ${customerPhone.trim()}\n\n`;

  const itemsList = items
    .map((item) => {
      const codeRef = item.code ? ` (Ref: ${item.code})` : '';
      const itemSubtotal = formatCurrency(item.salePrice * item.quantity);
      return `• ${item.quantity}x ${item.name}${codeRef} — ${itemSubtotal}`;
    })
    .join('\n');

  const itemsBlock = `🛍️ *Itens do Pedido:*\n${itemsList}`;
  const totalBlock = `\n\n💰 *Total do Pedido:* ${formatCurrency(total)}`;
  const notesBlock = notes?.trim() ? `\n📝 *Observações:* ${notes.trim()}` : '';

  return `${header}${customer}${itemsBlock}${totalBlock}${notesBlock}`;
}
