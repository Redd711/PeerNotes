import React from 'react';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import type { Note } from '../types';
import '../styles/NoteList.css';

interface NoteListProps {
    notes: Note[];
    isLoading: boolean;
    onDeleteNote: (id: number) => void;
}

export default function NoteList({ notes, isLoading, onDeleteNote }: NoteListProps) {
    if (isLoading) {
        return (
            <div className="note-list">
                {[...Array(3)].map((_, i) => <NoteCardSkeleton key={i} />)}
            </div>
        );
    }

    if (notes.length === 0) {
        return <div className="note-list empty">No notes yet. Create one!</div>;
    }

    return (
        <div className="note-list">
            {notes.map((note) => (
                <NoteCard 
                    key={note.id} 
                    note={note} 
                    onDelete={() => onDeleteNote(note.id)}
                />
            ))}
        </div>
    );
}