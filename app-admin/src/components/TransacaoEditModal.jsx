"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransacaoEditModal = TransacaoEditModal;
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_1 = require("@hookform/resolvers/zod");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
var schemas_ts_1 = require("../types/schemas.ts");
var apiService_tsx_1 = require("../services/apiService.tsx");
var FormInput = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, props = __rest(_a, ["label", "name", "register", "error"]);
    return (<div>
    <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>
    <input id={String(name)} {...props} {...register(name)} className={"mt-1 block w-full px-3 py-2 border ".concat(error ? "border-red-500" : "border-gray-300", " rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado")}/>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>);
};
// ============================================================================
// Componente Principal do Modal
// ============================================================================
function TransacaoEditModal(_a) {
    var _b, _c, _d;
    var isOpen = _a.isOpen, onClose = _a.onClose, transacaoParaEditar = _a.transacaoParaEditar, onTransacaoSalva = _a.onTransacaoSalva;
    // Este hook não deve "crashar" se o seu ambiente foi corrigido
    var _e = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_ts_1.transacaoSchema),
    }), register = _e.register, handleSubmit = _e.handleSubmit, reset = _e.reset, _f = _e.formState, errors = _f.errors, isSubmitting = _f.isSubmitting;
    // 'useEffect' para preencher o formulário quando o modal abre
    (0, react_1.useEffect)(function () {
        if (transacaoParaEditar && isOpen) {
            var dataFormatada = '';
            // Lógica para lidar com datas (Timestamp do Firebase ou String)
            if (transacaoParaEditar.date && typeof transacaoParaEditar.date === 'object' && transacaoParaEditar.date.seconds) {
                // É um Timestamp, converte para "YYYY-MM-DD"
                dataFormatada = new Date(transacaoParaEditar.date.seconds * 1000)
                    .toISOString()
                    .split('T')[0];
            }
            else if (typeof transacaoParaEditar.date === 'string') {
                // É uma string (ex: "2025-11-02"), apenas a usamos
                dataFormatada = transacaoParaEditar.date.split('T')[0]; // Garante que não tem hora
            }
            reset(__assign(__assign({}, transacaoParaEditar), { date: dataFormatada, 
                // O schema espera 'amount' positivo
                amount: Math.abs(transacaoParaEditar.amount) }));
        }
    }, [isOpen, transacaoParaEditar, reset]);
    // Função 'onSubmit' para ATUALIZAR
    var onSubmit = function (data) {
        if (!transacaoParaEditar)
            return; // Segurança
        // Re-aplicamos o sinal negativo se for uma despesa
        var amountCorrigido = data.type === 'despesa'
            ? -Math.abs(data.amount)
            : Math.abs(data.amount);
        var dadosParaSalvar = __assign(__assign({}, data), { amount: amountCorrigido, date: data.date.split('T')[0] });
        var promise = (0, apiService_tsx_1.updateTransacao)(transacaoParaEditar.id, dadosParaSalvar);
        react_hot_toast_1.toast.promise(promise, {
            loading: "A atualizar transação...",
            success: function (transacaoSalva) {
                onTransacaoSalva(transacaoSalva); // Atualiza a UI na página
                onClose(); // Fecha o modal
                return "Transação atualizada!";
            },
            error: function (err) { return err.message || "Erro ao atualizar."; },
        });
    };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
          <framer_motion_1.motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={function (e) { return e.stopPropagation(); }}>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-carvao">
                Editar Transação
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <lucide_react_1.X size={20}/>
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Dropdown de Tipo */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                <select id="type" {...register("type")} className={"mt-1 block w-full px-3 py-2 border ".concat(errors.type ? "border-red-500" : "border-gray-300", " rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado")}>
                  <option value="venda">Venda</option>
                  <option value="despesa">Despesa</option>
                  <option value="capital">Injeção de Capital</option>
                </select>
                {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
              </div>

              <FormInput label="Descrição" name="description" register={register} error={(_b = errors.description) === null || _b === void 0 ? void 0 : _b.message}/>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Valor (R$)" name="amount" type="number" step="0.01" register={register} error={(_c = errors.amount) === null || _c === void 0 ? void 0 : _c.message}/>
                <FormInput label="Data" name="date" type="date" register={register} error={(_d = errors.date) === null || _d === void 0 ? void 0 : _d.message}/>
              </div>

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50">
                  {isSubmitting ? "A atualizar..." : "Atualizar Transação"}
                </button>
              </div>
            </form>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
