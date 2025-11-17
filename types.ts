export interface Note {
  id: number;
  title: string;
  subject: string;
  content: string;
  likes: number;
  timestamp: Date;
  tags?: string[];
}

export interface Toast {
  id: number;
  message: string;
}

export interface ModeratedPostLog {
  title: string;
  content: string;
  reason: string;
  moderatedAt: Date;
}

export interface ReportedNoteLog {
  noteId: number;
  noteTitle: string;
  noteContent: string;
  noteSubject: string;
  reportedAt: Date;
}
