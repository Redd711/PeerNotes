import React from 'react';
import type { Note } from '../types';
import { HeartIcon } from './icons/HeartIcon';

// This will be available globally from the script tag in index.html
declare var marked: {
  parse: (markdownString: string, options?: any) => string;
};


interface NoteDetailProps {
    note: Note;
    onBack: () => void;
}

const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatLikes = (likes: number): string => {
    if (likes >= 100) {
        return '100+';
    }
    if (likes < 5) {
        return likes.toString();
    }
    if (likes < 10) {
        return '5+';
    }
    if (likes < 15) {
        return '10+';
    }
    // For 15 and above, find the nearest lower boundary (15, 25, 35, ...)
    const base = Math.floor((likes - 5) / 10) * 10 + 5;
    return `${base}+`;
};

const subjectColors: { [key: string]: { header: string; text: string } } = {
    'CS333':  { header: 'bg-sky-300',    text: 'text-sky-800' },
    'CS351L': { header: 'bg-emerald-300',text: 'text-emerald-800' },
    'CS352':  { header: 'bg-teal-300',   text: 'text-teal-800' },
    'CS373':  { header: 'bg-indigo-300', text: 'text-indigo-800' },
    'CSE1':   { header: 'bg-rose-300',   text: 'text-rose-800' },
    'CSE2':   { header: 'bg-amber-300',  text: 'text-amber-800' },
    'CC311L': { header: 'bg-violet-300', text: 'text-violet-800' },
    'CC312':  { header: 'bg-cyan-300',   text: 'text-cyan-800' },
    'CS313':  { header: 'bg-orange-300', text: 'text-orange-800' },
    'DEFAULT':{ header: 'bg-slate-300',  text: 'text-slate-800' },
};

const subjectBadgeColors: { [key: string]: string } = {
    'CS333':  'bg-sky-100/80 text-sky-900 border-sky-400/50',
    'CS351L': 'bg-emerald-100/80 text-emerald-900 border-emerald-400/50',
    'CS352':  'bg-teal-100/80 text-teal-900 border-teal-400/50',
    'CS373':  'bg-indigo-100/80 text-indigo-900 border-indigo-400/50',
    'CSE1':   'bg-rose-100/80 text-rose-900 border-rose-400/50',
    'CSE2':   'bg-amber-100/80 text-amber-900 border-amber-400/50',
    'CC311L': 'bg-violet-100/80 text-violet-900 border-violet-400/50',
    'CC312':  'bg-cyan-100/80 text-cyan-900 border-cyan-400/50',
    'CS313':  'bg-orange-100/80 text-orange-900 border-orange-400/50',
    'DEFAULT':'bg-slate-100/80 text-slate-900 border-slate-400/50',
};

const getSubjectColor = (subject: string) => {
    return subjectColors[subject] || subjectColors['DEFAULT'];
};

const getSubjectBadgeColor = (subject: string) => {
    return subjectBadgeColors[subject] || subjectBadgeColors['DEFAULT'];
};

export const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack }) => {
    const colors = getSubjectColor(note.subject);
    const subjectBadgeColor = getSubjectBadgeColor(note.subject);

    const contentHtml = { __html: marked.parse(note.content || '') };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <button
                onClick={onBack}
                className="mb-6 inline-flex items-center text-slate-600 hover:text-fuchsia-600 transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 font-semibold group-hover:underline">Back to Notes</span>
            </button>

            <article className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                <header className={`p-6 ${colors.header}`}>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border inline-block ${subjectBadgeColor}`}>
                                {note.subject}
                            </span>
                            <h1 className="text-3xl font-extrabold text-slate-900 mt-3">{note.title}</h1>
                            <p className={`text-sm mt-2 opacity-80 ${colors.text}`}>Posted on {formatTimestamp(note.timestamp)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                             <div className="flex items-center justify-end flex-wrap gap-2">
                                {note.tags && note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {note.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-white/40 text-slate-800 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className={`flex items-center space-x-1 text-pink-600 bg-white/40 px-2 py-1 rounded-full`}>
                                    <HeartIcon className="w-5 h-5 fill-current" />
                                    <span className="font-bold text-md">{formatLikes(note.likes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div
                    className="p-8 prose max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={contentHtml}
                />
            </article>
        </div>
    );
};