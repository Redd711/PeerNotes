import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { NoteForm } from "./components/NoteForm";
import NoteList from "./components/NoteList";
import { NoteDetail } from "./components/NoteDetail";
import { AdminView } from "./components/AdminView";
import { ToastContainer } from "./components/Toast";
import {
  getNotes,
  createNote,
  likeNote as serviceLikeNote,
  reportNote as serviceReportNote,
  deleteNote as serviceDeleteNote,
} from "./services/noteService";
import type { Note, Toast as ToastType } from "./types";
import "./App.css";

type SortBy = "popular" | "newest";
type View = "main" | "admin";

const DEFAULT_TITLE = "PeerNotes | Anonymous Note Sharing";

// UI-only constants
const availableSubjects = [
  "CS333",
  "CS351L",
  "CS352",
  "CS373",
  "CSE1",
  "CSE2",
  "CC311L",
  "CC312",
  "CS313",
];
const subjectNames: { [key: string]: string } = {
  CS333: "Data Analytics",
  CS351L: "Software Engineering Laboratory",
  CS352: "Software Engineering Lecture",
  CS373: "Parallel and Distributed Computing",
  CSE1: "Cybersecurity",
  CSE2: "Project Management",
  CC311L: "Web Development Laboratory",
  CC312: "Web Development Lecture",
  CS313: "Information Assurance and Security",
};
const availableTags = ["All", "Quiz", "Lesson 1", "Lesson 2", "Midterms", "Finals"];

const subjectFilterColors: { [key: string]: string } = {
  All: "bg-fuchsia-500 text-white",
  CS333: "bg-sky-500 text-white",
  CS351L: "bg-emerald-500 text-white",
  CS352: "bg-teal-500 text-white",
  CS373: "bg-indigo-500 text-white",
  CSE1: "bg-rose-500 text-white",
  CSE2: "bg-amber-500 text-white",
  CC311L: "bg-violet-500 text-white",
  CC312: "bg-cyan-500 text-white",
  CS313: "bg-orange-500 text-white",
};

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [currentView, setCurrentView] = useState<View>("main");

  const [likedNotes, setLikedNotes] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("likedNotes");
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [reportedNotes, setReportedNotes] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("reportedNotes");
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  // Fetch and set notes from backend
  const fetchAndSetNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await getNotes(); // service returns Note[] with timestamp: Date
      setNotes(fetched);
    } catch (err: any) {
      console.error("Failed to load notes:", err);
      setError("Failed to fetch notes. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSetNotes();
  }, [fetchAndSetNotes]);

  // persist like/report selections to localStorage (UI-only)
  useEffect(() => {
    localStorage.setItem("likedNotes", JSON.stringify(Array.from(likedNotes)));
  }, [likedNotes]);

  useEffect(() => {
    localStorage.setItem("reportedNotes", JSON.stringify(Array.from(reportedNotes)));
  }, [reportedNotes]);

  // Admin quick-toggle accessible from console
  useEffect(() => {
    (window as any).showAdminLogs = () => {
      setCurrentView("admin");
    };
    return () => {
      delete (window as any).showAdminLogs;
    };
  }, []);

  const addToast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Posting a new note
  const handlePostNote = async (data: {
    title: string;
    subject: string;
    content: string;
    tags: string[];
  }): Promise<void> => {
    setError(null);
    try {
      // createNote returns the saved note including id, likes, tags, timestamp
      const created = await createNote({
        title: data.title,
        subject: data.subject,
        content: data.content,
        tags: data.tags,
      });

      // Insert into UI state immediately, and switch to newest sort + reset filters
      setNotes((prev) => [created, ...prev]);
      setSelectedSubject("All");
      setSelectedTag("All");
      setSortBy("newest");
      addToast("Note posted.");
    } catch (err: any) {
      console.error("Failed to post note:", err);
      // If backend returns JSON error, show it
      const message = err?.message || "Failed to post note.";
      setError(message);
      addToast(message);
    }
  };

  // Like a note (optimistic UI)
  const handleLikeNote = async (id: number): Promise<void> => {
    if (likedNotes.has(id)) return;
    // optimistic update
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, likes: n.likes + 1 } : n)));
    setLikedNotes((prev) => new Set(prev).add(id));
    try {
      const updated = await serviceLikeNote(id);
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      }
    } catch (err) {
      console.error("Like failed:", err);
      // rollback
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, likes: Math.max(0, n.likes - 1) } : n)));
      setLikedNotes((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      addToast("Failed to like note.");
    }
  };

  // Report a note (UI + server)
  const handleReportNote = async (id: number): Promise<void> => {
    if (reportedNotes.has(id)) {
      addToast("Already reported.");
      return;
    }
    try {
      await serviceReportNote(id);
      setReportedNotes((prev) => new Set(prev).add(id));
      addToast("Note reported.");
    } catch (err) {
      console.error("Report failed:", err);
      addToast("Failed to report note.");
    }
  };

  // Delete a note (admin)
  const handleDeleteNote = async (id: number): Promise<boolean> => {
    try {
      const success = await serviceDeleteNote(id);
      if (success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        addToast("Note removed successfully.");
        return true;
      } else {
        addToast("Failed to remove note.");
        return false;
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to remove note.");
      return false;
    }
  };

  // Derived UI lists
  const uniqueSubjectsForFilter = useMemo(() => ["All", ...availableSubjects], []);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      if (selectedSubject !== "All" && note.subject !== selectedSubject) return false;
      if (selectedTag !== "All" && !(note.tags && note.tags.includes(selectedTag))) return false;
      if (
        searchTerm &&
        !note.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes;
      if (sortBy === "newest") return b.timestamp.getTime() - a.timestamp.getTime();
      return 0;
    });

    return sorted;
  }, [notes, searchTerm, selectedSubject, selectedTag, sortBy]);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedNoteId) ?? null, [notes, selectedNoteId]);

  // Document title behavior
  useEffect(() => {
    const defaultTitle = DEFAULT_TITLE;
    document.title = defaultTitle;
    const handleVisibilityChange = () => {
      if (document.hidden && selectedNote) {
        document.title = selectedNote.title;
      } else {
        document.title = defaultTitle;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedNote]);

  const SortButton: React.FC<{ type: SortBy; label: string }> = ({ type, label }) => (
    <button
      onClick={() => setSortBy(type)}
      className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
        sortBy === type ? "bg-fuchsia-500 text-white shadow-md" : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-300"
      }`}
    >
      {label}
    </button>
  );

  const handleBackToMain = () => {
    setSelectedNoteId(null);
    setCurrentView("main");
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {currentView === "admin" ? (
          <AdminView onBack={handleBackToMain} onDeleteNote={handleDeleteNote} notes={notes} />
        ) : selectedNote ? (
          <NoteDetail note={selectedNote} onBack={() => setSelectedNoteId(null)} />
        ) : (
          <>
            <NoteForm
              onPost={handlePostNote}
              subjects={availableSubjects}
              availableTags={availableTags.filter((t) => t !== "All")}
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
                  {uniqueSubjectsForFilter.map((subject) => (
                    <div key={subject} className="relative group">
                      <button
                        onClick={() => setSelectedSubject(subject)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                          selectedSubject === subject ? subjectFilterColors[subject] || "bg-fuchsia-500 text-white" : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {subject}
                      </button>
                      {subject !== "All" && (
                        <span className="absolute z-10 -bottom-7 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          {subjectNames[subject]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
                        selectedTag === tag ? "bg-cyan-500 text-white" : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-300"
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
