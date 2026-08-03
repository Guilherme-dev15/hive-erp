const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializa o app do Firebase Admin uma única vez.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Atualiza as estatísticas agregadas do dashboard de um usuário.
 * Acionada sempre que um pedido é criado, atualizado ou deletado.
 */
exports.updateDashboardStats = functions
  .region('southamerica-east1')
  .firestore.document('orders/{orderId}')
  .onWrite(async (change, context) => {
    const orderId = context.params.orderId;
    console.log(`Processando mudança no pedido: ${orderId}`);

    const dataAntes = change.before.exists ? change.before.data() : null;
    const dataDepois = change.after.exists ? change.after.data() : null;

    // Se não há dados antes nem depois (caso raro), não faz nada.
    if (!dataAntes && !dataDepois) {
      console.log('Nenhum dado no pedido. Encerrando função.');
      return null;
    }

    // Determina o userId (do estado novo ou antigo)
    const userId = (dataDepois || dataAntes).userId;
    if (!userId) {
      console.log('Pedido sem userId. Não é possível atualizar estatísticas.');
      return null;
    }

    const statsRef = db.collection('dashboard_stats').doc(userId);

    // Determina o valor a ser incrementado/decrementado
    let faturamentoChange = 0;
    let pedidosChange = 0;

    const isPago = (status) =>
      ['pago', 'paid', 'approved', 'sep', 'env'].some((s) =>
        (status || '').toLowerCase().includes(s)
      );

    const statusAntes = dataAntes ? isPago(dataAntes.status) : false;
    const statusDepois = dataDepois ? isPago(dataDepois.status) : false;
    const valorAntes = dataAntes ? Number(dataAntes.total) || 0 : 0;
    const valorDepois = dataDepois ? Number(dataDepois.total) || 0 : 0;

    // Lógica de incremento/decremento
    if (statusAntes !== statusDepois) {
      // O status de pagamento mudou
      if (statusDepois) {
        // Tornou-se pago
        faturamentoChange += valorDepois;
        pedidosChange += 1;
      } else {
        // Deixou de ser pago
        faturamentoChange -= valorAntes;
        pedidosChange -= 1;
      }
    } else if (statusDepois && valorAntes !== valorDepois) {
      // O status continuou pago, mas o valor do pedido mudou
      faturamentoChange += valorDepois - valorAntes;
    } else if (!dataAntes && dataDepois && statusDepois) {
      // Pedido criado já como pago
      faturamentoChange += valorDepois;
      pedidosChange += 1;
    } else if (dataAntes && !dataDepois && statusAntes) {
      // Pedido pago foi deletado
      faturamentoChange -= valorAntes;
      pedidosChange -= 1;
    }

    if (faturamentoChange === 0 && pedidosChange === 0) {
      console.log('Nenhuma mudança relevante nas estatísticas. Encerrando.');
      return null;
    }

    console.log(
      `Mudança a ser aplicada: Faturamento: ${faturamentoChange}, Pedidos: ${pedidosChange}`
    );

    // Executa a atualização dentro de uma transação para segurança
    return db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);

      if (!statsDoc.exists) {
        // Se o documento de estatísticas não existe, cria um novo
        console.log('Documento de estatísticas não existe. Criando um novo.');
        transaction.set(statsRef, {
          totalRevenue: faturamentoChange,
          totalOrders: pedidosChange,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Se existe, atualiza os valores
        const oldRevenue = statsDoc.data().totalRevenue || 0;
        const oldOrders = statsDoc.data().totalOrders || 0;

        transaction.update(statsRef, {
          totalRevenue: oldRevenue + faturamentoChange,
          totalOrders: oldOrders + pedidosChange,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  });
