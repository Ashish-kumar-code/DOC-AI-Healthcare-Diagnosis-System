import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalOverlay, modalContent } from '../../utils/animations';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[90vw]' };

export function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => e.key === 'Escape' && onClose?.();
      window.addEventListener('keydown', handleEsc);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div variants={modalOverlay} initial="initial" animate="animate" exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div variants={modalContent} initial="initial" animate="animate" exit="exit"
            className={`relative w-full ${SIZES[size]} bg-white border border-border rounded-2xl shadow-soft-xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}>
            {(title || showClose) && (
              <div className="flex items-center justify-between p-5 border-b border-border">
                {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
                {showClose && (
                  <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-slate-100 transition-colors" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className="p-5 max-h-[70vh] overflow-y-auto scroll-area">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
