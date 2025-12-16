import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 scale-100">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Delete Investment?
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">"{itemName}"</span>? 
            This action cannot be undone and will remove it from your historical data.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;