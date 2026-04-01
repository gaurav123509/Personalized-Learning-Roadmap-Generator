'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserEmail } from '@/lib/auth';

interface UserNotesProps {
  subject: string;
}

interface SavedNote {
  id: string;
  title: string;
  text: string;
  color: string;
  fontSize: number; // percentage (100 = normal)
  createdAt: number;
  updatedAt: number;
}

const MAX_NOTE_WORDS = 1500;
const MIN_FONT_PERCENT = 70;
const MAX_FONT_PERCENT = 200;
const FONT_STEP = 10;

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function UserNotes({ subject }: UserNotesProps) {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedColor, setSelectedColor] = useState('#fde68a');
  const [fontSize, setFontSize] = useState(100);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [showColorOptions, setShowColorOptions] = useState(false);

  const colorOptions = [
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Green', value: '#34d399' },
    { name: 'Red', value: '#f87171' },
    { name: 'Purple', value: '#c084fc' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Cyan', value: '#22d3ee' },
  ];

  useEffect(() => {
    const email = getCurrentUserEmail() || '';
    setUserEmail(email);
  }, []);

  const fetchNotes = async () => {
    if (!userEmail || !subject.trim()) {
      setNotes([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/notes?userEmail=${encodeURIComponent(userEmail)}&subject=${encodeURIComponent(subject)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch notes');
      const parsed = data.notes as Partial<SavedNote>[];
      if (!Array.isArray(parsed)) {
        return;
      }

      const normalized: SavedNote[] = parsed.map((n, idx) => ({
        // Backward compatibility: older notes used pixel values (12-30).
        // Convert them approximately to percentages where 16px = 100%.
        fontSize:
          (n.fontSize || 0) <= 40
            ? Math.max(
                MIN_FONT_PERCENT,
                Math.min(MAX_FONT_PERCENT, Math.round(((n.fontSize || 16) / 16) * 100))
              )
            : Math.max(
                MIN_FONT_PERCENT,
                Math.min(MAX_FONT_PERCENT, n.fontSize || 100)
              ),
        id: n.id || `legacy-${idx}`,
        title: n.title || 'Untitled Note',
        text: n.text || '',
        color: n.color || '#fde68a',
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now(),
      }));
      setNotes(normalized);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotes();
  }, [userEmail, subject]);

  const saveNote = async () => {
    const text = draft.trim();
    if (!text) return;
    const totalWords = countWords(text);
    if (totalWords > MAX_NOTE_WORDS) {
      setWordError(`Note exceeds ${MAX_NOTE_WORDS} words. Current: ${totalWords}`);
      return;
    }
    setWordError(null);

    if (editingId) {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          userEmail,
          subject,
          title: (title.trim() || 'Untitled Note').toUpperCase(),
          text,
          color: selectedColor,
          fontSize,
        }),
      });
      if (!res.ok) return;
      await fetchNotes();
      setEditingId(null);
      setTitle('');
      setDraft('');
      setSelectedColor('#fde68a');
      setFontSize(100);
      setShowColorOptions(false);
      return;
    }

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        subject,
        title: (title.trim() || 'Untitled Note').toUpperCase(),
        text,
        color: selectedColor,
        fontSize,
      }),
    });
    if (!res.ok) return;
    await fetchNotes();
    setTitle('');
    setDraft('');
    setSelectedColor('#fde68a');
    setFontSize(100);
    setShowColorOptions(false);
  };

  const startEdit = (note: SavedNote) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setDraft(note.text);
    setSelectedColor(note.color || '#fde68a');
    setFontSize(note.fontSize || 100);
    setShowColorOptions(false);
  };

  const removeNote = async (id: string) => {
    const res = await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        userEmail,
        subject,
      }),
    });
    if (!res.ok) return;
    await fetchNotes();
    if (editingId === id) {
      setEditingId(null);
      setTitle('');
      setDraft('');
      setSelectedColor('#fde68a');
      setFontSize(100);
      setShowColorOptions(false);
    }
  };

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/20 animate-fade-in-up card-float">
      <h2 className="text-3xl font-bold text-white mb-3 font-space-grotesk flex items-center gap-3">
        <span className="text-4xl">🗒️</span> My Notes
      </h2>
      <p className="text-white/70 mb-5">
        Apne {subject || 'learning'} ke notes yahan save karo. Notes SQL database me save honge.
      </p>

      {!userEmail && (
        <p className="text-red-300 text-sm mb-4">Please login first to save notes in SQL database.</p>
      )}

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.toUpperCase())}
          placeholder="Add headline..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
          style={{
            color: selectedColor,
            WebkitTextFillColor: selectedColor,
            caretColor: selectedColor,
          }}
        />

        <textarea
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            const totalWords = countWords(next);
            if (totalWords > MAX_NOTE_WORDS) {
              setWordError(`Word limit exceeded: ${totalWords}/${MAX_NOTE_WORDS}`);
            } else {
              setWordError(null);
            }
          }}
          placeholder="Write your notes here..."
          className="w-full min-h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/20 placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
          style={{
            fontSize: `${fontSize}%`,
            color: selectedColor,
            WebkitTextFillColor: selectedColor,
            caretColor: selectedColor,
          }}
        />

        <div>
          <button
            type="button"
            onClick={() => setShowColorOptions((prev) => !prev)}
            className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
          >
            {showColorOptions ? 'Hide Color Options' : 'Choose Color'}
          </button>

          {showColorOptions && (
            <div className="flex flex-wrap gap-2 mt-3">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.value);
                    setShowColorOptions(false);
                  }}
                  className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                    selectedColor === c.value
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/30 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                  style={{
                    boxShadow: selectedColor === c.value ? `0 0 0 1px ${c.value} inset` : undefined,
                  }}
                  aria-label={`Select ${c.name}`}
                  title={c.name}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-sm mb-2">Text size</p>
            <span className="text-white/80 text-sm">{fontSize}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.max(MIN_FONT_PERCENT, prev - FONT_STEP))}
              disabled={fontSize <= MIN_FONT_PERCENT}
              className="px-3 py-1 rounded-lg bg-white/10 text-white border border-white/20 disabled:opacity-40"
            >
              -
            </button>
            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/20 text-white min-w-20 text-center">
              {fontSize}%
            </div>
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.min(MAX_FONT_PERCENT, prev + FONT_STEP))}
              disabled={fontSize >= MAX_FONT_PERCENT}
              className="px-3 py-1 rounded-lg bg-white/10 text-white border border-white/20 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`${countWords(draft) > MAX_NOTE_WORDS ? 'text-red-300' : 'text-white/70'}`}>
            Words: {countWords(draft)}/{MAX_NOTE_WORDS}
          </span>
          {wordError && <span className="text-red-300">{wordError}</span>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveNote}
            disabled={countWords(draft) > MAX_NOTE_WORDS || !userEmail}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? 'Update Note' : 'Save Note'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setDraft('');
                setSelectedColor('#fde68a');
                setFontSize(100);
                setShowColorOptions(false);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && (
          <p className="text-white/60 text-sm">Loading notes from SQL...</p>
        )}
        {notes.length === 0 && (
          <p className="text-white/50 text-sm">No notes yet. Add your first note above.</p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-4 rounded-xl border border-white/10"
            style={{
              backgroundColor: hexToRgba(note.color || '#fde68a', 0.2),
              borderLeft: `6px solid ${note.color || '#fde68a'}`,
            }}
          >
            <p
              className="font-extrabold text-lg mb-2 uppercase tracking-wide px-2 py-1 rounded-md inline-block"
              style={{
                color: '#111827',
                backgroundColor: note.color || '#fde68a',
              }}
            >
              {note.title || 'UNTITLED NOTE'}
            </p>
            <p className="whitespace-pre-wrap" style={{ fontSize: `${note.fontSize || 100}%`, color: note.color || '#fde68a' }}>
              {note.text}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-white/50">
                Updated: {new Date(note.updatedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(note)}
                  className="px-3 py-1 rounded-md bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 text-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  className="px-3 py-1 rounded-md bg-red-500/20 border border-red-400/40 text-red-100 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
