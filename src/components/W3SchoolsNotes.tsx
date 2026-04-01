'use client';

import { Roadmap } from '@/lib/types';

interface W3SchoolsNotesProps {
  roadmap: Roadmap;
}

const W3SCHOOL_TOPIC_MAP: { keyword: string; title: string; url: string }[] = [
  { keyword: 'html', title: 'HTML Tutorial', url: 'https://www.w3schools.com/html/' },
  { keyword: 'css', title: 'CSS Tutorial', url: 'https://www.w3schools.com/css/' },
  { keyword: 'javascript', title: 'JavaScript Tutorial', url: 'https://www.w3schools.com/js/' },
  { keyword: 'typescript', title: 'TypeScript Tutorial', url: 'https://www.w3schools.com/typescript/' },
  { keyword: 'react', title: 'React Tutorial', url: 'https://www.w3schools.com/react/' },
  { keyword: 'node', title: 'Node.js Tutorial', url: 'https://www.w3schools.com/nodejs/' },
  { keyword: 'express', title: 'Express.js Tutorial', url: 'https://www.w3schools.com/nodejs/nodejs_express.asp' },
  { keyword: 'sql', title: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' },
  { keyword: 'mysql', title: 'MySQL Tutorial', url: 'https://www.w3schools.com/mysql/' },
  { keyword: 'mongodb', title: 'MongoDB Tutorial', url: 'https://www.w3schools.com/mongodb/' },
  { keyword: 'python', title: 'Python Tutorial', url: 'https://www.w3schools.com/python/' },
  { keyword: 'java', title: 'Java Tutorial', url: 'https://www.w3schools.com/java/' },
  { keyword: 'c++', title: 'C++ Tutorial', url: 'https://www.w3schools.com/cpp/' },
  { keyword: 'c#', title: 'C# Tutorial', url: 'https://www.w3schools.com/cs/' },
  { keyword: 'data structure', title: 'DSA Tutorial', url: 'https://www.w3schools.com/dsa/' },
  { keyword: 'api', title: 'Web API Tutorial', url: 'https://www.w3schools.com/js/js_api_intro.asp' },
  { keyword: 'json', title: 'JSON Tutorial', url: 'https://www.w3schools.com/js/js_json_intro.asp' },
  { keyword: 'git', title: 'Git Tutorial', url: 'https://www.w3schools.com/git/' },
];

function getRoadmapText(roadmap: Roadmap): string {
  const parts: string[] = [roadmap.title, roadmap.overview];

  for (const phase of roadmap.phases) {
    parts.push(phase.phase, phase.focus);
    for (const week of phase.weeks) {
      parts.push(week.project, week.milestone, ...(week.topics || []));
    }
  }

  return parts.join(' ').toLowerCase();
}

function getRelevantNotes(roadmap: Roadmap) {
  const text = getRoadmapText(roadmap);
  const matches = W3SCHOOL_TOPIC_MAP.filter((item) => text.includes(item.keyword));

  const unique = new Map<string, { title: string; url: string }>();
  for (const note of matches) {
    unique.set(note.url, { title: note.title, url: note.url });
  }

  const selected = Array.from(unique.values());
  if (selected.length > 0) return selected.slice(0, 8);

  // Safe default when no keyword match is found.
  return [
    { title: 'Java Tutorial', url: 'https://www.w3schools.com/java/' },
    { title: 'DSA Tutorial', url: 'https://www.w3schools.com/dsa/' },
    { title: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' },
  ];
}

export default function W3SchoolsNotes({ roadmap }: W3SchoolsNotesProps) {
  const notes = getRelevantNotes(roadmap);

  return (
    <div className="glass-dark rounded-3xl p-8 border border-white/20 animate-fade-in-up card-float">
      <h2 className="text-3xl font-bold text-white mb-3 font-space-grotesk flex items-center gap-3">
        <span className="text-4xl">📝</span> W3Schools Notes
      </h2>
      <p className="text-white/70 mb-6">
        Quick reference notes based on your roadmap topics.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <a
            key={note.url}
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/60 transition group"
          >
            <p className="text-white font-semibold group-hover:text-yellow-200 transition">
              {note.title}
            </p>
            <p className="text-white/50 text-xs mt-1 break-all">{note.url}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
