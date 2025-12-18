/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { ChevronRight, X, Filter } from 'lucide-react';
import { ProdutoCatalogo, ConfigPublica } from '../types';

interface CategoryFilterProps {
  products: ProdutoCatalogo[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectSubcategory: (sub: string | null) => void;
  config: ConfigPublica;
}

export function CategoryFilter({ 
  products, 
  selectedCategory, 
  selectedSubcategory, 
  onSelectCategory, 
  onSelectSubcategory,
  config 
}: CategoryFilterProps) {
  
  // 1. Extrai Categorias Únicas (Pai)
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter((cat): cat is string => Boolean(cat)));
    return Array.from(cats).sort();
  }, [products]);

  // 2. Extrai Subcategorias APENAS da Categoria Selecionada
  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    
    const subs = new Set(
      products
        .filter(p => p.category === selectedCategory && p.subcategory)
        .map(p => p.subcategory)
    );
    return Array.from(subs).sort();
  }, [products, selectedCategory]);

  return (
    <div className="space-y-3 mb-6">
      
      {/* NÍVEL 1: CATEGORIAS PRINCIPAIS (Scroll Horizontal) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar items-center">
        <div className="text-gray-400 mr-2">
            <Filter size={18} />
        </div>

        <button
          onClick={() => { onSelectCategory(null); onSelectSubcategory(null); }}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
            selectedCategory === null 
              ? 'text-white shadow-md transform scale-105' 
              : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
          }`}
          style={selectedCategory === null ? { backgroundColor: config.primaryColor } : {}}
        >
          Tudo
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { 
                if (selectedCategory === cat) {
                    onSelectCategory(null); 
                    onSelectSubcategory(null);
                } else {
                    onSelectCategory(cat);
                    onSelectSubcategory(null); // Reseta sub ao trocar categoria
                }
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
              selectedCategory === cat 
                ? 'text-white shadow-md transform scale-105' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
            style={selectedCategory === cat ? { backgroundColor: config.primaryColor } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* NÍVEL 2: SUBCATEGORIAS (Aparece só quando tem categoria selecionada e ela tem filhos) */}
      {selectedCategory && subcategories.length > 0 && (
        <div className="flex gap-2 items-center overflow-x-auto pb-2 animate-in slide-in-from-top-2 duration-300 pl-2">
          <div className="text-gray-300 px-1">
            <ChevronRight size={16} />
          </div>
          
          {subcategories.map((sub: any) => (
            <button
              key={sub}
              onClick={() => onSelectSubcategory(selectedSubcategory === sub ? null : sub)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all border ${
                selectedSubcategory === sub 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {sub}
            </button>
          ))}
          
          {selectedSubcategory && (
             <button 
                onClick={() => onSelectSubcategory(null)} 
                className="ml-auto text-xs text-red-400 hover:text-red-600 hover:underline px-2 flex items-center gap-1"
             >
               <X size={12}/> Limpar
             </button>
          )}
        </div>
      )}
    </div>
  );
}