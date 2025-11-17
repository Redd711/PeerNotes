import React from 'react';
import type { Note } from '../types';
import { HeartIcon } from './icons/HeartIcon';
import { FlagIcon } from './icons/FlagIcon';

interface NoteCardProps {
  note: Note;
  onLike: () => Promise<void>;
  onReport: () => Promise<void>;
  onSelectNote: () => void;
  isLiked: boolean;
  isReported: boolean;
}

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
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

const subjectColors: { [key: string]: { bg: string; header: string; border: string; } } = {
  'CS333':  { bg: 'bg-sky-100/60',    header: 'bg-sky-300',    border: 'border-sky-300' },
  'CS351L': { bg: 'bg-emerald-100/60', header: 'bg-emerald-300', border: 'border-emerald-300' },
  'CS352':  { bg: 'bg-teal-100/60',    header: 'bg-teal-300',    border: 'border-teal-300' },
  'CS373':  { bg: 'bg-indigo-100/60',  header: 'bg-indigo-300',  border: 'border-indigo-300' },
  'CSE1':   { bg: 'bg-rose-100/60',    header: 'bg-rose-300',    border: 'border-rose-300' },
  'CSE2':   { bg: 'bg-amber-100/60',   header: 'bg-amber-300',   border: 'border-amber-300' },
  'CC311L': { bg: 'bg-violet-100/60',  header: 'bg-violet-300',  border: 'border-violet-300' },
  'CC312':  { bg: 'bg-cyan-100/60',    header: 'bg-cyan-300',    border: 'border-cyan-300' },
  'CS313':  { bg: 'bg-orange-100/60',  header: 'bg-orange-300',  border: 'border-orange-300' },
  'DEFAULT':{ bg: 'bg-slate-100/60',   header: 'bg-slate-300',   border: 'border-slate-300' },
};

const subjectBadgeColors: { [key: string]: string } = {
  'CS333':  'bg-sky-200 text-sky-800 border-sky-300',
  'CS351L': 'bg-emerald-200 text-emerald-800 border-emerald-300',
  'CS352':  'bg-teal-200 text-teal-800 border-teal-300',
  'CS373':  'bg-indigo-200 text-indigo-800 border-indigo-300',
  'CSE1':   'bg-rose-200 text-rose-800 border-rose-300',
  'CSE2':   'bg-amber-200 text-amber-800 border-amber-300',
  'CC311L': 'bg-violet-200 text-violet-800 border-violet-300',
  'CC312':  'bg-cyan-200 text-cyan-800 border-cyan-300',
  'CS313':  'bg-orange-200 text-orange-800 border-orange-300',
  'DEFAULT':'bg-slate-200 text-slate-700 border-slate-300',
};

const getSubjectColor = (subject: string) => {
  return subjectColors[subject] || subjectColors['DEFAULT'];
};

const getSubjectBadgeColor = (subject: string) => {
  return subjectBadgeColors[subject] || subjectBadgeColors['DEFAULT'];
};


const PREVIEW_LENGTH = 150;

export default function NoteCard({ 
  note, 
  onLike, 
  onReport, 
  onSelectNote,
  isLiked,
  isReported
}: NoteCardProps) {
  const displayedContent = note.content.length > PREVIEW_LENGTH 
      ? `${note.content.substring(0, PREVIEW_LENGTH)}...`
      : note.content;

  const handleLikeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onLike();
  };

  const handleReportClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onReport();
  };

  const colors = getSubjectColor(note.subject);
  const subjectBadgeColor = getSubjectBadgeColor(note.subject);

  return (
    <div 
        onClick={() => onSelectNote()}
        className={`border rounded-lg shadow-sm flex flex-col h-full hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm ${colors.bg} ${colors.border} hover:border-fuchsia-400 overflow-hidden`}
    >
        <div className={`p-3 flex justify-between items-start gap-2 ${colors.header}`}>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex-shrink-0 ${subjectBadgeColor}`}>
                {note.subject}
            </span>
            
            {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-end">
                    {note.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-white/60 text-slate-800 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{note.title}</h3>

            <p className="text-slate-600 text-base flex-grow whitespace-pre-wrap leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {displayedContent.replace(/[`*#>]/g, '')}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200/80 flex justify-between items-center text-slate-500">
                <span className="text-xs">{formatTimeAgo(note.timestamp)}</span>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLikeClick}
                        disabled={isLiked}
                        className={`flex items-center space-x-1 transition-colors duration-200 group ${isLiked ? 'text-pink-500 cursor-default' : 'hover:text-pink-500'}`}
                        aria-label="Like note"
                    >
                        <HeartIcon className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'fill-current' : 'group-hover:scale-110'}`} />
                        <span className="font-semibold text-sm">{formatLikes(note.likes)}</span>
                    </button>
                    <button
                        onClick={handleReportClick}
                        disabled={isReported}
                        className={`transition-colors duration-200 group ${isReported ? 'text-amber-500 cursor-default' : 'hover:text-amber-500'}`}
                        aria-label="Report note"
                    >
                    <FlagIcon className={`w-5 h-5 transition-transform duration-200 ${isReported ? '' : 'group-hover:scale-110'}`} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};