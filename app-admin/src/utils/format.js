"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = void 0;
// src/utils/format.ts
var formatCurrency = function (value) {
    var amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount))
        return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
