import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirming?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isConfirming = false,
}) => {
    if (!isOpen) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" 
            aria-modal="true" 
            role="dialog"
            onClick={onCancel}
        >
            <div 
                className="bg-white rounded-xl shadow-xl p-6 m-4 max-w-sm w-full animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="mt-2 text-slate-600">{message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={isConfirming}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        aria-label="Cancel action"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className="px-5 py-2 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-wait transition-colors"
                        aria-label="Confirm action"
                    >
                        {isConfirming ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};