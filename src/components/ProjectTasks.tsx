"use client";

import { useEffect, useState } from 'react';
import type { ProjectTasks, ProjectTask } from '@/lib/types';

interface ProjectTasksProps {
  subject: string;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export default function ProjectTasks({ subject, complexity = 'moderate' }: ProjectTasksProps) {
  const [tasksPack, setTasksPack] = useState<ProjectTasks | null>(null);
  const [showTasks, setShowTasks] = useState(false);

  useEffect(() => {
    if (!showTasks) return;
    const saved = localStorage.getItem(`projecttasks:${subject}`);
    if (saved) {
      try {
        setTasksPack(JSON.parse(saved));
      } catch (_) {}
    }
  }, [subject, showTasks]);

  const fetchTasks = async () => {
    setShowTasks(true);
    try {
      const res = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, complexity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTasksPack(data);
      localStorage.setItem(`projecttasks:${subject}`, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      alert('Could not generate project tasks');
      setShowTasks(false);
    }
  };

  const toggleDone = (id: string) => {
    if (!tasksPack) return;
    const updated = { ...tasksPack, tasks: tasksPack.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
    setTasksPack(updated);
    localStorage.setItem(`projecttasks:${subject}`, JSON.stringify(updated));
  };

  if (!tasksPack) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Project Tasks — {subject}</h3>
            <p className="text-white/70 text-sm">Complexity: {complexity}</p>
          </div>
          <button onClick={fetchTasks} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-purple-600 text-white rounded-lg">Generate Tasks</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Project Tasks — {tasksPack.subject}</h3>
        <button onClick={fetchTasks} className="px-3 py-1 bg-purple-600 rounded-md text-white">Regenerate</button>
      </div>

      <div className="space-y-3">
        {tasksPack.tasks.map((t: ProjectTask) => (
          <div key={t.id} className="p-3 rounded-md bg-white/3 flex items-start justify-between">
            <div>
              <div className="text-white font-semibold">{t.title}</div>
              <div className="text-white/70 text-sm">{t.description}</div>
              <div className="text-white/60 text-xs mt-1">Milestone: {t.milestone} • Est: {t.estimated_hours ?? '-'}h</div>
            </div>
            <div>
              <input type="checkbox" checked={!!t.done} onChange={() => toggleDone(t.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
