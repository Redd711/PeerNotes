import React, { Dispatch, SetStateAction } from 'react';
import NoteCard from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import type { Note } from '../types';
import '../styles/NoteList.css';

interface NoteListProps {
    notes: Note[];
    isLoading: boolean;
    onLike: (id: number) => Promise<void>;
    onReport: (id: number) => Promise<void>;
    onSelectNote: Dispatch<SetStateAction<number | null>>;
    likedNotes: Set<number>;
    reportedNotes: Set<number>;
}

export default function NoteList({ 
    notes, 
    isLoading, 
    onLike, 
    onReport, 
    onSelectNote,
    likedNotes,
    reportedNotes
}: NoteListProps) {
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
                    onLike={() => onLike(note.id)}
                    onReport={() => onReport(note.id)}
                    onSelectNote={() => onSelectNote(note.id)}
                    isLiked={likedNotes.has(note.id)}
                    isReported={reportedNotes.has(note.id)}
                />
            ))}
        </div>
    );
}