"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtiquetaImpressao = void 0;
var react_1 = require("react");
var react_qr_code_1 = require("react-qr-code");
exports.EtiquetaImpressao = (0, react_1.forwardRef)(function (_a, ref) {
    var produtos = _a.produtos, config = _a.config;
    // 🔥 URL DE PRODUÇÃO FIXA
    // Isso garante que a etiqueta funcione sempre, não importa de onde foi impressa
    var baseUrl = 'https://hive-erp.vercel.app';
    return (<div style={{ display: 'none' }}> {/* Oculto na tela, visível na impressão */}
        <div ref={ref} className="w-full bg-white p-4">
          <style type="text/css" media="print">
            {"\n              @page { size: auto; margin: 0mm; }\n              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }\n              .page-break { page-break-after: always; }\n            "}
          </style>

          {/* GRID DE ETIQUETAS */}
          <div className="grid grid-cols-3 gap-4">
            {produtos.map(function (produto) {
            // Gera o link direto para a busca no Admin de Produção
            var adminUrl = "".concat(baseUrl, "/admin/produtos?q=").concat(produto.code);
            return (<div key={produto.id} className="border border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-center h-[40mm] overflow-hidden relative break-inside-avoid">
                  {/* Nome da Loja */}
                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {(config === null || config === void 0 ? void 0 : config.storeName) || 'HIVE ERP'}
                  </div>

                  <div className="flex flex-row items-center gap-3 w-full justify-between px-2">
                    
                    {/* QR Code apontando para Produção */}
                    <div className="bg-white p-1">
                      <react_qr_code_1.default value={adminUrl} size={64} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={"0 0 256 256"}/>
                    </div>

                    {/* Dados do Produto */}
                    <div className="flex flex-col items-end text-right flex-1">
                      <h3 className="text-[10px] font-bold text-black leading-tight line-clamp-2 max-w-[120px] mb-1">
                        {produto.name}
                      </h3>
                      
                      <div className="text-[8px] font-mono text-gray-600 mb-1">
                        SKU: {produto.code}
                      </div>

                      <div className="text-sm font-black text-black">
                        R$ {Number(produto.salePrice).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Decorativo (Cinza Escuro para impressão nítida) */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#4a4a4a]"></div>
                </div>);
        })}
          </div>
        </div>
      </div>);
});
exports.EtiquetaImpressao.displayName = 'EtiquetaImpressao';
