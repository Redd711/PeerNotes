import React from 'react';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import type { Note } from '../types';

interface NoteListProps {
    notes: Note[];
    isLoading: boolean;
    onLike: (id: number) => void;
    onReport: (id: number) => void;
    onSelectNote: (id: number) => void;
    likedNotes: Set<number>;
    reportedNotes: Set<number>;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, isLoading, onLike, onReport, onSelectNote, likedNotes, reportedNotes }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <NoteCardSkeleton key={index} />
                ))}
            </div>
        );
    }
    
    if (notes.length === 0) {
        return <p className="text-center text-slate-500 mt-16">No notes found. Try adjusting your search or filter, or be the first to post!</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
                <NoteCard 
                    key={note.id} 
                    note={note} 
                    onLike={onLike} 
                    onReport={onReport}
                    onSelect={onSelectNote}
                    isLiked={likedNotes.has(note.id)}
                    isReported={reportedNotes.has(note.id)}
                />
            ))}
        </div>
    );
};