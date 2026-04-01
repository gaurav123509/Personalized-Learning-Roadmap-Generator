import { NextRequest, NextResponse } from 'next/server';
import { generateMockTest } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = body.subject || body.topic || 'General';
    const difficulty = body.difficulty || 'medium';
    const count = 50;

    const test = await generateMockTest(subject, difficulty, count);
    return NextResponse.json(test, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate mock test: ${msg}` }, { status: 500 });
  }
}
