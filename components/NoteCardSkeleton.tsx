import React from 'react';

export const NoteCardSkeleton: React.FC = () => {
    return (
        <div className="border border-slate-200 rounded-lg shadow-sm p-5 flex flex-col h-full bg-white">
            <div className="animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded mb-3"></div>
                
                <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    <div className="flex items-center space-x-4">
                        <div className="h-6 w-12 bg-slate-200 rounded"></div>
                        <div className="h-6 w-6 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function NoteCardSkeleton() {
  return (
    <div className="note-card skeleton">
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
      <div className="skeleton-lines">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
      </div>
    </div>
  );
}
