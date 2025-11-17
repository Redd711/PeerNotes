import React from 'react';
import type { Toast as ToastType } from '../types';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="bg-slate-800 text-white rounded-lg shadow-2xl p-4 flex items-center animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{message}</span>
    </div>
  );
};


interface ToastContainerProps {
  toasts: ToastType[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} />
      ))}
    </div>
  );
};
