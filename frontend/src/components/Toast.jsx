import { useState, useCallback, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = useMemo(() => ({
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const variantStyles = {
  error: 'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
};

const iconLabels = {
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Info',
};

const badgeVariantMap = {
  error: 'destructive',
  success: 'success',
  warning: 'warning',
  info: 'default',
};

const icons = {
  error: 'x',
  success: '\u2713',
  warning: '!',
  info: 'i',
};

function ToastItem({ toast, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 cursor-pointer',
        variantStyles[toast.type]
      )}
      onClick={onDismiss}
      role="alert"
    >
      <Badge
        variant={badgeVariantMap[toast.type]}
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold bg-white/20 border-transparent text-white"
      >
        {icons[toast.type]}
      </Badge>
      <p className="text-sm font-medium">{toast.message}</p>
    </motion.div>
  );
}
