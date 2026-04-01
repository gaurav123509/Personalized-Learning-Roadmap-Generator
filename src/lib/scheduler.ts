/**
 * SM-2 Spaced Repetition Algorithm
 * Reference: https://en.wikipedia.org/wiki/SuperMemo#Algorithm_SM-2
 * 
 * This implements the SM-2 algorithm for calculating optimal review intervals.
 */

export interface FlashcardState {
  id: string;
  front: string;
  back: string;
  easiness: number; // EF (easiness factor), starts at 2.5
  interval: number; // days until next review
  repetitions: number; // number of times reviewed
  lastReviewed: number; // timestamp
  nextReview: number; // timestamp for next review
  createdAt: number;
}

export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5; // 0 = complete failure, 5 = perfect response

/**
 * SM-2 Algorithm: Update card state based on user's recall quality
 * @param card - Current flashcard state
 * @param quality - User's recall quality (0-5)
 * @returns Updated flashcard state
 */
export function updateCardSM2(card: FlashcardState, quality: RecallQuality): FlashcardState {
  const now = Date.now();

  // SM-2 formula for easiness factor
  let newEasiness = card.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEasiness = Math.max(1.3, newEasiness); // EF should never be less than 1.3

  let newInterval: number;
  let newRepetitions = card.repetitions + 1;

  if (quality < 3) {
    // Failed recall - reset
    newInterval = 0; // Review again tomorrow (in practice, 1 day = 86400000 ms)
    newRepetitions = 0;
  } else {
    // Successful recall
    if (newRepetitions === 1) {
      newInterval = 1; // 1 day
    } else if (newRepetitions === 2) {
      newInterval = 3; // 3 days
    } else {
      newInterval = Math.round(card.interval * newEasiness);
    }
  }

  const nextReviewTime = now + newInterval * 86400000; // Convert days to milliseconds

  return {
    ...card,
    easiness: parseFloat(newEasiness.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    lastReviewed: now,
    nextReview: nextReviewTime,
  };
}

/**
 * Get cards that are due for review (nextReview <= now)
 */
export function getDueCards(cards: FlashcardState[]): FlashcardState[] {
  const now = Date.now();
  return cards.filter((card) => card.nextReview <= now);
}

/**
 * Calculate statistics for a card set
 */
export function calculateStats(cards: FlashcardState[]) {
  const now = Date.now();
  const dueCount = cards.filter((c) => c.nextReview <= now).length;
  const totalReviews = cards.reduce((sum, c) => sum + c.repetitions, 0);
  const avgEasiness = cards.length > 0 ? (cards.reduce((sum, c) => sum + c.easiness, 0) / cards.length).toFixed(2) : '0';

  return {
    total: cards.length,
    dueCount,
    totalReviews,
    avgEasiness: parseFloat(avgEasiness as string),
  };
}
