import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

export const updateMarkupViaFirebase = async (
  newMarkup: number,
  category: string,
) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const batch = writeBatch(db);
    const productsRef = collection(db, "products");

    // Busca restrita e segura
    const q = query(
      productsRef,
      where("category", "==", category),
      where("userId", "==", user.uid),
    );

    const snapshot = await getDocs(q);
    let updatedCount = 0;

    snapshot.forEach((productDoc) => {
      const data = productDoc.data();
      const docRef = doc(db, "products", productDoc.id);

      // Mantém o preço antigo como segurança caso nenhuma regra bata
      let newSalePrice = data.salePrice;

      // 1. Coletamos as variáveis com Fallback (Zero se não existir)
      const weight = data.weight || 0;
      const gramPrice = data.gramPrice || 0;
      const costPrice = data.costPrice || 0;

      // 2. A Inteligência de Precificação (Polimorfismo)
      if (weight > 0 && gramPrice > 0) {
        // Modelo 1: Precificação por Peso (Fabricação Própria)
        newSalePrice = weight * gramPrice * newMarkup;
      } else if (costPrice > 0) {
        // Modelo 2: Precificação por Custo Real (Terceirizados/Prontos)
        newSalePrice = costPrice * newMarkup;
      }

      // 3. Adiciona na fila de atualização
      batch.update(docRef, {
        markup: newMarkup,
        salePrice: newSalePrice,
        updatedAt: new Date(),
      });

      updatedCount++;
    });

    if (updatedCount === 0) return 0;

    await batch.commit();
    return updatedCount;
  } catch (error) {
    console.error("Falha crítica no Batch do Firestore:", error);
    throw error;
  }
};

export const updateStatusEmMassa = async (
  productIds: string[], // Agora recebemos um array com os IDs selecionados
  novoStatus: "ativo" | "inativo", // O Typescript garante que só aceitaremos essas duas palavras
) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    if (productIds.length === 0) return 0;
    if (productIds.length > 500) {
      throw new Error("O limite do Firebase é de 500 atualizações por vez.");
    }

    const batch = writeBatch(db);

    // Iteramos diretamente sobre os IDs que o React nos passou
    productIds.forEach((id) => {
      // Como já temos o ID, vamos direto no "endereço" do documento
      const docRef = doc(db, "products", id);

      // Adicionamos no lote a instrução para mudar o status
      batch.update(docRef, {
        status: novoStatus,
        updatedAt: new Date(),
      });
    });

    // Executa tudo de uma vez
    await batch.commit();
    return productIds.length;
  } catch (error) {
    console.error("Falha ao atualizar status em lote:", error);
    throw error;
  }
};
