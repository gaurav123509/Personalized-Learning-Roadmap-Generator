'use client';

import { useState } from 'react';
import { Roadmap, UserInput } from '@/lib/types';

interface RoadmapDisplayProps {
  roadmap: Roadmap;
  userInput?: UserInput | null;
  onBack: () => void;
}

function normalizeResourceUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Model often returns "www.youtube..." without protocol; add https.
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getPhaseCourseUrl(phase: Roadmap['phases'][number], roadmapTitle: string): string {
  for (const week of phase.weeks) {
    for (const resource of week.resources || []) {
      const safeUrl = normalizeResourceUrl(resource.url);
      if (!safeUrl) continue;
      const host = new URL(safeUrl).hostname.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        return safeUrl;
      }
    }
  }

  const query = `${roadmapTitle} ${phase.focus} full course`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function buildProjectDetails(project: {
  title: string;
  topics: string[];
  milestone: string;
  week: number;
  estimatedHours: number;
  phaseFocus: string;
}) {
  const keyTopics = project.topics.slice(0, 4);
  const overview = `Is week ka goal "${project.title}" ko practical way me ship karna hai. Isme ${keyTopics.join(', ')} ko use karke ek working outcome banana hai jo milestone achieve kare.`;

  const roadmapSteps = [
    {
      title: '1) Plan and Scope',
      details: `Project requirements likho, wireframe/flow banao, aur ${keyTopics[0] || project.phaseFocus} ke basics finalize karo.`,
    },
    {
      title: '2) Build Core Features',
      details: `Core functionality implement karo using topics: ${keyTopics.join(', ')}.`,
    },
    {
      title: '3) Test and Debug',
      details: 'Edge cases check karo, bugs fix karo, aur output ko stable banao.',
    },
    {
      title: '4) Polish and Deliver',
      details: `UI/UX improvements + README notes add karo, then final outcome milestone ke against validate karo: ${project.milestone}.`,
    },
  ];

  const deliverables = [
    'Working project/demo',
    'Source code with clear file structure',
    'Short README (features + run steps)',
    `Milestone proof: ${project.milestone}`,
  ];

  const checklist = [
    `Estimated time used around ${project.estimatedHours} hours`,
    'At least one complete end-to-end flow works',
    'Major bugs resolved and tested',
    'Project can be shown in portfolio/interview',
  ];

  return { overview, roadmapSteps, deliverables, checklist };
}

export default function RoadmapDisplay({ roadmap, userInput, onBack }: RoadmapDisplayProps) {
  const [selectedProject, setSelectedProject] = useState<{
    phase: string;
    phaseFocus: string;
    week: number;
    estimatedHours: number;
    title: string;
    topics: string[];
    milestone: string;
  } | null>(null);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 z-10">
      {/* Animated Background Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/20 font-bold hover:scale-105 transform"
        >
          ← Back
        </button>

        {/* Main Header */}
        <div className="glass-dark rounded-3xl p-12 mb-8 animate-fade-in-up border border-white/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
          <div className="relative">
            <h1 className="text-6xl font-bold text-white mb-4 font-space-grotesk">{roadmap.title}</h1>
            <p className="text-2xl text-white/80 mb-8 leading-relaxed">{roadmap.overview}</p>
              <div className="flex flex-wrap gap-4">
              <div className="px-6 py-3 bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 rounded-xl text-white/90 font-bold backdrop-blur border border-yellow-400/30">
                📅 {roadmap.total_weeks} weeks total
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-purple-500/30 to-purple-600/30 rounded-xl text-white/90 font-bold backdrop-blur border border-purple-400/30">
                🎯 {roadmap.phases.length} phases
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-yellow-400/30 to-purple-500/30 rounded-xl text-white/90 font-bold backdrop-blur border border-yellow-400/30">
                ✨ Ready to start!
              </div>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-8 mb-8">
          {roadmap.phases.map((phase, phaseIndex) => (
            <div
              key={phaseIndex}
              className="glass-dark rounded-3xl p-10 border border-white/20 animate-fade-in-up card-float"
              style={{ animationDelay: `${phaseIndex * 0.1}s` }}
            >
              {/* Phase Header */}
              <div className="mb-10 pb-8 border-b border-white/10">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-purple-500 mb-3 font-space-grotesk">
                  {phase.phase}
                </h2>
                <p className="text-white/80 text-xl flex items-center gap-3">
                  <span className="text-3xl">🎯</span>
                  <span className="font-semibold">{phase.focus}</span>
                </p>
                <a
                  href={getPhaseCourseUrl(phase, roadmap.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-5 items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border border-red-300/30 hover:from-red-400 hover:to-red-500 transition"
                >
                  ▶ Watch Full YouTube Course
                </a>
              </div>

              {/* Weeks Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {phase.weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 card-float"
                  >
                    {/* Week Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                      <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-500">
                        Week {week.week}
                      </h3>
                      <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500/40 to-purple-500/40 text-white text-sm font-bold rounded-lg border border-yellow-400/30">
                        ⏱️ {week.estimated_hours}h
                      </span>
                    </div>

                    {/* Topics */}
                    <div className="mb-6">
                      <p className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
                        <span>📚</span> Topics
                      </p>
                      <ul className="space-y-2">
                        {week.topics.map((topic, idx) => (
                          <li key={idx} className="text-white/80 flex items-center gap-3 hover:text-white/95 transition">
                            <span className="w-2 h-2 bg-gradient-to-r from-yellow-300 to-purple-500 rounded-full"></span>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Project */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProject({
                          phase: phase.phase,
                          phaseFocus: phase.focus,
                          week: week.week,
                          estimatedHours: week.estimated_hours,
                          title: week.project,
                          topics: week.topics,
                          milestone: week.milestone,
                        })
                      }
                      className="w-full text-left mb-4 p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-400/30 hover:border-yellow-400/60 transition"
                    >
                      <p className="text-white/90 font-bold mb-2 flex items-center gap-2">
                        <span>🔨</span> Project
                        <span className="text-xs text-yellow-200/90">(Click to view idea)</span>
                      </p>
                      <p className="text-white/80">{week.project}</p>
                    </button>

                    {/* Milestone */}
                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-400/30 hover:border-purple-400/60 transition">
                      <p className="text-white/90 font-bold mb-2 flex items-center gap-2">
                        <span>✨</span> Milestone
                      </p>
                      <p className="text-white/80">{week.milestone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="glass-dark rounded-3xl p-10 mb-8 border border-white/20 animate-fade-in-up card-float">
          <h2 className="text-4xl font-bold text-white mb-8 flex items-center gap-3 font-space-grotesk">
            <span className="text-5xl">💡</span> Success Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roadmap.tips.map((tip, index) => (
              <div
                key={index}
                className="p-5 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl border border-yellow-400/30 flex gap-4 hover:border-yellow-400/60 transition group card-float"
              >
                <span className="text-3xl flex-shrink-0 group-hover:scale-125 transition">✓</span>
                <span className="text-white/90 font-medium leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation Section */}
        <div className="glass-dark rounded-3xl p-12 border border-white/20 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 animate-fade-in-up text-center">
          <p className="text-white/90 text-2xl mb-4 flex items-center justify-center gap-3">
            <span className="text-5xl animate-bounce-slow">🎉</span>
          </p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-purple-500 leading-relaxed font-space-grotesk">
            {roadmap.motivation}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-white/60 font-medium">
          <p className="text-lg">Your learning journey is unique • Let's make it legendary! 🌟</p>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 to-purple-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-yellow-300 font-semibold text-sm">
                  {selectedProject.phase} • Week {selectedProject.week}
                </p>
                <h3 className="text-2xl text-white font-bold mt-1">Project Idea</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-2">Project Title</p>
                <p className="text-white font-semibold">{selectedProject.title}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-2">Project Overview</p>
                <p className="text-white/90">
                  {buildProjectDetails(selectedProject).overview}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-2">Focus Topics</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.topics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Project Roadmap</p>
                <div className="space-y-3">
                  {buildProjectDetails(selectedProject).roadmapSteps.map((step, idx) => (
                    <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-yellow-200 font-semibold">{step.title}</p>
                      <p className="text-white/85 text-sm mt-1">{step.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Expected Deliverables</p>
                <ul className="space-y-2">
                  {buildProjectDetails(selectedProject).deliverables.map((item, idx) => (
                    <li key={idx} className="text-white/90 text-sm flex items-start gap-2">
                      <span className="text-green-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-2">Target Milestone</p>
                <p className="text-white/90">{selectedProject.milestone}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Completion Checklist</p>
                <ul className="space-y-2">
                  {buildProjectDetails(selectedProject).checklist.map((item, idx) => (
                    <li key={idx} className="text-white/90 text-sm flex items-start gap-2">
                      <span className="text-cyan-300 mt-0.5">□</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
