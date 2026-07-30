"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
// Imports de Autenticação
var AuthContext_1 = require("./contexts/AuthContext");
var useAuth_1 = require("./hooks/useAuth");
var LoginPage_1 = require("./pages/LoginPage");
// Importa as páginas
var ProdutosPage_1 = require("./pages/ProdutosPage");
var FornecedoresPage_1 = require("./pages/FornecedoresPage");
var FinanceiroPage_1 = require("./pages/FinanceiroPage");
var DashboardPage_1 = require("./pages/DashboardPage");
var PrecificacaoPage_1 = require("./pages/PrecificacaoPage");
var ConfiguracoesPage_1 = require("./pages/ConfiguracoesPage");
var PedidosPage_1 = require("./pages/PedidosPage");
var RelatoriosPage_1 = require("./pages/RelatoriosPage");
var CuponsPage_1 = require("./pages/CuponsPage");
var EquipePage_1 = require("./pages/EquipePage");
var CampanhasPage_1 = require("./pages/CampanhasPage"); // <--- NOVA PÁGINA GLOBAL
// Importar a Proteção contra Tela Branca
var ErrorBoundary_1 = require("./components/ErrorBoundary");
// --- NAVBAR RESPONSIVA ---
function Navbar(_a) {
    var _b;
    var paginaAtual = _a.paginaAtual, onNavigate = _a.onNavigate;
    var _c = (0, useAuth_1.useAuth)(), user = _c.user, userData = _c.userData, logout = _c.logout;
    var _d = (0, react_1.useState)(false), isMobileMenuOpen = _d[0], setIsMobileMenuOpen = _d[1];
    // Configuração do Menu com Ícones e Labels
    var menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: lucide_react_1.LayoutDashboard },
        { id: 'pedidos', label: 'Pedidos', icon: lucide_react_1.ShoppingBag },
        { id: 'produtos', label: 'Produtos', icon: lucide_react_1.Package },
        { id: 'financeiro', label: 'Financeiro', icon: lucide_react_1.DollarSign },
        { id: 'campanhas', label: 'Promoções', icon: lucide_react_1.Percent }, // Novo Painel Global
        { id: 'cupons', label: 'Cupons', icon: lucide_react_1.Ticket }, // Antigo Cupons
        { id: 'relatorios', label: 'Relatórios', icon: lucide_react_1.BarChart3 },
        { id: 'fornecedores', label: 'Fornecedores', icon: lucide_react_1.Users },
        { id: 'equipe', label: 'Equipe', icon: lucide_react_1.Briefcase },
        { id: 'precificacao', label: 'Calc. Preço', icon: lucide_react_1.Calculator },
        { id: 'configuracoes', label: 'Config', icon: lucide_react_1.Settings },
    ];
    var handleMobileNavigate = function (p) {
        onNavigate(p);
        setIsMobileMenuOpen(false);
    };
    return (<nav className="bg-carvao shadow-lg mb-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* LADO ESQUERDO: Logo e Menu Desktop */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={function () { return onNavigate('dashboard'); }}>
              <div className="w-8 h-8 bg-dourado rounded-lg flex items-center justify-center text-carvao font-bold">H</div>
              <h1 className="text-xl font-bold text-dourado hidden sm:block">HIVE ERP</h1>
            </div>

            {/* Menu Desktop (Hidden em Mobile) */}
            <div className="hidden xl:ml-6 xl:flex xl:space-x-1 overflow-x-auto no-scrollbar items-center">
              {menuItems.map(function (item) { return (<button key={item.id} onClick={function () { return onNavigate(item.id); }} className={"px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5\n                    ".concat(paginaAtual === item.id
                ? 'bg-gray-800 text-dourado border-b-2 border-dourado rounded-none h-full'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white')}>
                  <item.icon size={16}/>
                  {item.label}
                </button>); })}
            </div>
          </div>

          {/* LADO DIREITO: Usuário e Toggle Mobile */}
          <div className="flex items-center ml-4 gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-gray-400">Logado como</span>
              <div className="flex items-center gap-1">
                {(userData === null || userData === void 0 ? void 0 : userData.role) === 'owner' && <lucide_react_1.Shield size={12} className="text-dourado"/>}
                <span className="text-xs text-prata font-bold">{(userData === null || userData === void 0 ? void 0 : userData.name) || ((_b = user === null || user === void 0 ? void 0 : user.email) === null || _b === void 0 ? void 0 : _b.split('@')[0])}</span>
              </div>
            </div>

            <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-900/30 transition-colors" title="Sair">
              <lucide_react_1.LogOut size={20}/>
            </button>

            {/* Botão Hambúrguer (Mobile) */}
            <button onClick={function () { return setIsMobileMenuOpen(!isMobileMenuOpen); }} className="xl:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
              {isMobileMenuOpen ? <lucide_react_1.X size={24}/> : <lucide_react_1.Menu size={24}/>}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE DROPDOWN --- */}
      <framer_motion_1.AnimatePresence>
        {isMobileMenuOpen && (<framer_motion_1.motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="xl:hidden bg-carvao border-t border-gray-700 overflow-hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map(function (item) { return (<button key={item.id} onClick={function () { return handleMobileNavigate(item.id); }} className={"block w-full text-left px-3 py-3 rounded-md text-base font-medium items-center gap-3\n                    ".concat(paginaAtual === item.id
                    ? 'bg-gray-900 text-dourado border-l-4 border-dourado'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white')}>
                  <item.icon size={18}/>
                  {item.label}
                </button>); })}
              
              <div className="border-t border-gray-700 mt-4 pt-4 px-3 pb-2">
                <div className="flex items-center">
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white flex items-center gap-2">
                      {(userData === null || userData === void 0 ? void 0 : userData.name) || 'Usuário'}
                      {(userData === null || userData === void 0 ? void 0 : userData.role) === 'owner' && <lucide_react_1.Shield size={14} className="text-dourado"/>}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user === null || user === void 0 ? void 0 : user.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </framer_motion_1.motion.div>)}
      </framer_motion_1.AnimatePresence>
    </nav>);
}
// --- CONTEÚDO PROTEGIDO ---
function ProtectedLayout() {
    var _a = (0, useAuth_1.useAuth)(), user = _a.user, loading = _a.loading;
    var _b = (0, react_1.useState)('dashboard'), pagina = _b[0], setPagina = _b[1];
    // Tratamento de QR Code
    var params = new URLSearchParams(window.location.search);
    if (params.get('q')) {
        localStorage.setItem('pending_qr_scan', params.get('q') || '');
    }
    if (loading) {
        return (<div className="min-h-screen bg-off-white flex items-center justify-center">
        <lucide_react_1.Loader2 className="animate-spin text-carvao" size={48}/>
      </div>);
    }
    if (!user) {
        return <LoginPage_1.LoginPage />;
    }
    var renderizarPagina = function () {
        switch (pagina) {
            case 'dashboard': return <DashboardPage_1.DashboardPage />;
            case 'pedidos': return <PedidosPage_1.PedidosPage />;
            case 'produtos': return <ProdutosPage_1.ProdutosPage />;
            case 'fornecedores': return <FornecedoresPage_1.FornecedoresPage />;
            case 'financeiro': return <FinanceiroPage_1.FinanceiroPage />;
            // Separação de Campanhas (Global) e Cupons (Individual)
            case 'campanhas': return <CampanhasPage_1.CampanhasPage />;
            case 'cupons': return <CuponsPage_1.CuponsPage />;
            case 'precificacao': return <PrecificacaoPage_1.PrecificacaoPage />;
            case 'relatorios': return <RelatoriosPage_1.RelatoriosPage />;
            case 'equipe': return <EquipePage_1.EquipePage />;
            case 'configuracoes': return <ConfiguracoesPage_1.ConfiguracoesPage />;
            default: return <div className="text-center py-20 text-gray-500">Página não encontrada</div>;
        }
    };
    return (<div className="min-h-screen bg-off-white">
      <Navbar paginaAtual={pagina} onNavigate={setPagina}/>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ErrorBoundary_1.ErrorBoundary key={pagina}>
          <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
            {renderizarPagina()}
          </div>
        </ErrorBoundary_1.ErrorBoundary>
      </main>
    </div>);
}
function App() {
    return (<AuthContext_1.AuthProvider>
      <react_hot_toast_1.Toaster position="top-right"/>
      <ProtectedLayout />
    </AuthContext_1.AuthProvider>);
}
