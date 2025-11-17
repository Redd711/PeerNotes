import React, { useState, useEffect } from 'react';
import { getModeratedPostsLog, getReportedNotesLog } from '../services/noteService';
import type { ModeratedPostLog, ReportedNoteLog } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminViewProps {
    onBack: () => void;
    onDeleteNote: (id: number) => Promise<boolean>;
}

const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const AdminView: React.FC<AdminViewProps> = ({ onBack, onDeleteNote }) => {
    const [moderatedLogs, setModeratedLogs] = useState<ModeratedPostLog[]>([]);
    const [reportedLogs, setReportedLogs] = useState<ReportedNoteLog[]>([]);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    useEffect(() => {
    const loadLogs = async () => {
        const moderated = getModeratedPostsLog();
        const reported = await getReportedNotesLog();

        setModeratedLogs(moderated);
        setReportedLogs(reported);
    };

    loadLogs();
}, []);


    const handleRemoveClick = (noteId: number) => {
        if (isDeleting) return;
        setConfirmingDeleteId(noteId);
    };

    const executeDelete = async () => {
        if (confirmingDeleteId === null) return;

        setIsDeleting(confirmingDeleteId);
        try {
            const success = await onDeleteNote(confirmingDeleteId);
            if (success) {
                setReportedLogs(prevLogs => prevLogs.filter(log => log.noteId !== confirmingDeleteId));
            }
        } catch (error) {
            console.error("Failed to delete note from AdminView:", error);
        } finally {
            setIsDeleting(null);
            setConfirmingDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setConfirmingDeleteId(null);
    };


    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
             <button
                onClick={onBack}
                className="mb-6 inline-flex items-center text-slate-600 hover:text-fuchsia-600 transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 font-semibold group-hover:underline">Back to Main</span>
            </button>

            <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Admin Logs</h1>

            {/* Moderation Log Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold text-slate-700 border-b-2 border-rose-300 pb-2 mb-4">Moderation Log (Rejected Posts)</h2>
                {moderatedLogs.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No moderated posts yet.</p>
                ) : (
                    <div className="space-y-4">
                        {moderatedLogs.map((log, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-rose-200 shadow-sm">
                                <div className="flex justify-between items-start text-sm mb-2">
                                    <p className="font-bold text-rose-600">REJECTED POST</p>
                                    <p className="text-slate-500">{formatTimestamp(log.moderatedAt)}</p>
                                </div>
                                <p className="font-semibold text-slate-800"><span className="font-normal text-slate-600">Title:</span> {log.title}</p>
                                <p className="font-semibold text-rose-500 mt-1"><span className="font-normal text-slate-600">Reason:</span> {log.reason}</p>
                                <div className="mt-3">
                                     <p className="text-slate-600 text-sm mb-1">Content:</p>
                                    <pre className="bg-rose-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap font-sans">{log.content}</pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Report Log Section */}
            <section>
                <h2 className="text-2xl font-semibold text-slate-700 border-b-2 border-amber-300 pb-2 mb-4">Report Log</h2>
                 {reportedLogs.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No reported notes yet.</p>
                ) : (
                    <div className="space-y-4">
                        {reportedLogs.map((log) => (
                           <div key={log.noteId + log.reportedAt.toISOString()} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                <div className="flex justify-between items-start text-sm mb-2">
                                    <p className="font-bold text-amber-600">REPORTED NOTE</p>
                                    <p className="text-slate-500">{formatTimestamp(log.reportedAt)}</p>
                                </div>
                                <p className="font-semibold text-slate-800"><span className="font-normal text-slate-600">Title:</span> {log.noteTitle}</p>
                                <p className="font-semibold text-slate-800 mt-1"><span className="font-normal text-slate-600">Subject:</span> {log.noteSubject}</p>
                                <div className="mt-3">
                                     <p className="text-slate-600 text-sm mb-1">Content at time of report:</p>
                                    <pre className="bg-amber-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap font-sans">{log.noteContent}</pre>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleRemoveClick(log.noteId)}
                                        disabled={isDeleting !== null}
                                        className="px-4 py-1.5 bg-rose-600 text-white text-sm font-semibold rounded-md hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                                    >
                                        {isDeleting === log.noteId ? 'Deleting...' : 'Delete Note'}
                                    </button>
                                </div>
                           </div>
                        ))}
                    </div>
                )}
            </section>

            <ConfirmationModal
                isOpen={confirmingDeleteId !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this note? This action cannot be undone."
                confirmText="Delete Note"
                onConfirm={executeDelete}
                onCancel={cancelDelete}
                isConfirming={isDeleting !== null}
            />
        </div>
    );
};
