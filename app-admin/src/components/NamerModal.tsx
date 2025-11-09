import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, Gem, UploadCloud, Loader2, Wand2 } from 'lucide-react';
import { generateNameFromImage, type NamerResult } from '../services/apiService';

interface NamerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Função para enviar o nome e a descrição de volta para o formulário
  onNameGenerated: (name: string, description: string) => void;
}

export function NamerModal({ isOpen, onClose, onNameGenerated }: NamerModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NamerResult | null>(null);

  // Lida com a seleção da imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      resetState();
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato inválido. Use PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB
      setError('Imagem muito grande (Max. 10MB).');
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const resetState = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setLoading(false);
    setError(null);
    setResult(null);
  };

  // Converte o ficheiro para Base64
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]); // Remove o prefixo
    reader.onerror = error => reject(error);
  });

  // Lida com a chamada à API
  const handleGenerate = async () => {
    if (!imageFile) {
      setError("Por favor, carregue uma imagem primeiro.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageDataBase64 = await toBase64(imageFile);
      const imageMimeType = imageFile.type;
      
      const apiResult = await generateNameFromImage(imageDataBase64, imageMimeType);
      
      setResult(apiResult);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Erro desconhecido ao gerar nome.");
      toast.error("Falha ao gerar nome.");
    } finally {
      setLoading(false);
    }
  };

  // Lida com o clique em "Usar este nome"
  const handleUseName = () => {
    if (result) {
      onNameGenerated(result.nome_sugerido, result.descricao);
      handleClose(); // Fecha o modal
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // z-index 60 para ficar SOBRE o modal de produto (z-50)
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-carvao flex items-center">
                <Gem size={20} className="text-blue-600 mr-2" />
                Nomeador de Joias (IA)
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-6">
              <input
                id="imageUpload"
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
              />
              <label
                htmlFor="imageUpload"
                className="w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center block hover:bg-gray-50 transition-colors"
              >
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Clique para carregar</span> ou arraste
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, ou WEBP (Max. 10MB)</p>
              </label>

              {previewUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pré-visualização:</p>
                  <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg bg-gray-100 border" />
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all hover:bg-blue-700 disabled:opacity-50"
                  disabled={!imageFile || loading}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-2" />
                      Identificar e Nomear
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-100 border border-red-300 text-red-800 rounded-lg p-3 text-center">
                  {error}
                </div>
              )}

              {result && (
                <motion.div 
                  className="mt-6 result-card bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Descrição da IA</h3>
                    <p className="text-gray-800">{result.descricao}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome Sugerido</h3>
                    <p className="text-2xl font-bold text-blue-700">{result.nome_sugerido}</p>
                  </div>
                  <button
                    onClick={handleUseName}
                    className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Usar este Nome e Descrição
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}