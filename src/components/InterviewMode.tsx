'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  InterviewFeedback,
  InterviewQuestion,
  InterviewQuestionPack,
  InterviewRound,
} from '@/lib/types';

interface InterviewModeProps {
  subject: string;
}

type SimulationMode = 'single' | 'full';

function getRoundTimer(round: InterviewRound) {
  return round === 'hr' ? 120 : 180;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function InterviewMode({ subject }: InterviewModeProps) {
  const [round, setRound] = useState<InterviewRound>('technical');
  const [mode, setMode] = useState<SimulationMode>('single');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [timer, setTimer] = useState(getRoundTimer('technical'));
  const [sessionDone, setSessionDone] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const isRunning = total > 0 && !sessionDone;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, currentIndex, round]);

  useEffect(() => {
    if (timer === 0 && isRunning && !feedback) {
      setStatus('Time up for this question. Submit your answer or go next.');
    }
  }, [timer, isRunning, feedback]);

  const canSubmit = useMemo(
    () => !!currentQuestion && answer.trim().length > 0 && !evaluating,
    [currentQuestion, answer, evaluating]
  );

  const startRound = async (targetRound: InterviewRound, selectedMode: SimulationMode) => {
    setMode(selectedMode);
    setRound(targetRound);
    setLoadingQuestions(true);
    setStatus(null);
    setSessionDone(false);
    setCurrentIndex(0);
    setAnswer('');
    setFeedback(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          subject,
          round: targetRound,
          count: selectedMode === 'full' ? 3 : 5,
        }),
      });
      const data = (await res.json()) as InterviewQuestionPack & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setTimer(getRoundTimer(targetRound));
      setStatus(
        selectedMode === 'full'
          ? `Full mock started: ${targetRound.toUpperCase()} round`
          : `${targetRound.toUpperCase()} round started`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate interview questions';
      setStatus(msg);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return;
    setEvaluating(true);
    setStatus(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          subject,
          round,
          question: currentQuestion.question,
          answer,
        }),
      });
      const data = (await res.json()) as InterviewFeedback & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate answer');
      setFeedback(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not evaluate answer';
      setStatus(msg);
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = async () => {
    setAnswer('');
    setFeedback(null);
    setStatus(null);

    if (currentIndex + 1 < total) {
      setCurrentIndex((i) => i + 1);
      setTimer(getRoundTimer(round));
      return;
    }

    if (mode === 'full' && round === 'hr') {
      await startRound('technical', 'full');
      return;
    }

    setSessionDone(true);
    setStatus('Interview session complete. Great effort!');
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Interview Mode — {subject}</h3>
          <p className="text-white/70 text-sm">Mock HR + Technical rounds with timer and feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void startRound('hr', 'single')}
            disabled={loadingQuestions}
            className="px-3 py-2 rounded-md bg-pink-600 text-white disabled:opacity-60"
          >
            HR Round
          </button>
          <button
            type="button"
            onClick={() => void startRound('technical', 'single')}
            disabled={loadingQuestions}
            className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
          >
            Technical Round
          </button>
          <button
            type="button"
            onClick={() => void startRound('hr', 'full')}
            disabled={loadingQuestions}
            className="px-3 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-purple-600 text-white disabled:opacity-60"
          >
            Full Mock (HR+Tech)
          </button>
        </div>
      </div>

      {status && <p className="text-cyan-200 text-sm">{status}</p>}

      {isRunning && currentQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">
              {round.toUpperCase()} • Question {currentIndex + 1}/{total}
            </span>
            <span className={`font-bold ${timer <= 20 ? 'text-red-300' : 'text-yellow-300'}`}>
              ⏱ {formatTime(timer)}
            </span>
          </div>

          <div className="p-3 rounded-md bg-white/5 border border-white/10 text-white font-medium">
            {currentQuestion.question}
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full min-h-28 px-3 py-2 rounded-md bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={!canSubmit}
              className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
            >
              {evaluating ? 'Evaluating...' : 'Submit Answer'}
            </button>
            <button
              type="button"
              onClick={() => void nextQuestion()}
              className="px-4 py-2 rounded-md bg-purple-600 text-white"
            >
              Next
            </button>
          </div>

          {feedback && (
            <div className="p-4 rounded-md bg-white/5 border border-white/10 space-y-3">
              <p className="text-white">
                Score: <span className="font-bold text-yellow-300">{feedback.score}/10</span>
              </p>
              <p className="text-white/90">{feedback.feedback}</p>
              <div>
                <p className="text-green-300 font-semibold">Strengths</p>
                <ul className="text-white/80 text-sm list-disc ml-5">
                  {feedback.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-orange-300 font-semibold">Improvements</p>
                <ul className="text-white/80 text-sm list-disc ml-5">
                  {feedback.improvements?.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-cyan-300 font-semibold">Model Answer</p>
                <p className="text-white/80 text-sm">{feedback.modelAnswer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!isRunning && (
        <p className="text-white/60 text-sm">
          Start any round to begin simulation. Use full mock for HR + Technical back-to-back practice.
        </p>
      )}
    </div>
  );
}
