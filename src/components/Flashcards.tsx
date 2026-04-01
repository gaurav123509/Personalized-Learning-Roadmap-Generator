'use client';

import { useEffect, useState } from 'react';
import type { Flashcard } from '@/lib/types';
import { FlashcardState, updateCardSM2, getDueCards, calculateStats } from '@/lib/scheduler';

interface FlashcardsProps {
  subject: string;
}

export default function Flashcards({ subject }: FlashcardsProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardStates, setCardStates] = useState<FlashcardState[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerate, setShowGenerate] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ total: 0, dueCount: 0, totalReviews: 0, avgEasiness: 0 });

  // Load saved cards from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`flashcards:${subject}`);
    if (saved) {
      try {
        const { cards: savedCards, states: savedStates } = JSON.parse(saved);
        setCards(savedCards);
        setCardStates(savedStates);
        setShowGenerate(false);
        updateStats(savedStates);
      } catch (_) {}
    }
  }, [subject]);

  const updateStats = (states: FlashcardState[]) => {
    const s = calculateStats(states);
    setStats(s);
  };

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, cardCount: 10 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate flashcards');

      // Initialize card states with SM-2
      const now = Date.now();
      const newCardStates: FlashcardState[] = data.cards.map((card: Flashcard, idx: number) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        lastReviewed: now,
        nextReview: now,
        createdAt: now,
      }));

      setCards(data.cards);
      setCardStates(newCardStates);
      setShowGenerate(false);
      updateStats(newCardStates);
      localStorage.setItem(`flashcards:${subject}`, JSON.stringify({ cards: data.cards, states: newCardStates }));
    } catch (err) {
      console.error(err);
      alert('Could not generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = () => {
    const dueCards = getDueCards(cardStates);
    if (dueCards.length === 0) {
      alert('No cards due for review right now!');
      return;
    }
    setReviewMode(true);
    setIsFlipped(false);
    setCurrentCardIndex(0);
  };

  const recordResponse = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const dueCards = getDueCards(cardStates);
    const currentCard = dueCards[currentCardIndex];

    // Find and update the card in cardStates
    const updatedStates = cardStates.map((state) =>
      state.id === currentCard.id ? updateCardSM2(state, quality) : state
    );

    setCardStates(updatedStates);
    updateStats(updatedStates);
    localStorage.setItem(`flashcards:${subject}`, JSON.stringify({ cards, states: updatedStates }));

    // Move to next card or exit review
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      alert(`Review complete! You reviewed ${dueCards.length} cards.`);
      setReviewMode(false);
      setCurrentCardIndex(0);
    }
  };

  const handleRegenerate = async () => {
    if (window.confirm('This will replace all existing flashcards. Continue?')) {
      setShowGenerate(true);
      await fetchFlashcards();
    }
  };

  if (showGenerate) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Flashcards — {subject}</h3>
            <p className="text-white/70 text-sm">Spaced Repetition Learning</p>
          </div>
          <button
            onClick={fetchFlashcards}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>
    );
  }

  if (reviewMode && cardStates.length > 0) {
    const dueCards = getDueCards(cardStates);
    if (dueCards.length === 0) {
      return (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-white text-lg">No cards due for review right now!</p>
          <button onClick={() => setReviewMode(false)} className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white">
            Back to Overview
          </button>
        </div>
      );
    }

    const currentCard = dueCards[currentCardIndex];

    return (
      <div className="p-6 rounded-lg bg-gradient-to-b from-white/5 to-white/3 border border-white/10 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Review Mode — {subject}</h3>
            <p className="text-white/70 text-sm">
              Card {currentCardIndex + 1} of {dueCards.length}
            </p>
          </div>
          <button onClick={() => setReviewMode(false)} className="px-3 py-1 bg-gray-700 rounded-md text-white text-sm">
            Exit
          </button>
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="h-64 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center cursor-pointer transform transition-transform hover:scale-105 shadow-lg"
        >
          <div className="text-center px-6">
            <p className="text-white/70 text-sm mb-4">{isFlipped ? 'Answer' : 'Question'}</p>
            <p className="text-2xl font-bold text-white break-words">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
          </div>
        </div>

        <p className="text-white/50 text-center text-sm">Click the card to flip</p>

        {/* Response Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => recordResponse(0)}
            className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
          >
            Again (0)
          </button>
          <button
            onClick={() => recordResponse(1)}
            className="px-3 py-2 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold"
          >
            Hard (1)
          </button>
          <button
            onClick={() => recordResponse(3)}
            className="px-3 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-semibold"
          >
            Good (3)
          </button>
          <button
            onClick={() => recordResponse(5)}
            className="px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
          >
            Perfect (5)
          </button>
        </div>

        <p className="text-white/50 text-xs text-center">
          Rate your recall: Again (forgot) → Hard (struggled) → Good (ok) → Perfect (instant)
        </p>
      </div>
    );
  }

  // Overview mode
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Flashcards — {subject}</h3>
          <p className="text-white/70 text-sm">
            {stats.total} cards • {stats.dueCount} due • {stats.totalReviews} reviews
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReviewClick}
            disabled={stats.dueCount === 0}
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-lg disabled:opacity-50 font-semibold"
          >
            Review ({stats.dueCount})
          </button>
          <button onClick={handleRegenerate} className="px-3 py-2 bg-purple-600 rounded-md text-white text-sm">
            Regenerate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-md bg-white/3">
          <p className="text-white/70 text-sm">Total Cards</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-3 rounded-md bg-white/3">
          <p className="text-white/70 text-sm">Due Now</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.dueCount}</p>
        </div>
        <div className="p-3 rounded-md bg-white/3">
          <p className="text-white/70 text-sm">Avg Easiness</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.avgEasiness.toFixed(1)}</p>
        </div>
      </div>

      {/* Card Preview */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {cardStates.slice(0, 5).map((state, idx) => (
          <div key={state.id} className="p-3 rounded-md bg-white/3 flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{state.front}</p>
              <p className="text-white/60 text-xs mt-1">
                Easiness: {state.easiness.toFixed(2)} • Reps: {state.repetitions}
              </p>
            </div>
            <span className={`ml-2 text-xs px-2 py-1 rounded ${
              state.nextReview <= Date.now() ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-700 text-gray-300'
            }`}>
              {state.nextReview <= Date.now() ? 'Due' : 'Later'}
            </span>
          </div>
        ))}
        {cardStates.length > 5 && (
          <p className="text-white/50 text-xs p-3 text-center">+{cardStates.length - 5} more cards</p>
        )}
      </div>
    </div>
  );
}
