import { NextRequest, NextResponse } from 'next/server';
import { evaluateInterviewAnswer, generateInterviewQuestions } from '@/lib/groq';
import { InterviewRound } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action: 'generate' | 'evaluate' = body?.action;
    if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

    if (action === 'generate') {
      const subject: string = body?.subject || 'General';
      const round: InterviewRound = body?.round === 'hr' ? 'hr' : 'technical';
      const count = Number(body?.count || 5);
      const pack = await generateInterviewQuestions(subject, round, count);
      return NextResponse.json(pack, { status: 200 });
    }

    const subject: string = body?.subject || 'General';
    const round: InterviewRound = body?.round === 'hr' ? 'hr' : 'technical';
    const question: string = body?.question || '';
    const answer: string = body?.answer || '';
    if (!question.trim()) return NextResponse.json({ error: 'question is required' }, { status: 400 });
    if (!answer.trim()) return NextResponse.json({ error: 'answer is required' }, { status: 400 });

    const feedback = await evaluateInterviewAnswer({ subject, round, question, answer });
    return NextResponse.json(feedback, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Interview API failed: ${message}` }, { status: 500 });
  }
}
