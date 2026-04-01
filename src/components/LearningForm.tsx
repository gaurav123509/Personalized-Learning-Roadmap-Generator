'use client';

import { useState } from 'react';
import { UserInput } from '@/lib/types';

interface LearningFormProps {
  onSubmit: (input: UserInput) => Promise<void>;
  isLoading: boolean;
}

export default function LearningForm({ onSubmit, isLoading }: LearningFormProps) {
  const [formData, setFormData] = useState<UserInput>({
    goal: '',
    level: 'beginner',
    hours: 10,
    months: 3,
    resources: 'YouTube, Udemy, Books',
    language: 'English',
    budget: 'free',
    enableMockTest: true,
    questionsCount: 50,
    enableProjectTasks: false,
    projectComplexity: 'moderate',
  });

  const [step, setStep] = useState(1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hours' || name === 'months' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit on final step
    if (step !== 3) {
      console.warn('Form submit prevented - not on final step');
      return;
    }
    console.log('Form submitted from step 3!'); // Debug
    await onSubmit({
      ...formData,
      enableMockTest: true,
      questionsCount: 50,
    });
  };

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 z-10">
      <div className="w-full max-w-3xl">
        {/* Animated Background Shapes */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-yellow-400 to-purple-600 rounded-full opacity-20 blur-3xl animate-bounce-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-r from-purple-600 to-indigo-900 rounded-full opacity-20 blur-3xl animate-bounce-slow" style={{ animationDelay: '1s' }}></div>

        {/* Header */}
        <div className="text-center mb-12 animate-slide-in-down">
          <div className="inline-block mb-4 animate-bounce-slow">
            <span className="text-7xl filter drop-shadow-lg">⚓️</span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-3 font-space-grotesk">
            AI Learning
            <br />
            <span className="gradient-text text-6xl">Roadmap</span>
          </h1>
          <p className="text-white/90 text-xl font-light max-w-md mx-auto">
            Plan smart. Learn faster. Grow better 🕶️
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-dark rounded-3xl p-10 shadow-2xl animate-fade-in-up relative overflow-hidden">
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Progress Bar */}
          <div className="mb-8 relative">
            <div className="flex justify-between mb-3">
              <span className="text-white font-bold">Step {step} of 3</span>
              <span className="text-white/60 font-semibold">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-500 rounded-full shadow-lg"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" onKeyDown={(e) => {
            if (e.key === 'Enter' && step < 3) e.preventDefault();
          }}>
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-7 animate-fade-in-up">
                <div className="group">
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-4xl animate-bounce">🎯</span>
                    What do you want to master?
                  </label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    placeholder="E.g., Build full-stack web apps with React, Next.js, and Node.js 💻"
                    required
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all duration-300 resize-none font-medium text-base"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-4xl">📊</span>
                    Your current level
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, level: lvl as any })}
                        className={`py-4 px-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                          formData.level === lvl
                            ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-white scale-105 shadow-lg'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {lvl === 'beginner' && '🫰🏻 Beginner'}
                        {lvl === 'intermediate' && '🤟🏻 Intermediate'}
                        {lvl === 'advanced' && '💪🏻 Advanced'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-7 animate-fade-in-up">
                <div>
                  <label className="block text-white font-bold mb-6 text-lg flex items-center gap-3">
                    <span className="text-4xl">⏰</span>
                    Hours per week: <span className="text-3xl text-yellow-400 ml-2 font-black">{formData.hours}</span>
                  </label>
                  <input
                    type="range"
                    name="hours"
                    value={formData.hours}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-gradient"
                  />
                  <div className="flex justify-between text-white/60 text-sm mt-2 font-medium">
                    <span>1h</span>
                    <span>50h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-bold mb-6 text-lg flex items-center gap-3">
                    <span className="text-4xl">📅</span>
                    Duration: <span className="text-3xl text-purple-500 ml-2 font-black">{formData.months}</span> months
                  </label>
                  <input
                    type="range"
                    name="months"
                    value={formData.months}
                    onChange={handleChange}
                    min="1"
                    max="24"
                    className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-white/60 text-sm mt-2 font-medium">
                    <span>1 month</span>
                    <span>24 months</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-3xl">📚</span>
                    Favorite resources
                  </label>
                  <input
                    type="text"
                    name="resources"
                    value={formData.resources}
                    onChange={handleChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    placeholder="YouTube, Udemy, Books, Blogs..."
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:bg-white/10 focus:ring-2 focus:ring-green-400/50 transition-all duration-300 font-medium"
                  />
                </div>

                <div className="mt-4 p-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10">
                  <p className="text-white font-semibold flex items-center gap-2">
                    <span className="text-xl">🧪</span>
                    Quiz Included Automatically
                  </p>
                  <p className="text-white/75 text-sm mt-1">
                    Har roadmap ke saath subject-related 50 questions ka quiz automatically add hoga.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-3xl">🧩</span>
                    Add project tasks
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!formData.enableProjectTasks}
                        onChange={(e) => setFormData({ ...formData, enableProjectTasks: e.target.checked })}
                        className="accent-yellow-400"
                      />
                      <span className="text-white/80">Enable project tasks</span>
                    </label>
                    {formData.enableProjectTasks && (
                      <select
                        value={formData.projectComplexity}
                        onChange={(e) => setFormData({ ...formData, projectComplexity: e.target.value as any })}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        className="px-3 py-2 rounded-lg bg-white/5 text-white"
                      >
                        <option value="simple">Simple</option>
                        <option value="moderate">Moderate</option>
                        <option value="complex">Complex</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-3xl">🌍</span>
                    Language preference
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-white/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 font-medium cursor-pointer"
                  >
                    <option value="English" className="bg-gray-900">🇬🇧 English</option>
                    <option value="Hinglish" className="bg-gray-900">🇮🇳 Hinglish</option>
                    <option value="Hindi" className="bg-gray-900">🇮🇳 Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-4 text-lg flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    Your budget
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'free', emoji: '💚', label: 'Free' },
                      { val: 'low', emoji: '💛', label: 'Low ($0-100)' },
                      { val: 'medium', emoji: '🧡', label: 'Medium ($100-500)' },
                      { val: 'high', emoji: '❤️', label: 'High ($500+)' },
                    ].map((b) => (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, budget: b.val as any })}
                        className={`py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                          formData.budget === b.val
                            ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-white scale-105 shadow-lg'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {b.emoji} {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-8 mt-8 border-t border-white/10">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-400/40 to-teal-500/40 hover:from-cyan-400/60 hover:to-teal-500/60 text-white font-bold rounded-xl transition-all duration-300 text-lg border border-cyan-400/30"
                >
                  ← Previous
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-400 to-teal-500 hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-300 text-lg btn-glow"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !formData.goal}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 hover:shadow-2xl text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg animate-pulse-glow"
                >
                  {isLoading ? '✨ Creating your roadmap...' : '🐳 Generate My Roadmap'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-white/70 font-medium">
            Powered by 👾 AI • Your learning journey starts here ✨
          </p>
        </div>
      </div>
    </div>
  );
}
