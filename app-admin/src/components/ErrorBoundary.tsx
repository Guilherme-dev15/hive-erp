import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI alternativa
    return { hasError: true, errorInfo: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-white rounded-xl shadow-sm border border-red-100 mt-10">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <AlertTriangle className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Algo correu mal.</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Houve um erro ao carregar esta página. Não se preocupe, os seus dados estão seguros.
          </p>
          
          <button
            onClick={() => {
                this.setState({ hasError: false });
                window.location.reload(); 
            }}
            className="flex items-center gap-2 px-6 py-3 bg-carvao text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCcw size={18} />
            Recarregar Página
          </button>
          
          <div className="mt-8 p-3 bg-gray-100 rounded text-xs text-gray-500 font-mono text-left w-full max-w-lg overflow-auto">
             Erro técnico: {this.state.errorInfo}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}