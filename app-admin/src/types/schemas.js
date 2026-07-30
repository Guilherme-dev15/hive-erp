"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transacaoSchema = exports.configSchema = exports.fornecedorSchema = exports.produtoSchema = void 0;
var zod_1 = require("zod");
// ============================================================================
// HELPERS (Utilitários de Validação)
// ============================================================================
// Transforma string vazia em undefined (para campos opcionais)
var emptyToUndefined = zod_1.z.literal('').transform(function () { return undefined; });
// String opcional limpa
var optionalString = zod_1.z.string().trim().optional().or(emptyToUndefined);
// URL opcional
var optionalUrl = zod_1.z.string().url("URL inválida").optional().or(emptyToUndefined);
// Validação de Cor (Hex)
var hexColor = zod_1.z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor inválida (Ex: #000000)");
// ============================================================================
// 1. PRODUTO (Product Schema)
// ============================================================================
exports.produtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nome é obrigatório").trim(),
    // Financeiro (Coerce converte "10.50" string para 10.50 number)
    costPrice: zod_1.z.coerce.number().min(0, "O custo não pode ser negativo"),
    salePrice: zod_1.z.coerce.number().min(0, "O preço de venda não pode ser negativo"),
    // Estoque
    quantity: zod_1.z.coerce.number().int().default(0),
    subcategory: zod_1.z.string().optional(),
    // Detalhes Opcionais
    code: optionalString,
    category: zod_1.z.string().min(1, "Categoria é obrigatória"), // Select retorna string
    description: optionalString,
    imageUrl: optionalString, // URL da imagem (upload retorna string)
    // Relacionamentos
    supplierId: optionalString,
    supplierProductUrl: optionalUrl,
    // Status
    status: zod_1.z.enum(['ativo', 'inativo']).default('ativo')
});
// ============================================================================
// 2. FORNECEDOR (Supplier Schema)
// ============================================================================
exports.fornecedorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nome é obrigatório").trim(),
    contactPhone: optionalString,
    email: zod_1.z.string().email("E-mail inválido").optional().or(emptyToUndefined),
    pixKey: optionalString,
    url: optionalUrl,
    paymentTerms: optionalString
});
// ============================================================================
// 3. CONFIGURAÇÃO (Config Schema)
// ============================================================================
exports.configSchema = zod_1.z.object({
    // Vendas
    whatsappNumber: zod_1.z.string().optional(),
    monthlyGoal: zod_1.z.coerce.number().min(0).optional(),
    // White-Label (Visual)
    storeName: zod_1.z.string().min(1, "Nome da loja é obrigatório"),
    primaryColor: hexColor.default('#D4AF37'),
    secondaryColor: hexColor.default('#343434'),
    banners: zod_1.z.array(zod_1.z.string()).optional(),
    // Custos Operacionais
    cardFee: zod_1.z.coerce.number().min(0).max(100).default(0),
    packagingCost: zod_1.z.coerce.number().min(0).default(0),
    // Gestão de Stock (Novo Padrão)
    lowStockThreshold: zod_1.z.coerce.number().min(0).default(5),
    // Garantia (Aceita texto ou vazio)
    warrantyText: zod_1.z.string().optional().default('')
});
// ============================================================================
// 4. TRANSAÇÃO (Transaction Schema)
// ============================================================================
exports.transacaoSchema = zod_1.z.object({
    type: zod_1.z.enum(['venda', 'despesa']),
    amount: zod_1.z.coerce.number().positive("O valor deve ser maior que zero"),
    description: zod_1.z.string().min(1, "Descrição é obrigatória"),
    date: zod_1.z.string().min(1, "Data é obrigatória"), // Input type="date" retorna string YYYY-MM-DD
    category: optionalString
});
