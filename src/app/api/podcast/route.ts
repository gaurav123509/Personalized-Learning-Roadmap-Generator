import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/groq';

function splitIntoChunks(lines: string[], size: number) {
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size));
  }
  return chunks;
}

function createFallbackPodcastScript(subject: string, notes: string[], customContent: string, minutes: number): string {
  const mergedInput = [...notes, customContent].join('\n').trim();
  const rawLines = mergedInput
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sourceLines = rawLines.length
    ? rawLines
    : [
        `${subject} ke core concepts revise karo.`,
        'Definitions short me yaad rakho.',
        '1 practical example per concept zaroor dekho.',
        'Har topic ke end me quick self-test karo.',
      ];

  const sectionSize = Math.max(2, Math.ceil(sourceLines.length / 4));
  const sections = splitIntoChunks(sourceLines, sectionSize).slice(0, 4);
  const recallBase = sourceLines.slice(0, 5);
  const estimatedWordTarget = Math.max(450, Math.min(1500, minutes * 110));

  const body = [
    `Welcome back! Aaj hum ${subject} ka fast but structured revision karenge.`,
    `Yeh script around ${minutes} minute ke revision flow ke liye design ki gayi hai.`,
    '',
    'Quick Overview:',
    `${subject} me clarity lane ke liye hum foundations, implementation thinking, mistakes, aur recall pattern cover karenge.`,
    '',
    ...sections.map((chunk, idx) => {
      const lines = chunk
        .map((line, lineIdx) => `${lineIdx + 1}. ${line}`)
        .join('\n');
      return `Topic Block ${idx + 1}:\n${lines}\nMemory Trick: Is block ko "Explain -> Example -> Error-check" pattern se revise karo.`;
    }),
    '',
    'Rapid Fire Recall:',
    ...recallBase.map((line, idx) => `${idx + 1}. ${line} ka one-line explanation bolo.`),
    '',
    'Closing:',
    `Aaj ka target complete. Ab next step: 20 minute active recall + 10 minute practice questions on ${subject}.`,
    `Approx target length: ${estimatedWordTarget} words equivalent revision flow.`,
  ];

  return body.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const subject: string = (body?.subject || 'General').toString();
    const notes: string[] = Array.isArray(body?.notes) ? body.notes : [];
    const customContent: string = (body?.customContent || '').toString().trim();
    const stylePrompt: string = (body?.stylePrompt || '').toString().trim();
    const minutes = Number(body?.minutes || 10);

    if (!notes.length && !customContent) {
      return NextResponse.json({ error: 'Provide notes or custom content to build podcast.' }, { status: 400 });
    }

    const combinedNotes = notes.length ? notes.join('\n- ') : 'No saved notes used.';
    const wordTarget = Math.max(800, Math.min(1800, minutes * 130));

    const system = {
      role: 'system' as const,
      content:
        'You are an expert revision coach. Create clear, practical spoken-style study scripts. Keep structure clean and memory-friendly.',
    };

    const user = {
      role: 'user' as const,
      content: `Create a revision podcast script for subject "${subject}".
Use these notes:
- ${combinedNotes}

Additional custom content from user:
${customContent || 'None'}

Podcast style requested by user:
${stylePrompt || 'Balanced revision style, clear and concise.'}

Requirements:
- Target around ${wordTarget} words (for around ${minutes} minutes)
- Easy spoken language
- Start with a 30-second overview
- Then topic-by-topic revision
- Include quick memory tricks
- End with 5 rapid-fire recall questions
- Output plain text only (no markdown headings like # or bullets with code formatting).`,
    };

    let script = '';
    try {
      script = await chatWithAI([system, user]);
    } catch {
      script = createFallbackPodcastScript(subject, notes, customContent, minutes);
    }
    return NextResponse.json({ script }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate podcast script: ${message}` }, { status: 500 });
  }
}
