"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            hasError: false,
            errorInfo: ''
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        // Atualiza o state para que a próxima renderização mostre a UI alternativa
        return { hasError: true, errorInfo: error.message };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    };
    ErrorBoundary.prototype.render = function () {
        var _this = this;
        if (this.state.hasError) {
            return (<div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-white rounded-xl shadow-sm border border-red-100 mt-10">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <lucide_react_1.AlertTriangle className="text-red-500 w-10 h-10"/>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Algo correu mal.</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Houve um erro ao carregar esta página. Não se preocupe, os seus dados estão seguros.
          </p>
          
          <button onClick={function () {
                    _this.setState({ hasError: false });
                    window.location.reload();
                }} className="flex items-center gap-2 px-6 py-3 bg-carvao text-white rounded-lg hover:bg-gray-800 transition-colors">
            <lucide_react_1.RefreshCcw size={18}/>
            Recarregar Página
          </button>
          
          <div className="mt-8 p-3 bg-gray-100 rounded text-xs text-gray-500 font-mono text-left w-full max-w-lg overflow-auto">
             Erro técnico: {this.state.errorInfo}
          </div>
        </div>);
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(react_1.Component));
exports.ErrorBoundary = ErrorBoundary;
