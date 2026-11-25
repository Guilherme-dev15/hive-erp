import { describe, it, expect } from 'vitest';
import { buildOrderWhatsAppMessage, formatWhatsAppUrl } from './whatsapp';

describe('whatsapp utils', () => {
  describe('formatWhatsAppUrl', () => {
    it('adiciona DDI 55 para telefones brasileiros de 10 ou 11 dígitos', () => {
      const url11 = formatWhatsAppUrl('11999998888', 'Olá');
      expect(url11).toBe('https://wa.me/5511999998888?text=Ol%C3%A1');

      const url10 = formatWhatsAppUrl('(11) 3333-4444', 'Teste');
      expect(url10).toBe('https://wa.me/551133334444?text=Teste');
    });

    it('preserva número que já contém DDI 55 com mais de 11 dígitos', () => {
      const url = formatWhatsAppUrl('5511999998888', 'Oi');
      expect(url).toBe('https://wa.me/5511999998888?text=Oi');
    });

    it('codifica corretamente quebras de linha e caracteres especiais', () => {
      const msg = 'Linha 1\nLinha 2 com acentuação: ação & preço R$ 10,00';
      const url = formatWhatsAppUrl('11999998888', msg);
      expect(url).toContain(encodeURIComponent(msg));
    });
  });

  describe('buildOrderWhatsAppMessage', () => {
    it('formata o pedido completo com múltiplos itens, total e observações', () => {
      const message = buildOrderWhatsAppMessage({
        storeName: 'Hive Pratas',
        customerName: 'Guilherme Macedo',
        customerPhone: '11999998888',
        items: [
          {
            name: 'Anel Solitário Prata 925',
            code: 'ANEL-01',
            quantity: 2,
            salePrice: 120,
          },
          {
            name: 'Corrente Veneziana 45cm',
            code: null,
            quantity: 1,
            salePrice: 85.5,
          },
        ],
        total: 325.5,
        notes: 'Entregar no período da tarde',
      });

      expect(message).toContain('*NOVO PEDIDO - HIVE PRATAS*');
      expect(message).toContain('Guilherme Macedo');
      expect(message).toContain('11999998888');
      expect(message).toContain('2x Anel Solitário Prata 925 (Ref: ANEL-01)');
      expect(message).toContain('1x Corrente Veneziana 45cm');
      expect(message).toContain('Entregar no período da tarde');
      expect(message).toContain('Total do Pedido:');
    });

    it('omite o bloco de observações quando não fornecido', () => {
      const message = buildOrderWhatsAppMessage({
        storeName: 'Hive Pratas',
        customerName: 'Cliente Teste',
        customerPhone: '11988887777',
        items: [
          {
            name: 'Pulseira Grumet',
            quantity: 1,
            salePrice: 150,
          },
        ],
        total: 150,
      });

      expect(message).not.toContain('Observações:');
      expect(message).toContain('Total do Pedido:');
    });
  });
});
