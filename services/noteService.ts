import type { Note, ModeratedPostLog, ReportedNoteLog } from '../types';

const initialNotes: Note[] = [
    { id: 1, title: "Intro to Parallel Algorithms", subject: "CS373", content: `### Why Parallelism?\nParallel computing is essential for handling large-scale data and complex simulations. It divides a large problem into smaller sub-problems, which are then solved concurrently.\n\n**Key Concepts**:\n*   **Amdahl's Law**: Describes the theoretical speedup in latency of the execution of a task at fixed workload.\n*   **Flynn's Taxonomy**: Classifies computer architectures (SISD, SIMD, MISD, MIMD).\n*   **MPI vs. OpenMP**: Common programming models for parallel systems.`, likes: 128, timestamp: new Date(Date.now() - 1000 * 60 * 20), tags: ["Lesson 1", "Midterms"] },
    { id: 2, title: "Agile vs. Waterfall Methodologies", subject: "CS352", content: `## Software Development Life Cycles\nChoosing the right SDLC is crucial for project success.\n\n### Waterfall\n*   Linear, sequential approach.\n*   Phases: Requirements, Design, Implementation, Testing, Deployment.\n*   **Pro**: Simple, well-defined stages.\n*   **Con**: Inflexible; difficult to change requirements.\n\n### Agile\n*   Iterative and incremental.\n*   Work is done in sprints.\n*   **Pro**: Flexible, adaptive to change.\n*   **Con**: Less predictable outcomes.\n\n> "Agile allows teams to deliver value to their customers faster and with fewer headaches."`, likes: 88, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), tags: ["Quiz"] },
    { id: 3, title: "The CIA Triad in Cybersecurity", subject: "CSE1", content: "The CIA Triad is a foundational model for guiding information security policies.\n\n1.  **Confidentiality**: Ensuring data is accessible only to authorized individuals.\n2.  **Integrity**: Maintaining the accuracy and completeness of data.\n3.  **Availability**: Ensuring that systems and data are accessible to authorized users when needed.\n\nLosing any one of these pillars can lead to a security breach.", likes: 12, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), tags: ["Lesson 2", "Finals"] },
    { id: 4, title: "REST API Principles", subject: "CC312", content: "REST (Representational State Transfer) is an architectural style for designing networked applications.\n\n### Key Constraints:\n*   **Client-Server**: Separation of concerns.\n*   **Stateless**: Each request from a client must contain all the info needed to understand it.\n*   **Cacheable**: Responses must define themselves as cacheable or not.\n*   **Uniform Interface**: A common interface between client and server (e.g., using HTTP verbs like GET, POST, PUT, DELETE).", likes: 101, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), tags: ["Finals"] },
    { id: 5, title: "Information Assurance vs. Security", subject: "CS313", content: `While often used interchangeably, they have distinct meanings.\n\n*   **Information Security**: Focuses on protecting data from unauthorized access, use, disclosure, etc. It's about the **data itself**.\n*   **Information Assurance**: Is broader. It includes protecting the systems and processes that handle the information. It's about the **trustworthiness of the information and its delivery**.\n\nThink of it as: Security is the lock on the door, Assurance is making sure the door leads to the right room.`, likes: 7, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), tags: ["Lesson 1"] },
    { id: 6, title: "Critical Path Method in PM", subject: "CSE2", content: `### What is the Critical Path Method (CPM)?\nCPM is a project management technique for identifying the longest sequence of tasks that must be completed to finish a project.\n\n*   Tasks on the critical path are called **critical activities**.\n*   Any delay in a critical activity will delay the entire project.\n*   **"Float"** or **"Slack"** is the amount of time a task can be delayed without causing a delay to subsequent tasks or the project completion date. Critical activities have zero float.`, likes: 3, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), tags: ["Midterms"] },
    { id: 7, title: "CSS Box Model", subject: "CC311L", content: "The CSS box model is a box that wraps around every HTML element. It consists of:\n\n*   **Content**: The content of the box, where text and images appear.\n*   **Padding**: Clears an area around the content. It is transparent.\n*   **Border**: A border that goes around the padding and content.\n*   **Margin**: Clears an area outside the border. It is transparent.\n\n\`box-sizing: border-box;\` is often used to make layout easier.", likes: 46, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), tags: ["Lesson 2", "Quiz"] },
     { id: 8, title: "Data Cleaning Techniques", subject: "CS333", content: `Data cleaning is a critical step in the data analysis pipeline.\n\n### Common Tasks:\n1.  **Handling Missing Values**: Can be done by removing the record, or imputing a value (e.g., mean, median, or a model-predicted value).\n2.  **Removing Duplicates**: Identifying and deleting duplicate records.\n3.  **Correcting Structural Errors**: Fixing typos, inconsistent capitalization, or formatting issues (e.g., 'N/A' vs 'Not Applicable').\n4.  **Outlier Detection**: Identifying and handling data points that are significantly different from other observations.`, likes: 15, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), tags: ["Lesson 1"] },
];

let notes: Note[];
const storedNotesData = localStorage.getItem('notes');

if (storedNotesData) {
    // If notes exist in storage, parse them and convert timestamp strings back to Date objects.
    notes = JSON.parse(storedNotesData).map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
        tags: note.tags || [], // Ensure tags exist, even for old notes
    }));
} else {
    // Otherwise, use the initial set of notes.
    notes = initialNotes;
}

let nextId: number = Math.max(...notes.map(n => n.id), 0) + 1;

const saveNotes = () => {
    localStorage.setItem('notes', JSON.stringify(notes));
};

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getNotes = async (): Promise<Note[]> => {
    const res = await fetch(`${API_URL}/api/notes`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    const serverNotes = await res.json();

    // Convert backend structure → frontend structure
    return serverNotes.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        subject: "General",     // temporary fallback
        likes: 0,               // backend does not store likes
        tags: [],               // backend does not store tags
        timestamp: new Date(n.created_at)
    }));
};


const saveModerationLog = (logEntry: ModeratedPostLog) => {
    const logs = getModeratedPostsLog();
    logs.unshift(logEntry);
    localStorage.setItem('moderatedPostsLog', JSON.stringify(logs));
};

const saveReportLog = (logEntry: ReportedNoteLog) => {
    const logs = getReportedNotesLog();
    logs.unshift(logEntry);
    localStorage.setItem('reportedNotesLog', JSON.stringify(logs));
};


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function fetchNotes(): Promise<Note[]> {
  try {
    const res = await fetch(`${API_URL}/api/notes`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    return res.json();
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

export const createNote = async (data: { title: string; subject: string; content: string; tags: string[] }): Promise<Note> => {
  const res = await fetch(`${API_URL}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: data.title, content: data.content }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to create note");

  return {
    id: result.id,
    title: result.title,
    subject: data.subject,
    content: result.content,
    likes: 0,
    timestamp: new Date(result.created_at),
    tags: data.tags,
  };
};

export const likeNote = async (id: number): Promise<Note | null> => {
  // TODO: Add like endpoint to backend if needed
  return null;
};

export const reportNote = async (id: number): Promise<boolean> => {
  // TODO: Add report endpoint to backend if needed
  return false;
};

export const deleteNote = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/notes/${id}`, { method: "DELETE" });
    return res.ok;
  } catch (error) {
    console.error("Error deleting note:", error);
    return false;
  }
};

export const getModeratedPostsLog = (): ModeratedPostLog[] => {
  return [];
};

export const getReportedNotesLog = (): ReportedNoteLog[] => {
  return [];
};