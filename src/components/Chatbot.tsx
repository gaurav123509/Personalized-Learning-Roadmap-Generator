'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      if (res.ok) {
        const replyMsg: ChatMessage = { id: String(Date.now() + 1), role: 'assistant', content: data.reply };
        setMessages((m) => [...m, replyMsg]);
      } else {
        const errorMsg: ChatMessage = { id: String(Date.now() + 2), role: 'assistant', content: data.error || 'Failed to get reply' };
        setMessages((m) => [...m, errorMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = { id: String(Date.now() + 3), role: 'assistant', content: 'Network error' };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 text-white shadow-2xl flex items-center justify-center text-2xl btn-glow"
          aria-label="Open chat"
        >
          🧞‍♂️
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-28 right-6 w-96 max-h-[70vh] bg-white/6 backdrop-blur rounded-2xl border border-yellow-400/50 z-50 shadow-2xl overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(13,27,42,0.7), rgba(82,9,71,0.5))',
            borderColor: '#d4af37'
          }}>
          <div className="px-4 py-3 border-b border-yellow-400/30 flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-purple-500/10">
            <div>
              <div className="text-yellow-300 font-bold">💡 Ask AI</div>
              <div className="text-white/60 text-sm">Get quick help about learning and roadmaps</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80">✕</button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-white/60 text-sm">Hi! Every expert was once a beginner. Let’s start.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`p-3 rounded-xl max-w-full ${m.role === 'user' ? 'bg-yellow-500/20 self-end text-yellow-100 border border-yellow-400/30' : 'bg-purple-500/20 text-white/90 border border-purple-400/30'}`}>
                <div className="text-sm">{m.content}</div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-yellow-400/30 flex gap-2 bg-gradient-to-r from-yellow-500/5 to-purple-500/5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your question..."
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/50 focus:outline-none border border-yellow-400/20 focus:border-yellow-400/60"
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-semibold disabled:opacity-50 hover:shadow-lg transition"
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
