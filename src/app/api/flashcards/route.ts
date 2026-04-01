import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/groq';

interface FlashcardRequest {
  subject: string;
  topics?: string[];
  cardCount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FlashcardRequest;

    // Validate input
    if (!body.subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject' },
        { status: 400 }
      );
    }

    const cardCount = body.cardCount || 10;

    // Generate flashcards using Groq
    const flashcards = await generateFlashcards(body.subject, body.topics, cardCount);

    return NextResponse.json(
      {
        subject: body.subject,
        cards: flashcards,
        count: flashcards.length,
        createdAt: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating flashcards:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to generate flashcards: ${errorMessage}` },
      { status: 500 }
    );
  }
}
