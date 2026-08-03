import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  getAdminProdutos,
  createAdminProduto,
  updateAdminProduto,
  deleteAdminProduto,
  importProductsBulk,
} from '../services/apiService';
import type { ProdutoAdmin, ProdutoFormData } from '../types/schemas';

export function useProducts() {
  const [products, setProducts] = useState<ProdutoAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminProdutos();
      setProducts(data);
    } catch (error) {
      toast.error('Erro ao carregar produtos.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      const newProduct = await createAdminProduto(data);
      setProducts((prev) => [newProduct, ...prev]); // Adiciona no topo da lista
      toast.success('Produto criado com sucesso!');
      return newProduct;
    } catch (error) {
      toast.error('Erro ao criar produto.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProduct = async (id: string, data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      const updatedProduct = await updateAdminProduto(id, data);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p))
      );
      toast.success('Produto atualizado!');
      return updatedProduct;
    } catch (error) {
      toast.error('Erro ao atualizar produto.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteAdminProduto(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Produto removido.');
    } catch (error) {
      toast.error('Erro ao remover produto.');
      console.error(error);
    }
  };

  const bulkImport = async (productsData: ProdutoFormData[]) => {
    setIsSubmitting(true);
    try {
      await importProductsBulk(productsData);
      toast.success('Produtos importados em massa!');
      await fetchProducts(); // Recarrega a lista após importação
    } catch (error) {
      toast.error('Erro na importação em massa.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    products,
    isLoading,
    isSubmitting,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkImport,
    refresh: fetchProducts,
  };
}
