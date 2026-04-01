import { NextRequest, NextResponse } from 'next/server';
import { createNote, deleteNote, listNotes, updateNote } from '@/lib/sqlite';

export const runtime = 'nodejs';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('userEmail') || '';
    const subject = request.nextUrl.searchParams.get('subject') || '';
    if (!userEmail.trim()) return badRequest('userEmail is required');
    if (!subject.trim()) return badRequest('subject is required');

    const notes = listNotes(userEmail, subject);
    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch notes: ${message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userEmail = body.userEmail || '';
    const subject = body.subject || '';
    const title = body.title || '';
    const text = body.text || '';
    const color = body.color || '#f59e0b';
    const fontSize = Number(body.fontSize || 16);

    if (!userEmail.trim()) return badRequest('userEmail is required');
    if (!subject.trim()) return badRequest('subject is required');
    if (!text.trim()) return badRequest('text is required');

    const note = createNote({
      userEmail,
      subject,
      title,
      text,
      color,
      fontSize,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create note: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || '';
    const userEmail = body.userEmail || '';
    const subject = body.subject || '';
    const title = body.title || '';
    const text = body.text || '';
    const color = body.color || '#f59e0b';
    const fontSize = Number(body.fontSize || 16);

    if (!id.trim()) return badRequest('id is required');
    if (!userEmail.trim()) return badRequest('userEmail is required');
    if (!subject.trim()) return badRequest('subject is required');
    if (!text.trim()) return badRequest('text is required');

    const ok = updateNote({
      id,
      userEmail,
      subject,
      title,
      text,
      color,
      fontSize,
    });

    if (!ok) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to update note: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || '';
    const userEmail = body.userEmail || '';
    const subject = body.subject || '';

    if (!id.trim()) return badRequest('id is required');
    if (!userEmail.trim()) return badRequest('userEmail is required');
    if (!subject.trim()) return badRequest('subject is required');

    const ok = deleteNote({ id, userEmail, subject });
    if (!ok) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete note: ${message}` }, { status: 500 });
  }
}
