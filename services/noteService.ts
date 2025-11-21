import type { Note, ModeratedPostLog, ReportedNoteLog } from '../types';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* ------------------------- Fetch All Notes ------------------------- */
export const getNotes = async (): Promise<Note[]> => {
    const res = await fetch(`${API_URL}/api/notes`);
    if (!res.ok) throw new Error("Failed to fetch notes");

    const serverNotes = await res.json();
    
    return serverNotes.map((n: any) => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        content: n.content,
        likes: n.likes,
        tags: n.tags,
        timestamp: new Date(n.created_at),
    }));
};

/* ------------------------- Create Note ------------------------- */
export const createNote = async (data: { 
    title: string; 
    subject: string; 
    content: string; 
    tags: string[]; 
}): Promise<Note> => {

    const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: data.title,
            subject: data.subject,
            content: data.content,
            tags: Array.isArray(data.tags) ? data.tags : [data.tags].filter(Boolean),
        }),
    });

    const result = await res.json();
    if (!res.ok) { 
      const errorMsg = result.error || "Failed to create note";
      const reasonMsg = result.reason;

      let fullMessage = errorMsg;
        if (reasonMsg) {
            fullMessage = `${errorMsg}: ${reasonMsg}`; 
        }

      throw new Error(fullMessage);
    }

    return {
        id: result.id,
        title: result.title,
        subject: result.subject,
        content: result.content,
        likes: result.likes ?? 0,
        tags: result.tags ?? [],
        timestamp: new Date(result.created_at),
    };
};

/* ------------------------- Like Note (Future) ------------------------- */
export const likeNote = async (id: number): Promise<Note | null> => {
  try {
    const res = await fetch(`${API_URL}/api/notes/${id}/like`, {
      method: "POST"
    });

    if (!res.ok) return null;

    const updated = await res.json();

    return {
      id: updated.id,
      title: updated.title,
      subject: updated.subject,
      content: updated.content,
      likes: updated.likes,
      tags: updated.tags ?? [],
      timestamp: new Date(updated.created_at),
    };
  } catch (error) {
    console.error("Error liking note:", error);
    return null;
  }
};

/* ------------------------- Report Note (Future) ------------------------- */
export const reportNote = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/notes/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Error reporting note:", error);
    return false;
  }
};


/* ------------------------- Delete Note ------------------------- */
export const deleteNote = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/notes/${id}`, { method: "DELETE" });
    return res.ok;
  } catch (error) {
    console.error("Error deleting note:", error);
    return false;
  }
};

/* ------------------------- Report Log (from backend) ------------------------- */
export const getReportedNotesLog = async (): Promise<ReportedNoteLog[]> => {
  const res = await fetch(`${API_URL}/api/reported-notes`);
  if (!res.ok) return [];

  const data = await res.json();

  return data.map((row: any) => ({
    noteId: row.note_id,
    noteTitle: row.title,
    noteSubject: row.subject,
    noteContent: row.content,
    reportedAt: new Date(row.reported_at),
  }));
};

/* ------------------------- Moderated Log -------------------------
   This remains local-only because moderation logs are not stored in DB yet
------------------------------------------------------------------ */
export const getModeratedPostsLog = (): ModeratedPostLog[] => {
  return [];
};

