import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { NoteDetail } from './components/NoteDetail';
import { AdminView } from './components/AdminView';
import { ToastContainer } from './components/Toast';
import { getNotes, createNote, likeNote, reportNote, moderateContent, deleteNote } from './services/noteService';
import type { Note, Toast as ToastType } from './types';

type SortBy = 'popular' | 'newest';
type View = 'main' | 'admin';

// Simulates a list of subjects managed by an admin
const availableSubjects = ['CS333', 'CS351L', 'CS352', 'CS373', 'CSE1', 'CSE2', 'CC311L', 'CC312', 'CS313'];
const subjectNames: { [key: string]: string } = {
    'CS333': 'Data Analytics',
    'CS351L': 'Software Engineering Laboratory',
    'CS352': 'Software Engineering Lecture',
    'CS373': 'Parallel and Distributed Computing',
    'CSE1': 'Cybersecurity',
    'CSE2': 'Project Management',
    'CC311L': 'Web Development Laboratory',
    'CC312': 'Web Development Lecture',
    'CS313': 'Information Assurance and Security'
};
const availableTags = ["All", "Quiz", "Lesson 1", "Lesson 2", "Midterms", "Finals"];

const subjectFilterColors: { [key: string]: string } = {
    'All': 'bg-fuchsia-500 text-white',
    'CS333': 'bg-sky-500 text-white',
    'CS351L': 'bg-emerald-500 text-white',
    'CS352': 'bg-teal-500 text-white',
    'CS373': 'bg-indigo-500 text-white',
    'CSE1': 'bg-rose-500 text-white',
    'CSE2': 'bg-amber-500 text-white',
    'CC311L': 'bg-violet-500 text-white',
    'CC312': 'bg-cyan-500 text-white',
    'CS313': 'bg-orange-500 text-white',
};

const DEFAULT_TITLE = 'PeerNotes | Anonymous Note Sharing';

const App: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [sortBy, setSortBy] = useState<SortBy>('popular');
    const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [currentView, setCurrentView] = useState<View>('main');

    const [likedNotes, setLikedNotes] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('likedNotes');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [reportedNotes, setReportedNotes] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('reportedNotes');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const fetchAndSetNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedNotes = await getNotes();
            setNotes(fetchedNotes);
        } catch (err) {
            setError('Failed to fetch notes. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAndSetNotes();
    }, [fetchAndSetNotes]);

    useEffect(() => {
        localStorage.setItem('likedNotes', JSON.stringify(Array.from(likedNotes)));
    }, [likedNotes]);
    
    useEffect(() => {
        localStorage.setItem('reportedNotes', JSON.stringify(Array.from(reportedNotes)));
    }, [reportedNotes]);

        useEffect(() => {
        // Expose a function to the window object for "terminal" access
        (window as any).showAdminLogs = () => {
            console.log("Switching to Admin Logs view...");
            setCurrentView('admin');
        };

        // Cleanup function to remove it when the component unmounts
        return () => {
            delete (window as any).showAdminLogs;
        };
    }, []);

    const addToast = useCallback((message: string) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    const handlePostNote = async (data: { title: string; subject: string; content: string; tags: string[] }): Promise<void> => {
        try {
            // Moderation check before creating the note
            const moderationResult = await moderateContent(data.title, data.content);
            if (moderationResult.isHarmful) {
                addToast(moderationResult.reason || 'Post rejected for containing harmful content.');
                return; // Stop the function here
            }

            await createNote(data);
            await fetchAndSetNotes();
            setSelectedSubject('All'); // Reset filter to see the new note
            setSelectedTag('All');
            setSortBy('newest'); // Switch to newest to show the latest post
        } catch (err) {
            setError('Failed to post note.');
        }
    };

    const handleLikeNote = async (id: number): Promise<void> => {
        if (likedNotes.has(id)) return;
        try {
            const updatedNote = await likeNote(id);
            if (updatedNote) {
                setLikedNotes(prev => new Set(prev).add(id));
                setNotes(prevNotes =>
                    prevNotes.map(note => (note.id === id ? updatedNote : note))
                );
            }
        } catch (err) {
            setError('Failed to like note.');
        }
    };

    const handleReportNote = async (id: number): Promise<void> => {
        if (reportedNotes.has(id)) return;
        try {
            await reportNote(id);
            setReportedNotes(prev => new Set(prev).add(id));
            addToast('Note has been reported.');
        } catch (err) {
            setError('Failed to report note.');
        }
    };

    const handleDeleteNote = async (id: number): Promise<boolean> => {
        try {
            const success = await deleteNote(id);
            if (success) {
                setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
                addToast('Note removed successfully.');
                return true;
            } else {
                addToast('Failed to remove note.');
                return false;
            }
        } catch (err) {
            setError('Failed to remove note.');
            return false;
        }
    };

    const uniqueSubjectsForFilter = ['All', ...availableSubjects];

    const filteredNotes = useMemo(() => {
        return notes
            .filter(note => {
                if (selectedSubject !== 'All' && note.subject !== selectedSubject) {
                    return false;
                }
                 if (selectedTag !== 'All' && !(note.tags && note.tags.includes(selectedTag))) {
                    return false;
                }
                if (searchTerm && 
                    !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                    !note.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'popular') {
                    return b.likes - a.likes;
                }
                if (sortBy === 'newest') {
                    return b.timestamp.getTime() - a.timestamp.getTime();
                }
                return 0;
            });
    }, [notes, searchTerm, selectedSubject, selectedTag, sortBy]);

    const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // If there's a selected note, change the title to the note's title
                if (selectedNote) {
                    document.title = selectedNote.title;
                }
            } else {
                // When returning to the tab, always reset to the default title
                document.title = DEFAULT_TITLE;
            }
        };

        // Set initial title when the effect runs
        document.title = DEFAULT_TITLE;

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup: remove the event listener when the component unmounts or selectedNote changes
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [selectedNote]); // Re-run this effect if the selected note changes

    const SortButton: React.FC<{ type: SortBy; label: string }> = ({ type, label }) => (
         <button
            onClick={() => setSortBy(type)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                sortBy === type
                ? 'bg-fuchsia-500 text-white shadow-md'
                : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-300'
            }`}
        >
            {label}
        </button>
    );
    
    const handleBackToMain = () => {
      setSelectedNoteId(null);
      setCurrentView('main');
    };

    return (
        <div className="min-h-screen font-sans text-slate-800">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {currentView === 'admin' ? (
                     <AdminView onBack={handleBackToMain} onDeleteNote={handleDeleteNote} />
                ) : selectedNote ? (
                    <NoteDetail note={selectedNote} onBack={() => setSelectedNoteId(null)} />
                ) : (
                    <>
                        <NoteForm 
                            onPost={handlePostNote} 
                            subjects={availableSubjects} 
                            availableTags={availableTags.filter(t => t !== 'All')}
                            subjectNames={subjectNames}
                        />
                        {error && <p className="text-center text-red-500 mt-4">{error}</p>}
                        
                        <div className="mt-12">
                            <div className="max-w-4xl mx-auto mb-8">
                                <h2 className="text-2xl font-bold text-center text-slate-700 mb-6">Explore Notes</h2>
                                <div className="relative mb-6">
                                    <input
                                        type="text"
                                        placeholder="Search by title or content..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-5 py-3 bg-white rounded-full text-slate-900 placeholder-slate-400 border border-slate-300 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                                    />
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {uniqueSubjectsForFilter.map(subject => (
                                        <div key={subject} className="relative group">
                                            <button
                                                onClick={() => setSelectedSubject(subject)}
                                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                                    selectedSubject === subject 
                                                    ? (subjectFilterColors[subject] || 'bg-fuchsia-500 text-white')
                                                    : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-300'
                                                }`}
                                            >
                                                {subject}
                                            </button>
                                            {subject !== 'All' && (
                                                <span className="absolute z-10 -bottom-7 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                    {subjectNames[subject]}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                     {availableTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTag(tag)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
                                                selectedTag === tag 
                                                ? 'bg-cyan-500 text-white' 
                                                : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-300'
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                
                                 <div className="flex justify-center items-center gap-4 mt-6">
                                    <span className="text-sm font-medium text-slate-500">Sort by:</span>
                                    <SortButton type="popular" label="Most Popular" />
                                    <SortButton type="newest" label="Newest" />
                                </div>
                            </div>

                            <NoteList 
                                notes={filteredNotes} 
                                isLoading={isLoading}
                                onLike={handleLikeNote}
                                onReport={handleReportNote}
                                onSelectNote={setSelectedNoteId}
                                likedNotes={likedNotes}
                                reportedNotes={reportedNotes}
                            />
                        </div>
                    </>
                )}
            </main>
             <footer className="text-center py-6 text-slate-500">
                <p>PeerNotes | Anonymous Note Sharing.</p>
            </footer>
            <ToastContainer toasts={toasts} />
        </div>
    );
};

export default App;
