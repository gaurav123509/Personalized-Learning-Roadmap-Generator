import { NextRequest, NextResponse } from 'next/server';
import { generateProjectTasks } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = body.subject || 'General';
    const complexity = body.complexity || 'moderate';

    const tasks = await generateProjectTasks(subject, complexity);
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate project tasks: ${msg}` }, { status: 500 });
  }
}
