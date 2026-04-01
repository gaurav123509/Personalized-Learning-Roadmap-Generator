import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message: string = body?.message;
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const system = {
      role: 'system',
      content: 'You are a helpful assistant that answers questions about learning, roadmaps, and study plans. Keep answers concise and practical.'
    };

    const user = { role: 'user', content: message };

    const reply = await chatWithAI([system as any, user as any]);

    return NextResponse.json({ reply }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
