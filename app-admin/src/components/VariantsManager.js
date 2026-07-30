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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantsManager = VariantsManager;
var lucide_react_1 = require("lucide-react");
function VariantsManager(_a) {
    var variantes = _a.variantes, onChange = _a.onChange;
    // Adicionar nova linha
    var handleAdd = function () {
        var novaVariante = {
            medida: '',
            valor_ajuste: 0,
            estoque: 1,
            sob_consulta: false,
            sku_sufixo: ''
        };
        onChange(__spreadArray(__spreadArray([], variantes, true), [novaVariante], false));
    };
    // Remover linha
    var handleRemove = function (index) {
        var novas = variantes.filter(function (_, i) { return i !== index; });
        onChange(novas);
    };
    // Editar campo
    var handleChange = function (index, field, value) {
        var _a;
        var novas = __spreadArray([], variantes, true);
        novas[index] = __assign(__assign({}, novas[index]), (_a = {}, _a[field] = value, _a));
        onChange(novas);
    };
    return (<div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <lucide_react_1.Box size={16}/> Gerenciar Variantes / Grade
        </h3>
        <button type="button" onClick={handleAdd} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-gray-800 transition-colors">
          <lucide_react_1.Plus size={14}/> Adicionar Opção
        </button>
      </div>

      {variantes.length === 0 ? (<div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          Este produto não possui variações. Clique em adicionar.
        </div>) : (<div className="space-y-3">
          {variantes.map(function (v, index) { return (<div key={index} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-end md:items-center">
              
              {/* Campo Medida */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block items-center gap-1">
                   <lucide_react_1.Ruler size={10}/> Medida / Nome
                </label>
                <input type="text" placeholder="Ex: 45cm" value={v.medida} onChange={function (e) { return handleChange(index, 'medida', e.target.value); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-black focus:ring-0 outline-none"/>
              </div>

              {/* Campo Preço (AQUI VOCÊ CORRIGE O VALOR) */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block items-center gap-1">
                   <lucide_react_1.DollarSign size={10}/> Preço Final (R$)
                </label>
                <input type="number" step="0.01" placeholder="0.00" value={v.valor_ajuste} onChange={function (e) { return handleChange(index, 'valor_ajuste', Number(e.target.value)); }} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 text-green-700 outline-none"/>
              </div>

              {/* Campo Estoque */}
              <div className="w-full md:w-24">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estoque</label>
                <input type="number" value={v.estoque} onChange={function (e) { return handleChange(index, 'estoque', Number(e.target.value)); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none text-center"/>
              </div>

              {/* Sob Consulta */}
              <div className="flex items-center gap-2 h-10">
                 <input type="checkbox" id={"check-".concat(index)} checked={v.sob_consulta} onChange={function (e) { return handleChange(index, 'sob_consulta', e.target.checked); }} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"/>
                 <label htmlFor={"check-".concat(index)} className="text-xs font-bold text-gray-500 cursor-pointer select-none">
                    Sob Consulta
                 </label>
              </div>

              {/* Botão Remover */}
              <button type="button" onClick={function () { return handleRemove(index); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Remover variante">
                <lucide_react_1.Trash2 size={16}/>
              </button>
            </div>); })}
        </div>)}
    </div>);
}
