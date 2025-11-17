import React, { useState } from 'react';

// This will be available globally from the script tag in index.html
declare var marked: {
  parse: (markdownString: string) => string;
};

interface NoteFormProps {
    onPost: (data: { title: string; subject: string; content: string; tags: string[] }) => Promise<void>;
    subjects: string[];
    availableTags: string[];
    subjectNames: { [key:string]: string };
}

const MAX_CONTENT_CHARS = 5000;

const subjectFormColors: { [key: string]: { bg: string; border: string; ring: string; } } = {
    'CS333':  { bg: 'bg-sky-50',    border: 'border-sky-300',    ring: 'focus-within:ring-sky-400' },
    'CS351L': { bg: 'bg-emerald-50', border: 'border-emerald-300', ring: 'focus-within:ring-emerald-400' },
    'CS352':  { bg: 'bg-teal-50',    border: 'border-teal-300',    ring: 'focus-within:ring-teal-400' },
    'CS373':  { bg: 'bg-indigo-50',  border: 'border-indigo-300',  ring: 'focus-within:ring-indigo-400' },
    'CSE1':   { bg: 'bg-rose-50',    border: 'border-rose-300',    ring: 'focus-within:ring-rose-400' },
    'CSE2':   { bg: 'bg-amber-50',   border: 'border-amber-300',   ring: 'focus-within:ring-amber-400' },
    'CC311L': { bg: 'bg-violet-50',  border: 'border-violet-300',  ring: 'focus-within:ring-violet-400' },
    'CC312':  { bg: 'bg-cyan-50',    border: 'border-cyan-300',    ring: 'focus-within:ring-cyan-400' },
    'CS313':  { bg: 'bg-orange-50',  border: 'border-orange-300',  ring: 'focus-within:ring-orange-400' },
    'DEFAULT':{ bg: 'bg-white',      border: 'border-slate-200',   ring: 'focus-within:ring-fuchsia-500' },
};

const subjectButtonSelectedColors: { [key: string]: string } = {
    'CS333': 'bg-sky-500 text-white border-sky-500',
    'CS351L': 'bg-emerald-500 text-white border-emerald-500',
    'CS352': 'bg-teal-500 text-white border-teal-500',
    'CS373': 'bg-indigo-500 text-white border-indigo-500',
    'CSE1': 'bg-rose-500 text-white border-rose-500',
    'CSE2': 'bg-amber-500 text-white border-amber-500',
    'CC311L': 'bg-violet-500 text-white border-violet-500',
    'CC312': 'bg-cyan-500 text-white border-cyan-500',
    'CS313': 'bg-orange-500 text-white border-orange-500',
};


export const NoteForm: React.FC<NoteFormProps> = ({ onPost, subjects, availableTags, subjectNames }) => {
    const [title, setTitle] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        }
    };

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubjectClick = (subject: string) => {
        setSelectedSubject(subject);
        handleExpand();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !selectedSubject || !content.trim() || isPosting) return;

        setIsPosting(true);
        try {
            await onPost({ title, subject: selectedSubject, content, tags: selectedTags });
            setTitle('');
            setSelectedSubject('');
            setContent('');
            setSelectedTags([]);
            setIsExpanded(false); // Collapse form on successful post
        } catch (error) {
            console.error("Failed to post note:", error);
        } finally {
            setIsPosting(false);
        }
    };

    const charsLeft = MAX_CONTENT_CHARS - content.length;
    const formColors = subjectFormColors[selectedSubject] || subjectFormColors['DEFAULT'];
    const previewHtml = content 
        ? marked.parse(content) 
        : '<p class="text-slate-400 not-prose">Preview will appear here...</p>';


    return (
        <div className={`max-w-2xl mx-auto p-6 rounded-xl shadow-lg border transition-colors duration-300 focus-within:ring-2 ${formColors.bg} ${formColors.border} ${formColors.ring}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold text-center text-slate-800">Share a New Note</h2>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={handleExpand}
                        placeholder="e.g., Summary of Quantum Physics Chapter 3"
                        className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition"
                        disabled={isPosting}
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Course Code</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {subjects.map(subject => (
                             <div key={subject} className="relative group">
                                <button
                                    type="button"
                                    onClick={() => handleSubjectClick(subject)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 border ${
                                        selectedSubject === subject
                                        ? (subjectButtonSelectedColors[subject] || 'bg-fuchsia-500 text-white border-fuchsia-500')
                                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                                    }`}
                                    disabled={isPosting}
                                >
                                    {subject}
                                </button>
                                <span className="absolute z-10 -bottom-7 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    {subjectNames[subject]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* --- FOCUS MODE EXPANDABLE SECTION --- */}
                <div className={`transition-all duration-500 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden p-1">
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Optional)</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {availableTags.map(tag => (
                                        <button
                                            type="button"
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 border ${
                                                selectedTags.includes(tag)
                                                ? 'bg-cyan-500 text-white border-cyan-500'
                                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                                            }`}
                                            disabled={isPosting}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline mb-2">
                                    <label htmlFor="content" className="block text-sm font-medium text-slate-700">Content</label>
                                    <span className="text-xs font-medium text-slate-500">Live Preview</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <textarea
                                        id="content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        maxLength={MAX_CONTENT_CHARS}
                                        placeholder="Write your notes here... Markdown is supported!"
                                        className="w-full h-64 p-3 bg-white rounded-lg text-base border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition duration-200 resize-none"
                                        disabled={isPosting}
                                        required
                                    />
                                    <div
                                        className="prose prose-sm max-w-none w-full h-64 p-3 bg-white rounded-lg border border-slate-200 overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
                                    <p className="flex items-center gap-2 flex-wrap">
                                        <span>Markdown:</span>
                                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-violet-800 font-mono"># H1</code>
                                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-violet-800 font-mono">**bold**</code>
                                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-violet-800 font-mono">*italic*</code>
                                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-violet-800 font-mono">- list</code>
                                    </p>
                                    <p className={`text-right flex-shrink-0 ${charsLeft < 20 ? 'text-red-500' : 'text-slate-500'}`}>
                                        {charsLeft} characters remaining
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end items-center pt-2">
                                <button
                                    type="submit"
                                    disabled={!title.trim() || !selectedSubject.trim() || !content.trim() || isPosting}
                                    className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {isPosting ? 'Posting...' : 'Post Note'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};