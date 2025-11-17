import React, { useState, useEffect } from "react";
import { getReportedNotesLog } from "../services/noteService";
import type { ReportedNoteLog } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";

interface AdminViewProps {
    onBack: () => void;
    onDeleteNote: (id: number) => Promise<boolean>;
}

const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

export const AdminView: React.FC<AdminViewProps> = ({ onBack, onDeleteNote }) => {
    const [reportedLogs, setReportedLogs] = useState<ReportedNoteLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    // load logs from database
    useEffect(() => {
        async function loadLogs() {
            setIsLoading(true);
            const logs = await getReportedNotesLog();
            setReportedLogs(logs);
            setIsLoading(false);
        }
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
                setReportedLogs((prev) =>
                    prev.filter((log) => log.noteId !== confirmingDeleteId)
                );
            }
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setIsDeleting(null);
            setConfirmingDeleteId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="mb-6 inline-flex items-center text-slate-600 hover:text-fuchsia-600 transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
                <span className="ml-2 font-semibold group-hover:underline">Back to Main</span>
            </button>

            <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Reported Notes</h1>

            {/* Loading */}
            {isLoading && (
                <p className="text-center text-slate-500 py-6">Loading reports...</p>
            )}

            {/* No reports */}
            {!isLoading && reportedLogs.length === 0 && (
                <p className="text-slate-500 text-center py-6">
                    No reported notes yet.
                </p>
            )}

            {/* Report List */}
            {!isLoading && reportedLogs.length > 0 && (
                <div className="space-y-4">
                    {reportedLogs.map((log) => (
                        <div
                            key={log.noteId + log.reportedAt.toISOString()}
                            className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm"
                        >
                            <div className="flex justify-between items-start text-sm mb-2">
                                <p className="font-bold text-amber-600">REPORTED NOTE</p>
                                <p className="text-slate-500">
                                    {formatTimestamp(log.reportedAt)}
                                </p>
                            </div>

                            <p className="font-semibold text-slate-800">
                                <span className="font-normal text-slate-600">Title:</span>{" "}
                                {log.noteTitle}
                            </p>

                            <p className="font-semibold text-slate-800 mt-1">
                                <span className="font-normal text-slate-600">Subject:</span>{" "}
                                {log.noteSubject}
                            </p>

                            <div className="mt-3">
                                <p className="text-slate-600 text-sm mb-1">
                                    Content at time of report:
                                </p>
                                <pre className="bg-amber-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap font-sans">
                                    {log.noteContent}
                                </pre>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => handleRemoveClick(log.noteId)}
                                    disabled={isDeleting !== null}
                                    className="px-4 py-1.5 bg-rose-600 text-white text-sm font-semibold rounded-md hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                                >
                                    {isDeleting === log.noteId
                                        ? "Deleting..."
                                        : "Delete Note"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmingDeleteId !== null}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this note? This action cannot be undone."
                confirmText="Delete Note"
                onConfirm={executeDelete}
                onCancel={() => setConfirmingDeleteId(null)}
                isConfirming={isDeleting !== null}
            />
        </div>
    );
};
