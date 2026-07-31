import { collection, query, where, getDocs, writeBatch, doc, DocumentData } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

interface ProductData extends DocumentData {
    weight?: number;
    gramPrice?: number;
    costPrice?: number;
    salePrice: number;
}

export const updateMarkupViaFirebase = async (newMarkup: number, category: string): Promise<number> => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const batch = writeBatch(db);
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", category), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);

        let updatedCount = 0;
        snapshot.forEach((productDoc) => {
            const data = productDoc.data() as ProductData;
            const docRef = doc(db, "products", productDoc.id);

            let newSalePrice = data.salePrice;

            const weight = data.weight || 0;
            const gramPrice = data.gramPrice || 0;
            const costPrice = data.costPrice || 0;

            if (weight > 0 && gramPrice > 0) {
                newSalePrice = weight * gramPrice * newMarkup;
            } else if (costPrice > 0) {
                newSalePrice = costPrice * newMarkup;
            }

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


export const updateStatusEmMassa = async (productIds: string[], novoStatus: string): Promise<number> => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");
        if (productIds.length === 0) return 0;
        if (productIds.length > 500) {
            throw new Error("O limite do Firebase é de 500 atualizações por vez.");
        }

        const batch = writeBatch(db);
        productIds.forEach((id) => {
            const docRef = doc(db, "products", id);
            batch.update(docRef, {
                status: novoStatus,
                updatedAt: new Date(),
            });
        });

        await batch.commit();
        return productIds.length;
    } catch (error) {
        console.error("Falha ao atualizar status em lote:", error);
        throw error;
    }
};
