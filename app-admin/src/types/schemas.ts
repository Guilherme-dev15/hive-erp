import { z } from 'zod';

// ============================================================================
// HELPERS (Utilitários de Validação)
// ============================================================================

// Transforma string vazia em undefined (para campos opcionais)
const emptyToUndefined = z.literal('').transform(() => undefined);

// String opcional limpa
const optionalString = z.string().trim().optional().or(emptyToUndefined);

// URL opcional
const optionalUrl = z.string().url("URL inválida").optional().or(emptyToUndefined);

// Validação de Cor (Hex)
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor inválida (Ex: #000000)");

// ============================================================================
// 1. PRODUTO (Product Schema)
// ============================================================================
export const produtoSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").trim(),
  
  // Financeiro (Coerce converte "10.50" string para 10.50 number)
  costPrice: z.coerce.number().min(0, "O custo não pode ser negativo"),
  salePrice: z.coerce.number().min(0, "O preço de venda não pode ser negativo"),
  
  // Estoque
  quantity: z.coerce.number().int().default(0),
  
  // Detalhes Opcionais
  code: optionalString,
  category: z.string().min(1, "Categoria é obrigatória"), // Select retorna string
  description: optionalString,
  imageUrl: optionalString, // URL da imagem (upload retorna string)
  
  // Relacionamentos
  supplierId: optionalString,
  supplierProductUrl: optionalUrl,
  
  // Status
  status: z.enum(['ativo', 'inativo']).default('ativo')
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;


// ============================================================================
// 2. FORNECEDOR (Supplier Schema)
// ============================================================================
export const fornecedorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").trim(),
  contactPhone: optionalString,
  email: z.string().email("E-mail inválido").optional().or(emptyToUndefined),
  pixKey: optionalString,
  url: optionalUrl,
  paymentTerms: optionalString
});

export type FornecedorFormData = z.infer<typeof fornecedorSchema>;


// ============================================================================
// 3. CONFIGURAÇÃO (Config Schema)
// ============================================================================
export const configSchema = z.object({
  // Vendas
  whatsappNumber: z.string().optional(),
  monthlyGoal: z.coerce.number().min(0).optional(),
  
  // White-Label (Visual)
  storeName: z.string().min(1, "Nome da loja é obrigatório"),
  primaryColor: hexColor.default('#D4AF37'),
  secondaryColor: hexColor.default('#343434'),
  banners: z.array(z.string()).optional(),
  
  // Custos Operacionais
  cardFee: z.coerce.number().min(0).max(100).default(0),
  packagingCost: z.coerce.number().min(0).default(0),
  
  // Gestão de Stock (Novo Padrão)
  lowStockThreshold: z.coerce.number().min(0).default(5),
  
  // Garantia (Aceita texto ou vazio)
  warrantyText: z.string().optional().default('')
});

export type ConfigFormData = z.infer<typeof configSchema>;


// ============================================================================
// 4. TRANSAÇÃO (Transaction Schema)
// ============================================================================
export const transacaoSchema = z.object({
  type: z.enum(['venda', 'despesa']),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"), // Input type="date" retorna string YYYY-MM-DD
  category: optionalString
});

export type TransacaoFormData = z.infer<typeof transacaoSchema>;