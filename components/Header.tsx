import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-slate-100/80 backdrop-blur-lg border-b border-slate-300/50">
            <div className="container mx-auto px-4 py-4">
                <h1 className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                    PeerNotes
                </h1>
                <p className="text-center text-slate-500 mt-1">Anonymous Note Sharing.</p>
            </div>
        </header>
    );
};