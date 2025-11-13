import { z } from 'zod';

// 1. Schema de Produto
export const produtoSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),

  // --- CORREÇÃO AQUI ---
  // Usamos 'z.coerce.number()' para converter a string do input
  // (ex: "50.00") para um número (ex: 50.00) antes de validar.
  costPrice: z.coerce
    .number()
    .positive("O custo deve ser um número positivo."),

  supplierId: z.string().min(1, "Tem de selecionar um fornecedor."),
  code: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Deve ser um URL de imagem válido.").optional().or(z.literal('')),
  supplierProductUrl: z.string().url("Deve ser um URL válido (ex: https://...)").optional().or(z.literal('')),

  // --- CAMPOS NOVOS (Opcionais no formulário base) ---
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


// 3. Schema de Configurações
export const configSchema = z.object({
  whatsappNumber: z.string()
    .regex(/^[0-9]+$/, "Deve conter apenas números, incluindo o código do país (ex: 55119... )")
    .min(10, "Número parece curto demais")
    .optional()
    .or(z.literal('')),

  // --- CORREÇÃO AQUI ---
  monthlyGoal: z.coerce
    .number()
    .min(0, "A meta deve ser um número positivo.")
    .optional(),
});

export type ConfigFormData = z.infer<typeof configSchema>;

//  Schema de Transação

export const transacaoSchema = z.object({
  type: z.enum(['venda', 'despesa', 'capital']),
  description: z.string(),
  amount: z.coerce
    .number()
    .positive("O valor deve ser um número positivo."), // opcional, para validar positivo
  date: z.string(),
});

export type TransacaoFormData = z.infer<typeof transacaoSchema>;
