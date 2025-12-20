import { Plus, Trash2, Box, Ruler, DollarSign } from 'lucide-react';
import { ProdutoVariante } from '../types'; // Ajuste o import conforme sua estrutura

interface VariantsManagerProps {
  variantes: ProdutoVariante[];
  onChange: (newVariantes: ProdutoVariante[]) => void;
}

export function VariantsManager({ variantes, onChange }: VariantsManagerProps) {

  // Adicionar nova linha
  const handleAdd = () => {
    const novaVariante: ProdutoVariante = {
        medida: '',
        valor_ajuste: 0,
        estoque: 1,
        sob_consulta: false,
        sku_sufixo: ''
    };
    onChange([...variantes, novaVariante]);
  };

  // Remover linha
  const handleRemove = (index: number) => {
    const novas = variantes.filter((_, i) => i !== index);
    onChange(novas);
  };

  // Editar campo
  const handleChange = (index: number, field: keyof ProdutoVariante, value: any) => {
    const novas = [...variantes];
    novas[index] = { ...novas[index], [field]: value };
    onChange(novas);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Box size={16} /> Gerenciar Variantes / Grade
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-gray-800 transition-colors"
        >
          <Plus size={14} /> Adicionar Opção
        </button>
      </div>

      {variantes.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          Este produto não possui variações. Clique em adicionar.
        </div>
      ) : (
        <div className="space-y-3">
          {variantes.map((v, index) => (
            <div key={index} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-end md:items-center">
              
              {/* Campo Medida */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block items-center gap-1">
                   <Ruler size={10} /> Medida / Nome
                </label>
                <input
                  type="text"
                  placeholder="Ex: 45cm"
                  value={v.medida}
                  onChange={(e) => handleChange(index, 'medida', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-black focus:ring-0 outline-none"
                />
              </div>

              {/* Campo Preço (AQUI VOCÊ CORRIGE O VALOR) */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block items-center gap-1">
                   <DollarSign size={10} /> Preço Final (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={v.valor_ajuste}
                  onChange={(e) => handleChange(index, 'valor_ajuste', Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 text-green-700 outline-none"
                />
              </div>

              {/* Campo Estoque */}
              <div className="w-full md:w-24">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estoque</label>
                <input
                  type="number"
                  value={v.estoque}
                  onChange={(e) => handleChange(index, 'estoque', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none text-center"
                />
              </div>

              {/* Sob Consulta */}
              <div className="flex items-center gap-2 h-10">
                 <input 
                    type="checkbox"
                    id={`check-${index}`}
                    checked={v.sob_consulta}
                    onChange={(e) => handleChange(index, 'sob_consulta', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                 />
                 <label htmlFor={`check-${index}`} className="text-xs font-bold text-gray-500 cursor-pointer select-none">
                    Sob Consulta
                 </label>
              </div>

              {/* Botão Remover */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                title="Remover variante"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}