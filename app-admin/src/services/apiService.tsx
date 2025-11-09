import axios from 'axios';

// 1. Importar TODOS os tipos de dados de 'index'
import type { 
  ProdutoAdmin, 
  Fornecedor, 
  Transacao, 
  DashboardStats,
  Category
} from '../types/index.ts'; // Remova as extensões .ts

// 2. Importar TODOS os tipos de formulário de 'schemas'
import type { 
  ProdutoFormData, 
  FornecedorFormData, 
  ConfigFormData, 
  TransacaoFormData // 3. Importar o TransacaoFormData que faltava
} from '../types/schemas.ts'; // Remova as extensões .ts


// ============================================================================
// Configuração da API
// ============================================================================
// A URL da API virá de uma Variável de Ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interface para as Configurações (que inclui os campos do form)
export interface AppConfig extends ConfigFormData {
  productCounter?: number;
  split?: { net: number, reinvest: number, ops: number };
}



/* ADICIONE ESTA INTERFACE E A FUNÇÃO
export interface NamerResult {
  descricao: string;
  nome_sugerido: string;
}

export const generateNameFromImage = async (
  imageDataBase64: string, 
  imageMimeType: string
): Promise<NamerResult> => {
  const response = await apiClient.post('/admin/generate-name', {
    imageDataBase64,
    imageMimeType
  });
  return response.data;
};

*/
// ============================================================================
// Módulo: Dashboard
// ============================================================================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/admin/dashboard-stats');
  return response.data;
};

// ============================================================================
// Módulo: Produtos
// ============================================================================
export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => {
  const response = await apiClient.get('/admin/produtos');
  return response.data;
};

export const createAdminProduto = async (produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.post('/admin/produtos', produto);
  return response.data;
};

export const updateAdminProduto = async (id: string, produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.put(`/admin/produtos/${id}`, produto);
  return response.data;
};

export const deleteAdminProduto = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/produtos/${id}`);
};

// ============================================================================
// Módulo: Fornecedores
// ============================================================================
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const response = await apiClient.get('/admin/fornecedores');
  return response.data;
};

export const createFornecedor = async (fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.post('/admin/fornecedores', fornecedor);
  return response.data;
};

export const updateFornecedor = async (id: string, fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.put(`/admin/fornecedores/${id}`, fornecedor);
  return response.data;
};

export const deleteFornecedor = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/fornecedores/${id}`);
};

// ============================================================================
// Módulo: Transações
// ============================================================================
export const getTransacoes = async (): Promise<Transacao[]> => {
  const response = await apiClient.get('/admin/transacoes');
  return response.data;
};

export const createTransacao = async (transacao: Omit<Transacao, 'id'>): Promise<Transacao> => {
  const response = await apiClient.post('/admin/transacoes', transacao);
  return response.data;
};

// Função de Update que faltava
export const updateTransacao = async (id: string, transacao: TransacaoFormData): Promise<Transacao> => {
  const response = await apiClient.put(`/admin/transacoes/${id}`, transacao);
  return response.data;
};

export const deleteTransacao = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/transacoes/${id}`);
};

// ============================================================================
// Módulo: Configurações
// ============================================================================
export const getConfig = async (): Promise<AppConfig> => {
  const response = await apiClient.get('/admin/config');
  return response.data;
};

export const saveConfig = async (config: ConfigFormData): Promise<AppConfig> => {
  const response = await apiClient.post('/admin/config', config);
  return response.data;
};

// ============================================================================
// Módulo: Categorias
// ============================================================================
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/admin/categories');
  return response.data;
};

export const createCategory = async (data: { name: string }): Promise<Category> => {
  const response = await apiClient.post('/admin/categories', data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`);
};