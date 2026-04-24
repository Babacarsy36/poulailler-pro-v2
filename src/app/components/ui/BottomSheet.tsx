import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string; // e.g. 'h-[90vh]' or 'h-auto'
}

export function BottomSheet({ isOpen, onClose, title, children, height = 'max-h-[92vh]' }: BottomSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On desktop, it behaves like a standard centered modal
  if (!isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden ${height}`}
            >
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h3 className="font-['Syne'] text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <iconify-icon icon="solar:close-circle-linear" class="text-2xl text-gray-400"></iconify-icon>
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // On mobile, it's a real Bottom Sheet
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`relative bg-white dark:bg-zinc-900 w-full rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden pb-safe ${height}`}
          >
            {/* Handle Bar */}
            <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing" onClick={onClose}>
               <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mb-2" />
               {title && <h3 className="font-['Syne'] font-bold text-gray-900 dark:text-white text-base">{title}</h3>}
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
