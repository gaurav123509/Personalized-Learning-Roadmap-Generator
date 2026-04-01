"use client";

import { useEffect, useState } from 'react';
import type { MockTest, Question } from '@/lib/types';

interface MockTestProps {
  subject: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
}

export default function MockTest({ subject, difficulty = 'medium', count = 50 }: MockTestProps) {
  const [test, setTest] = useState<MockTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    // Subject change ke saath stale test ko clear karo, phir new subject ka cached test load karo (if available).
    setAnswers({});
    setScore(null);

    const saved = localStorage.getItem(`mocktest:${subject}`);
    if (saved) {
      try {
        setTest(JSON.parse(saved));
        setShowTest(true);
        return;
      } catch (_) {}
    }

    setTest(null);
    setShowTest(false);
  }, [subject]);

  const fetchTest = async () => {
    setLoading(true);
    setShowTest(true);
    try {
      const res = await fetch('/api/mocktest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTest(data);
      localStorage.setItem(`mocktest:${subject}`, JSON.stringify(data));
      setAnswers({});
      setScore(null);
    } catch (err) {
      console.error(err);
      alert('Could not generate mock test');
      setShowTest(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (q: Question, val: string) => {
    setAnswers((s) => ({ ...s, [q.id]: val }));
  };

  const grade = () => {
    if (!test) return;
    let pts = 0;
    test.questions.forEach((q) => {
      const given = (answers[q.id] || '').trim().toLowerCase();
      const correct = (q.answer || '').trim().toLowerCase();
      if (!given) return;
      if (q.type === 'mcq') {
        if (given === correct) pts += q.points || 1;
      } else {
        // simple string match for short/code
        if (correct && given.includes(correct)) pts += q.points || 1;
      }
    });
    setScore(pts);
  };

  if (!test) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Mock Test — {subject}</h3>
            <p className="text-white/70 text-sm">Difficulty: {difficulty} • 50 questions</p>
          </div>
          <button onClick={fetchTest} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-purple-600 text-white rounded-lg">
            {loading ? 'Generating...' : 'Generate Test'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Mock Test — {test.subject}</h3>
        <div className="text-white/70">Questions: {test.questions.length}</div>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {test.questions.map((q, idx) => (
          <div key={q.id} className="p-3 bg-white/3 rounded-md">
            <div className="text-white font-semibold">{idx + 1}. {q.question}</div>
            {q.type === 'mcq' && q.choices && (
              <div className="mt-2 grid gap-2">
                {q.choices.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-white/90">
                    <input type="radio" name={q.id} value={c} checked={answers[q.id] === c} onChange={() => handleAnswer(q, c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type !== 'mcq' && (
              <input
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q, e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-md bg-white/5 text-white placeholder-white/50"
                placeholder="Your answer"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={grade} className="px-4 py-2 bg-yellow-400 rounded-md font-bold">Grade</button>
        <button onClick={fetchTest} className="px-4 py-2 bg-purple-600 rounded-md text-white">Regenerate</button>
        {score !== null && <div className="text-white/90">Score: {score}</div>}
      </div>
    </div>
  );
}
