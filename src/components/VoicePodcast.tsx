'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUserEmail } from '@/lib/auth';

interface VoicePodcastProps {
  subject: string;
}

interface NoteRow {
  id: string;
  title: string;
  text: string;
}

function estimateMinutes(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 130));
}

export default function VoicePodcast({ subject }: VoicePodcastProps) {
  const [script, setScript] = useState('');
  const [notesCount, setNotesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState(1);
  const [customContent, setCustomContent] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stopRequestedRef = useRef(false);

  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!hasSpeech) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (!selectedVoice && list.length) setSelectedVoice(list[0].name);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [hasSpeech, selectedVoice]);

  useEffect(() => {
    if (!hasSpeech) return;
    const id = setInterval(() => {
      const active = window.speechSynthesis.speaking || window.speechSynthesis.pending;
      setPlaying(active);
    }, 250);
    return () => clearInterval(id);
  }, [hasSpeech]);

  const normalizedSubject = useMemo(() => subject.trim() || 'General', [subject]);

  const fetchNotes = async () => {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('Please login first to fetch saved notes.');
    }

    const res = await fetch(
      `/api/notes?userEmail=${encodeURIComponent(userEmail)}&subject=${encodeURIComponent(normalizedSubject)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch notes');
    const notes = (Array.isArray(data.notes) ? data.notes : []) as NoteRow[];
    setNotesCount(notes.length);
    return notes;
  };

  const generatePodcast = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const hasCustomContent = customContent.trim().length > 0;
      let notes: NoteRow[] = [];
      const canReadSavedNotes = Boolean(getCurrentUserEmail());

      if (canReadSavedNotes) {
        try {
          notes = await fetchNotes();
        } catch (err) {
          if (!hasCustomContent) {
            throw err;
          }
          setStatus('Could not fetch notes, generating podcast from custom content only.');
        }
      } else if (!hasCustomContent) {
        throw new Error('Please login first or provide custom content.');
      } else {
        setNotesCount(0);
        setStatus('Generating podcast from custom content only.');
      }

      if (!notes.length && !hasCustomContent) {
        setScript('');
        setStatus('No notes found for this subject. Add notes or provide custom content.');
        return;
      }

      const packedNotes = notes.map((n) => `${n.title}: ${n.text}`);
      const res = await fetch('/api/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: normalizedSubject,
          notes: packedNotes,
          customContent,
          stylePrompt,
          minutes: 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate podcast');
      setScript(data.script || '');
      setStatus('Revision podcast script generated. You can now play it.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  const playScript = () => {
    if (!hasSpeech) {
      setStatus('Speech synthesis is not supported in this browser.');
      return;
    }
    if (!script.trim()) {
      setStatus('Generate script first.');
      return;
    }

    stopRequestedRef.current = false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.rate = speed;
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utter.voice = voice;
    utter.onstart = () => {
      setPlaying(true);
    };

    utter.onend = () => {
      setPlaying(false);
      setStatus(stopRequestedRef.current ? 'Playback stopped.' : 'Playback complete.');
    };
    utter.onerror = () => {
      setPlaying(false);
      setStatus('Playback failed.');
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
    setStatus('Playing revision podcast...');
  };

  const stopScript = () => {
    if (!hasSpeech) return;
    stopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    // Some browsers keep pending utterances briefly; clear queue again.
    setTimeout(() => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }, 80);
    setPlaying(false);
    setStatus('Playback stopped.');
  };

  const canStop =
    hasSpeech &&
    (playing ||
      (typeof window !== 'undefined' &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending)));

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Voice Notes + Revision Podcast</h3>
          <p className="text-white/70 text-sm">
            Notes ko 10-minute revision podcast script me convert karo and audio me suno.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generatePodcast()}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate 10-min Podcast'}
        </button>
      </div>

      <div className="text-sm text-white/70">
        Subject: <span className="text-white">{normalizedSubject}</span> • Notes found: {notesCount}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-white/80 text-sm mb-1">Custom Content (optional)</label>
          <textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Yahan apna custom content do jo podcast me include karna hai..."
            className="w-full min-h-20 px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder-white/50"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm mb-1">Podcast Style (optional)</label>
          <input
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            placeholder="e.g., simple Hinglish, motivational tone, exam-focused, fast recap"
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder-white/50"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <button
          type="button"
          onClick={playScript}
          disabled={!script || loading}
          className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-60"
        >
          ▶ Play Audio
        </button>
        <button
          type="button"
          onClick={stopScript}
          disabled={!canStop}
          className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-60"
        >
          ■ Stop
        </button>

        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">Speed</span>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span className="text-white text-sm">{speed.toFixed(1)}x</span>
        </div>

        {voices.length > 0 && (
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {status && <p className="text-cyan-200 text-sm">{status}</p>}

      {script && (
        <div className="p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm">Podcast Script (~{estimateMinutes(script)} min)</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(script)}
              className="px-2 py-1 rounded-md bg-white/10 text-white text-xs"
            >
              Copy
            </button>
          </div>
          <p className="text-white/85 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{script}</p>
        </div>
      )}
    </div>
  );
}
