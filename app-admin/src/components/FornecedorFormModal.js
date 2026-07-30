"use strict";
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
exports.FornecedorFormModal = FornecedorFormModal;
var react_1 = require("react"); // 1. Importar 'useEffect'
var react_hook_form_1 = require("react-hook-form");
var zod_1 = require("@hookform/resolvers/zod");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
var schemas_ts_1 = require("../types/schemas.ts");
// 2. Importar 'create' e 'update'
var apiService_tsx_1 = require("../services/apiService.tsx");
var FormInput = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, props = __rest(_a, ["label", "name", "register", "error"]);
    return (<div>
    <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>
    <input id={String(name)} {...props} {...register(name)} className={"mt-1 block w-full px-3 py-2 border ".concat(error ? "border-red-500" : "border-gray-300", " rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado")}/>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>);
};
var FormTextarea = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, props = __rest(_a, ["label", "name", "register", "error"]);
    return (<div>
    <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea id={String(name)} {...props} {...register(name)} className={"mt-1 block w-full px-3 py-2 border ".concat(error ? "border-red-500" : "border-gray-300", " rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado")}/>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>);
};
// ============================================================================
// Componente Principal do Modal (ATUALIZADO)
// ============================================================================
function FornecedorFormModal(_a) {
    var _b, _c, _d, _e;
    var isOpen = _a.isOpen, onClose = _a.onClose, onFornecedorSalvo = _a.onFornecedorSalvo, fornecedorParaEditar = _a.fornecedorParaEditar;
    // 6. Definir se estamos em modo de edição
    var isEditMode = !!fornecedorParaEditar;
    var _f = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_ts_1.fornecedorSchema),
    }), register = _f.register, handleSubmit = _f.handleSubmit, reset = _f.reset, _g = _f.formState, errors = _g.errors, isSubmitting = _g.isSubmitting;
    // 7. Usar 'useEffect' para preencher o formulário
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            if (isEditMode) {
                // Modo Edição: preenche o formulário com os dados
                reset(fornecedorParaEditar);
            }
            else {
                // Modo Criação: limpa o formulário
                reset({
                    name: '',
                    contactPhone: '',
                    url: '',
                    paymentTerms: '',
                });
            }
        }
    }, [isOpen, isEditMode, fornecedorParaEditar, reset]);
    // 8. Função 'onSubmit' agora decide se deve CRIAR ou ATUALIZAR
    var onSubmit = function (data) {
        var promise;
        if (isEditMode) {
            // Modo Edição: Chama 'updateFornecedor'
            promise = (0, apiService_tsx_1.updateFornecedor)(fornecedorParaEditar.id, data);
        }
        else {
            // Modo Criação: Chama 'createFornecedor'
            promise = (0, apiService_tsx_1.createFornecedor)(data);
        }
        react_hot_toast_1.toast.promise(promise, {
            loading: isEditMode ? "A atualizar fornecedor..." : "A salvar fornecedor...",
            success: function (fornecedorSalvo) {
                onFornecedorSalvo(fornecedorSalvo); // Atualiza a UI na página
                onClose(); // Fecha o modal
                return isEditMode ? "Fornecedor atualizado!" : "Fornecedor salvo!";
            },
            error: function (err) { return err.message || "Erro ao salvar."; },
        });
    };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
          <framer_motion_1.motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={function (e) { return e.stopPropagation(); }}>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              {/* 9. Título dinâmico */}
              <h2 className="text-xl font-semibold text-carvao">
                {isEditMode ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <lucide_react_1.X size={20}/>
              </button>
            </div>

            {/* Formulário (o JSX do formulário não muda) */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormInput label="Nome do Fornecedor" name="name" register={register} error={(_b = errors.name) === null || _b === void 0 ? void 0 : _b.message} placeholder="Ex: Pratas da Casa"/>

              <FormInput label="Telefone de Contato (Opcional)" name="contactPhone" register={register} error={(_c = errors.contactPhone) === null || _c === void 0 ? void 0 : _c.message} placeholder="Ex: (11) 99999-8888"/>

              <FormInput label="Site (Opcional)" name="url" type="url" register={register} error={(_d = errors.url) === null || _d === void 0 ? void 0 : _d.message} placeholder="https://..."/>
              
              <FormTextarea label="Condições de Pagamento (Opcional)" name="paymentTerms" register={register} error={(_e = errors.paymentTerms) === null || _e === void 0 ? void 0 : _e.message} rows={3} placeholder="Ex: 30/60 dias no boleto, Pix com 5% desconto..."/>

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                {/* 10. Texto do botão dinâmico */}
                <button type="submit" disabled={isSubmitting} className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50">
                  {isSubmitting ? (isEditMode ? "A atualizar..." : "A salvar...") : (isEditMode ? "Atualizar Fornecedor" : "Salvar Fornecedor")}
                </button>
              </div>
            </form>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
