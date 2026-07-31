export var formatCurrency = function (value) {
    var amount = value !== null && value !== void 0 ? value : 0;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
