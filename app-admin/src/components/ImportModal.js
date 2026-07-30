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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.ImportModal = ImportModal;
var react_1 = require("react"); // Removido useRef
var framer_motion_1 = require("framer-motion");
// Removido CheckCircle
var lucide_react_1 = require("lucide-react");
var XLSX = require("xlsx");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
function ImportModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess;
    var _b = (0, react_1.useState)('upload'), step = _b[0], setStep = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)([]), previewData = _d[0], setPreviewData = _d[1];
    var _e = (0, react_1.useState)([]), categories = _e[0], setCategories = _e[1];
    var _f = (0, react_1.useState)([]), suppliers = _f[0], setSuppliers = _f[1];
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            Promise.all([(0, apiService_1.getCategories)(), (0, apiService_1.getFornecedores)()]).then(function (_a) {
                var cats = _a[0], sups = _a[1];
                setCategories(cats);
                setSuppliers(sups);
            });
            setStep('upload');
            setPreviewData([]);
        }
    }, [isOpen]);
    var generateCode = function (catId, supId, currentCode) {
        var _a, _b, _c, _d;
        if (currentCode && currentCode.length > 3)
            return currentCode;
        var cat = ((_b = (_a = categories.find(function (c) { return c.id === catId; })) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.substring(0, 3).toUpperCase()) || 'GEN';
        var sup = ((_d = (_c = suppliers.find(function (s) { return s.id === supId; })) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.substring(0, 3).toUpperCase()) || 'GER';
        var random = Math.floor(100 + Math.random() * 900);
        return "".concat(cat, "-").concat(sup, "-").concat(random);
    };
    var handleFileUpload = function (e) {
        var _a;
        var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        var reader = new FileReader();
        reader.onload = function (evt) {
            var _a;
            var bstr = (_a = evt.target) === null || _a === void 0 ? void 0 : _a.result;
            var wb = XLSX.read(bstr, { type: 'binary' });
            var ws = wb.Sheets[wb.SheetNames[0]];
            var data = XLSX.utils.sheet_to_json(ws);
            var processed = data.map(function (row, index) {
                var catName = row['Categoria'] || row['category'] || '';
                var foundCat = categories.find(function (c) { return c.name.toLowerCase() === catName.toLowerCase(); });
                var supName = row['Fornecedor'] || row['supplier'] || '';
                var foundSup = suppliers.find(function (s) { return s.name.toLowerCase() === supName.toLowerCase(); });
                var catId = (foundCat === null || foundCat === void 0 ? void 0 : foundCat.id) || '';
                var supId = (foundSup === null || foundSup === void 0 ? void 0 : foundSup.id) || '';
                var initialCode = row['Código'] || row['code'] || '';
                return {
                    tempId: "row-".concat(index, "-").concat(Date.now()),
                    name: row['Nome'] || row['Produto'] || 'Sem Nome',
                    categoryId: catId,
                    supplierId: supId,
                    code: initialCode || generateCode(catId, supId, ''),
                    salePrice: Number(row['Preço Venda'] || row['salePrice'] || 0),
                    costPrice: Number(row['Custo'] || row['costPrice'] || 0),
                    quantity: Number(row['Estoque'] || row['quantity'] || 0),
                    description: row['Descrição'] || '',
                    imageUrl: row['Imagem URL'] || '',
                    isUploading: false
                };
            });
            setPreviewData(processed);
            setStep('review');
        };
        reader.readAsBinaryString(file);
    };
    var updateRow = function (id, field, value) {
        setPreviewData(function (prev) { return prev.map(function (item) {
            var _a;
            if (item.tempId !== id)
                return item;
            var updated = __assign(__assign({}, item), (_a = {}, _a[field] = value, _a));
            if (field === 'categoryId' || field === 'supplierId') {
                updated.code = generateCode(updated.categoryId, updated.supplierId, '');
            }
            return updated;
        }); });
    };
    var handleImageUpload = function (id, file) { return __awaiter(_this, void 0, void 0, function () {
        var url_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file)
                        return [2 /*return*/];
                    setPreviewData(function (prev) { return prev.map(function (p) { return p.tempId === id ? __assign(__assign({}, p), { isUploading: true }) : p; }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, apiService_1.uploadImage)(file)];
                case 2:
                    url_1 = _a.sent();
                    setPreviewData(function (prev) { return prev.map(function (p) { return p.tempId === id ? __assign(__assign({}, p), { imageUrl: url_1, isUploading: false }) : p; }); });
                    react_hot_toast_1.toast.success("Imagem anexada!");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao subir imagem.");
                    setPreviewData(function (prev) { return prev.map(function (p) { return p.tempId === id ? __assign(__assign({}, p), { isUploading: false }) : p; }); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleFinalSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var payload, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    payload = previewData.map(function (_a) {
                        var _b;
                        var tempId = _a.tempId, isUploading = _a.isUploading, rest = __rest(_a, ["tempId", "isUploading"]);
                        return (__assign(__assign({}, rest), { category: ((_b = categories.find(function (c) { return c.id === rest.categoryId; })) === null || _b === void 0 ? void 0 : _b.name) || 'Geral', supplierId: rest.supplierId }));
                    });
                    return [4 /*yield*/, (0, apiService_1.importProductsBulk)(payload)];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("".concat(payload.length, " produtos cadastrados!"));
                    onSuccess();
                    onClose();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao salvar lote.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var downloadTemplate = function () {
        var ws = XLSX.utils.json_to_sheet([{ "Nome": "Exemplo", "Código": "AUTO", "Categoria": "Anéis", "Fornecedor": "PrataPura", "Preço Venda": 90, "Custo": 30, "Estoque": 10 }]);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo");
        XLSX.writeFile(wb, "Modelo_HiveERP.xlsx");
    };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div key="modal-import-adv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <framer_motion_1.motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={"bg-white rounded-2xl shadow-xl w-full ".concat(step === 'review' ? 'max-w-6xl h-[90vh]' : 'max-w-lg', " overflow-hidden flex flex-col")}>
            {/* HEADER */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <lucide_react_1.FileSpreadsheet className="text-green-600"/> 
                {step === 'upload' ? 'Importar Excel' : "Revisar ".concat(previewData.length, " Produtos")}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500"><lucide_react_1.X size={20}/></button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-auto p-6">
              
              {/* STEP 1: UPLOAD */}
              {step === 'upload' && (<div className="space-y-6">
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 mb-2 font-bold">1. Baixe o modelo:</p>
                    <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold bg-white text-blue-600 px-3 py-2 rounded-lg border border-blue-200">
                      <lucide_react_1.Download size={14}/> DOWNLOAD MODELO .XLSX
                    </button>
                  </div>
                  <div>
                     <p className="text-sm text-gray-600 mb-2 font-bold">2. Envie o arquivo:</p>
                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                        <lucide_react_1.Upload className="text-gray-400 mb-2" size={32}/>
                        <p className="text-sm text-gray-500">Clique para selecionar Excel</p>
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload}/>
                     </label>
                  </div>
                </div>)}

              {/* STEP 2: REVIEW TABLE */}
              {step === 'review' && (<div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-3 py-2">Imagem</th>
                        <th className="px-3 py-2">Nome / Código</th>
                        <th className="px-3 py-2">Categoria</th>
                        <th className="px-3 py-2">Fornecedor</th>
                        <th className="px-3 py-2 w-24">Venda (R$)</th>
                        <th className="px-3 py-2 w-20">Estoque</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map(function (item) { return (<tr key={item.tempId} className="hover:bg-gray-50">
                          {/* Coluna Imagem */}
                          <td className="px-3 py-2">
                            <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                              {item.isUploading ? (<div className="absolute inset-0 flex items-center justify-center bg-white/80"><lucide_react_1.Loader2 className="animate-spin" size={16}/></div>) : item.imageUrl ? (<img src={item.imageUrl} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-gray-300"><lucide_react_1.Image size={20}/></div>)}
                              
                              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <lucide_react_1.Upload className="text-white" size={16}/>
                                <input type="file" className="hidden" accept="image/*" onChange={function (e) { var _a; return ((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) && handleImageUpload(item.tempId, e.target.files[0]); }}/>
                              </label>
                            </div>
                          </td>

                          {/* Nome e Código */}
                          <td className="px-3 py-2">
                            <input value={item.name} onChange={function (e) { return updateRow(item.tempId, 'name', e.target.value); }} className="w-full text-xs font-bold bg-transparent border-b border-transparent focus:border-blue-500 outline-none mb-1" placeholder="Nome do Produto"/>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <span className="font-mono">{item.code}</span>
                              {/* CORREÇÃO AQUI: RefreshCw agora dentro de um botão para aceitar o title e o onClick corretamente */}
                              <button type="button" title="Regerar Código" onClick={function () { return updateRow(item.tempId, 'code', generateCode(item.categoryId, item.supplierId, '')); }} className="text-gray-400 hover:text-blue-500 transition-colors">
                                <lucide_react_1.RefreshCw size={10}/>
                              </button>
                            </div>
                          </td>

                          {/* Categoria */}
                          <td className="px-3 py-2">
                            <select value={item.categoryId} onChange={function (e) { return updateRow(item.tempId, 'categoryId', e.target.value); }} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                              <option value="">Selecione...</option>
                              {categories.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
                            </select>
                          </td>

                          {/* Fornecedor */}
                          <td className="px-3 py-2">
                             <select value={item.supplierId} onChange={function (e) { return updateRow(item.tempId, 'supplierId', e.target.value); }} className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                              <option value="">Selecione...</option>
                              {suppliers.map(function (s) { return <option key={s.id} value={s.id}>{s.name}</option>; })}
                            </select>
                          </td>

                          {/* Preço */}
                          <td className="px-3 py-2">
                            <input type="number" step="0.01" value={item.salePrice} onChange={function (e) { return updateRow(item.tempId, 'salePrice', parseFloat(e.target.value)); }} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-right font-mono"/>
                          </td>

                           {/* Estoque */}
                           <td className="px-3 py-2">
                            <input type="number" value={item.quantity} onChange={function (e) { return updateRow(item.tempId, 'quantity', parseInt(e.target.value)); }} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-center"/>
                          </td>

                          {/* Excluir Linha */}
                          <td className="px-3 py-2 text-center">
                            <button onClick={function () { return setPreviewData(function (prev) { return prev.filter(function (p) { return p.tempId !== item.tempId; }); }); }} className="text-gray-400 hover:text-red-500">
                              <lucide_react_1.Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>); })}
                    </tbody>
                  </table>
                </div>)}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              {step === 'review' ? (<>
                  <button onClick={function () { return setStep('upload'); }} className="text-sm font-bold text-gray-500 hover:text-gray-800">Voltar</button>
                  <div className="flex gap-3">
                     <span className="text-xs text-gray-500 self-center hidden sm:block">Certifique-se de que todas as fotos foram carregadas.</span>
                     <button onClick={handleFinalSave} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                      {loading ? <lucide_react_1.Loader2 className="animate-spin" size={18}/> : <lucide_react_1.Save size={18}/>}
                      SALVAR {previewData.length} PRODUTOS
                    </button>
                  </div>
                </>) : (<button onClick={onClose} className="ml-auto px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>)}
            </div>

          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
