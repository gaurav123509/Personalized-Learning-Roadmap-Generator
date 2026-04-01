'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Flashcards from '@/components/Flashcards';
import MockTest from '@/components/MockTest';
import ProjectTasks from '@/components/ProjectTasks';
import UserNotes from '@/components/UserNotes';
import InterviewMode from '@/components/InterviewMode';
import VoicePodcast from '@/components/VoicePodcast';
import ProfileMenu from '@/components/ProfileMenu';
import { clearSession, getCurrentUser, getCurrentUserEmail, isLoggedIn } from '@/lib/auth';

type Difficulty = 'easy' | 'medium' | 'hard';
type Complexity = 'simple' | 'moderate' | 'complex';

interface DashboardStats {
  notesCount: number;
  quizQuestions: number;
  projectTasks: number;
  flashcardsCount: number;
  dueCards: number;
}

async function countSubjectNotes(subject: string, userEmail: string) {
  if (!subject.trim() || !userEmail.trim()) return 0;
  try {
    const res = await fetch(
      `/api/notes?userEmail=${encodeURIComponent(userEmail)}&subject=${encodeURIComponent(subject)}`
    );
    const data = await res.json();
    if (!res.ok) return 0;
    return Array.isArray(data.notes) ? data.notes.length : 0;
  } catch {
    return 0;
  }
}

function getStoredQuizCount(subject: string) {
  const raw = localStorage.getItem(`mocktest:${subject}`);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { questions?: unknown[] };
    return Array.isArray(parsed?.questions) ? parsed.questions.length : 0;
  } catch {
    return 0;
  }
}

function getStoredTaskCount(subject: string) {
  const raw = localStorage.getItem(`projecttasks:${subject}`);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { tasks?: unknown[] };
    return Array.isArray(parsed?.tasks) ? parsed.tasks.length : 0;
  } catch {
    return 0;
  }
}

function getStoredFlashcardStats(subject: string) {
  const raw = localStorage.getItem(`flashcards:${subject}`);
  if (!raw) return { total: 0, due: 0 };
  try {
    const parsed = JSON.parse(raw) as { states?: Array<{ nextReview?: number }> };
    const states = Array.isArray(parsed?.states) ? parsed.states : [];
    const now = Date.now();
    return {
      total: states.length,
      due: states.filter((s) => (s.nextReview ?? Number.MAX_SAFE_INTEGER) <= now).length,
    };
  } catch {
    return { total: 0, due: 0 };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('User');
  const [subject, setSubject] = useState('Java');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [complexity, setComplexity] = useState<Complexity>('moderate');
  const [stats, setStats] = useState<DashboardStats>({
    notesCount: 0,
    quizQuestions: 0,
    projectTasks: 0,
    flashcardsCount: 0,
    dueCards: 0,
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      setAuthChecked(true);
      return;
    }
    setEmail(getCurrentUserEmail() || '');
    const user = getCurrentUser();
    setName(user?.name || 'User');
    setAuthChecked(true);
  }, [router]);

  const normalizedSubject = useMemo(() => subject.trim() || 'General', [subject]);

  const refreshStats = async () => {
    const notesCount = await countSubjectNotes(normalizedSubject, email);
    const quizQuestions = getStoredQuizCount(normalizedSubject);
    const projectTasks = getStoredTaskCount(normalizedSubject);
    const flash = getStoredFlashcardStats(normalizedSubject);
    setStats({
      notesCount,
      quizQuestions,
      projectTasks,
      flashcardsCount: flash.total,
      dueCards: flash.due,
    });
  };

  useEffect(() => {
    void refreshStats();
  }, [normalizedSubject, email]);

  if (!authChecked) {
    return (
      <div className="relative min-h-screen flex items-center justify-center z-10">
        <p className="text-white/80">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-8 px-4 z-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="glass-dark rounded-3xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white font-space-grotesk">Learning Dashboard</h1>
              <p className="text-white/70 mt-1">
                {email ? `Signed in as ${email}` : 'Your personal learning control center'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ProfileMenu
                userName={name}
                userEmail={email}
                primaryLinkHref="/"
                primaryLinkLabel="Open Roadmap Builder"
                onLogout={() => {
                  clearSession();
                  router.replace('/login');
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-dark rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-white/90 text-sm mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Java, React, DSA"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm mb-2">Quiz Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-white/90 text-sm mb-2">Project Complexity</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as Complexity)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none"
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void refreshStats()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold"
            >
              Refresh Dashboard Stats
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <p className="text-white/60 text-sm">Notes</p>
            <p className="text-2xl font-bold text-white">{stats.notesCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <p className="text-white/60 text-sm">Quiz Questions</p>
            <p className="text-2xl font-bold text-white">{stats.quizQuestions}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <p className="text-white/60 text-sm">Project Tasks</p>
            <p className="text-2xl font-bold text-white">{stats.projectTasks}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <p className="text-white/60 text-sm">Flashcards</p>
            <p className="text-2xl font-bold text-white">{stats.flashcardsCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <p className="text-white/60 text-sm">Due Cards</p>
            <p className="text-2xl font-bold text-yellow-300">{stats.dueCards}</p>
          </div>
        </div>

        <div className="space-y-6">
          <UserNotes subject={normalizedSubject} />
          <VoicePodcast subject={normalizedSubject} />
          <InterviewMode subject={normalizedSubject} />
          <MockTest subject={normalizedSubject} difficulty={difficulty} count={50} />
          <ProjectTasks subject={normalizedSubject} complexity={complexity} />
          <Flashcards subject={normalizedSubject} />
        </div>
      </div>
    </div>
  );
}
