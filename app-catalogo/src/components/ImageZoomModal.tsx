import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function ImageZoomModal({ imageUrl, onClose }: { imageUrl: string | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}
        >
          <motion.img 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            src={imageUrl} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" 
            alt="Zoom"
          />
          <button className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/10">
            <X size={24} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}