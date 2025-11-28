import { z } from 'zod';

// ============================================================================
// HELPERS (Utilitários para validação)
// ============================================================================

// Converte string vazia para undefined (para campos opcionais funcionarem bem com o formulário)
const emptyToUndefined = z.literal('').transform(() => undefined);

// Valida URL mas aceita vazio
const optionalUrl = z.string().url("Insira uma URL válida (ex: https://...)").optional().or(emptyToUndefined);

// String opcional que remove espaços em branco extras
const optionalString = z.string().trim().optional().or(emptyToUndefined);

// Validação de Cor Hexadecimal (ex: #FFFFFF)
const hexColorSchema = (defaultColor: string) => 
  z.string()
   .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor inválida (use Hex, ex: #D4AF37)")
   .default(defaultColor);

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

  // Stock (Módulo de Controlo de Stock)
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
// 3. Schema de Configurações (White-Label & Custos)
// ============================================================================
export const configSchema = z.object({
  // Comunicação e Metas
  whatsappNumber: z.string()
    .regex(/^[0-9]+$/, "Apenas números (incluindo código país e DDD)")
    .min(10, "Número curto demais")
    .optional()
    .or(emptyToUndefined),
    
  monthlyGoal: z.coerce
    .number()
    .min(0, "A meta deve ser positiva")
    .optional(),

  // --- WHITE-LABEL (Identidade Visual) ---
  storeName: z.string().min(2, "Nome da loja é obrigatório").trim().default("Minha Loja"),
  primaryColor: hexColorSchema("#D4AF37"), 
  secondaryColor: hexColorSchema("#343434"),
  
  // Banners (Vitrine Viva)
  banners: z.array(z.string()).optional().default([]),

  // --- CUSTOS OPERACIONAIS (Calculadora de Lucro) ---
  cardFee: z.coerce
    .number()
    .min(0, "A taxa não pode ser negativa")
    .max(100, "A taxa não pode ser maior que 100%")
    .default(0), // Ex: 4.99 (%)
    
  packagingCost: z.coerce
    .number()
    .min(0, "O custo não pode ser negativo")
    .default(0), // Ex: 1.50 (R$)
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