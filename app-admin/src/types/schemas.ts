import { z } from 'zod';

// ============================================================================
// HELPERS (Utilitários para evitar repetição)
// ============================================================================

// Aceita string vazia ou undefined (útil para campos opcionais de formulário)
const emptyToUndefined = z.literal('').transform(() => undefined);

// Valida URL mas aceita vazio
const optionalUrl = z.string().url("Insira uma URL válida (ex: https://...)").optional().or(emptyToUndefined);

// String opcional que remove espaços em branco extras
const optionalString = z.string().trim().optional().or(emptyToUndefined);

// ============================================================================
// 1. Schema de Produto
// ============================================================================
export const produtoSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres.").trim(),
  
  costPrice: z.coerce
    .number({ invalid_type_error: "O custo é obrigatório." })
    .positive("O custo deve ser um número positivo."),
    
  supplierId: z.string().min(1, "Selecione um fornecedor."),
  
  code: optionalString,
  category: optionalString,
  description: optionalString,
  
  // URLs
  imageUrl: optionalUrl,
  supplierProductUrl: optionalUrl,

  // Stock
  quantity: z.coerce
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(0, "O stock não pode ser negativo.")
    .default(0),

  // Precificação e Status
  salePrice: z.coerce.number().optional(),
  marginPercent: z.coerce.number().optional(),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;


// ============================================================================
// 2. Schema de Fornecedor
// ============================================================================
export const fornecedorSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres.").trim(),
  url: optionalUrl,
  contactPhone: optionalString,
  paymentTerms: optionalString,
});

export type FornecedorFormData = z.infer<typeof fornecedorSchema>;


// ============================================================================
// 3. Schema de Configurações (White-Label)
// ============================================================================
export const configSchema = z.object({
  whatsappNumber: z.string()
    .regex(/^[0-9]+$/, "Apenas números (incluindo código país e DDD)")
    .min(10, "Número curto demais (mínimo 10 dígitos)")
    .optional()
    .or(emptyToUndefined),
    
  monthlyGoal: z.coerce
    .number()
    .min(0, "A meta deve ser positiva")
    .optional(),

  // --- CAMPOS WHITE-LABEL ---
  storeName: z.string().min(2, "Nome da loja é obrigatório").trim().default("Minha Loja"),
  
  // Validação de Cor Hexadecimal
  primaryColor: z.string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor inválida (ex: #D4AF37)")
    .default("#D4AF37"), 
    
  secondaryColor: z.string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor inválida (ex: #343434)")
    .default("#343434"),
});

export type ConfigFormData = z.infer<typeof configSchema>;


// ============================================================================
// 4. Schema de Transação
// ============================================================================
export const transacaoSchema = z.object({
  type: z.enum(['venda', 'despesa', 'capital']),
  description: z.string().min(1, "Descrição é obrigatória").trim(),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.string().min(1, "Data é obrigatória"),
});

export type TransacaoFormData = z.infer<typeof transacaoSchema>;