import { z } from 'zod';

// 1. Schema de Produto
export const produtoSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  
  costPrice: z.coerce
    .number()
    .positive("O custo deve ser um número positivo."),
    
  supplierId: z.string().min(1, "Tem de selecionar um fornecedor."),
  code: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Deve ser um URL de imagem válido.").optional().or(z.literal('')),
  supplierProductUrl: z.string().url("Deve ser um URL válido (ex: https://...)").optional().or(z.literal('')),

  quantity: z.coerce
    .number()
    .int("A quantidade deve ser um número inteiro")
    .min(0, "O stock não pode ser negativo")
    .default(0),

  salePrice: z.coerce.number().optional(),
  marginPercent: z.coerce.number().optional(),
  status: z.enum(['ativo', 'inativo']).default('ativo').optional(),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;


// 2. Schema de Fornecedor
export const fornecedorSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  url: z.string().url("Deve ser um URL válido (ex: https://...)").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  paymentTerms: z.string().optional(),
});

export type FornecedorFormData = z.infer<typeof fornecedorSchema>;


// 3. ATUALIZADO: Schema de Configurações
export const configSchema = z.object({
  whatsappNumber: z.string()
    .regex(/^[0-9]+$/, "Deve conter apenas números (ex: 55119... )")
    .min(10, "Número parece curto demais")
    .optional()
    .or(z.literal('')),
    
  monthlyGoal: z.coerce
    .number()
    .min(0, "A meta deve ser um número positivo.")
    .optional(),

  // --- NOVOS CAMPOS WHITE-LABEL ---
  storeName: z.string().min(2, "Nome da loja é obrigatório").default("Minha Loja"),
  // Validamos se é um código Hex (ex: #000000)
  primaryColor: z.string().regex(/^#/, "Deve ser um código Hex (ex: #D4AF37)").default("#D4AF37"), 
  secondaryColor: z.string().regex(/^#/, "Deve ser um código Hex (ex: #343434)").default("#343434"),
});

export type ConfigFormData = z.infer<typeof configSchema>;

//  Schema de Transação
export const transacaoSchema = z.object({
  type: z.enum(['venda', 'despesa', 'capital']),
  description: z.string(),
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  date: z.string(),
});

export type TransacaoFormData = z.infer<typeof transacaoSchema>;