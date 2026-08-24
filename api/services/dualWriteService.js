const axios = require('axios');

class DualWriteService {
  constructor() {
    this.nestApiUrl = process.env.NEST_API_URL || 'http://localhost:3005';
    this.maxRetries = 3;
    this.delays = [1000, 2000, 5000];
  }

  async syncEntity(entityType, legacyId, data) {
    const endpoint = `${this.nestApiUrl}/api/v2/${entityType}`;
    const payload = { ...data, legacyId };

    console.log(`[DUAL WRITE] Inciando sync de ${entityType} ID: ${legacyId}`);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await axios.post(endpoint, payload);
        console.log(`[DUAL WRITE] Sucesso: ${entityType} ID: ${legacyId} sincronizado no PostgreSQL.`);
        return true;
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error(`[DUAL WRITE] FALHA DEFINITIVA após ${this.maxRetries} tentativas. Entidade: ${entityType}, ID: ${legacyId}. Erro: ${error.message}`);
          return false; // Nunca bloqueia o fluxo principal
        }
        
        console.warn(`[DUAL WRITE] Falha na tentativa ${attempt + 1}. Retentando em ${this.delays[attempt]}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.delays[attempt]));
      }
    }
  }

  async syncProduct(legacyId, productData) {
    // Normalizar dados para o formato Prisma
    const data = {
      name: productData.nome || productData.name || 'Produto sem nome',
      salePrice: productData.preco || productData.salePrice || 0,
      quantity: productData.estoque || productData.quantity || 0,
      status: productData.ativo === false ? 'INATIVO' : 'ATIVO',
    };
    return this.syncEntity('products', legacyId, data);
  }

  async syncOrder(legacyId, orderData) {
     // Normalizar dados para o formato Prisma
    const data = {
      customerName: orderData.cliente_nome || orderData.customerName || 'Cliente sem nome',
      total: orderData.total || 0,
      status: this.mapOrderStatus(orderData.status),
    };
    return this.syncEntity('orders', legacyId, data);
  }
  
  mapOrderStatus(firebaseStatus) {
    const statusMap = {
      'pendente': 'AGUARDANDO_PAGAMENTO',
      'pago': 'EM_PRODUCAO',
      'enviado': 'ENVIADO',
      'entregue': 'CONCLUIDO',
      'cancelado': 'CANCELADO'
    };
    return statusMap[firebaseStatus?.toLowerCase()] || 'AGUARDANDO_PAGAMENTO';
  }
}

module.exports = new DualWriteService();
