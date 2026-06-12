import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { updateMarkupViaFirebase } from "../firebase/bulkUpdate";

// PONTO 4: Criamos uma interface para tipar corretamente o ID e o Nome
interface Category {
  id: string;
  name: string;
}

interface BulkMarkupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkMarkupModal: React.FC<BulkMarkupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [markupValue, setMarkupValue] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);

  // PONTO 3: Estado para lidar com a mensagem de erro (sem usar alert!)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // PONTO 5: Limpeza de state quando o modal fecha!
      setSelectedCategory("");
      setMarkupValue("");
      setErrorMessage(null);
      return;
    }

    const fetchCategories = async () => {
      try {
        // PEGANDO O USUÁRIO LOGADO
        const user = auth.currentUser;
        if (!user) {
          setErrorMessage("Você precisa estar logado.");
          return;
        }

        const categoriasQuery = query(
          collection(db, "categories"),
          where("userId", "==", user.uid),
        );

        const querySnapshot = await getDocs(categoriasQuery); // Usamos a query em vez da collection pura

        const loadedCategories: Category[] = [];
        querySnapshot.forEach((doc) => {
          loadedCategories.push({ id: doc.id, name: doc.data().name });
        });

        setCategories(loadedCategories);
      } catch (error) {
        console.error(error);
        setErrorMessage("Erro ao carregar categorias do banco.");
      }
    };

    fetchCategories();
  }, [isOpen]);

  const handleApplyMarkup = async () => {
    setErrorMessage(null); // Limpa erros anteriores

    if (!selectedCategory || !markupValue) {
      setErrorMessage(
        "Por favor, selecione uma categoria e digite um markup válido.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const updatedCount = await updateMarkupViaFirebase(
        Number(markupValue),
        selectedCategory,
      );
      onSuccess(updatedCount);
      onClose();
    } catch (error) {
      setErrorMessage("Erro grave ao atualizar preços. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Atualizar Markup em Massa</h2>

        {/* PONTO 3: Feedback visual de erro elegante */}
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <div className="mb-4">
          {/* PONTO 2: Acessibilidade com htmlFor */}
          <label
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Categoria Alvo
          </label>
          <select
            id="category-select"
            className="w-full border p-2 rounded"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isProcessing}
          >
            <option value="">Selecione...</option>
            {categories.map((cat) => (
              // PONTO 4: Usando o doc.id real do Firebase como Key
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          {/* PONTO 2: Acessibilidade com htmlFor */}
          <label
            htmlFor="markup-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Novo Markup (ex: 2.5)
          </label>
          <input
            id="markup-input"
            type="number"
            step="0.1"
            min="1"
            className="w-full border p-2 rounded"
            value={markupValue}
            onChange={(e) => setMarkupValue(parseFloat(e.target.value))}
            disabled={isProcessing}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
            onClick={handleApplyMarkup}
            disabled={isProcessing}
          >
            {isProcessing ? "Aplicando..." : "Aplicar Markup"}
          </button>
        </div>
      </div>
    </div>
  );
};
