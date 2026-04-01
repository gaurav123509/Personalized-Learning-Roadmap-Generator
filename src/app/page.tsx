'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LearningForm from '@/components/LearningForm';
import RoadmapDisplay from '@/components/RoadmapDisplay';
import Chatbot from '@/components/Chatbot';
import ProfileMenu from '@/components/ProfileMenu';
import { UserInput, Roadmap } from '@/lib/types';
import { clearSession, getCurrentUser, getCurrentUserEmail, isLoggedIn } from '@/lib/auth';

export default function Page() {
  const ROADMAP_STATE_KEY = 'roadmap_page_state';
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [lastInput, setLastInput] = useState<UserInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    if (!loggedIn) {
      router.replace('/login');
      setAuthChecked(true);
      return;
    }
    setUserEmail(getCurrentUserEmail() || '');
    const user = getCurrentUser();
    setUserName(user?.name || 'User');
    setIsAuthed(true);
    setAuthChecked(true);

    // Restore previous roadmap screen state so dashboard navigation doesn't lose progress.
    const savedState = localStorage.getItem(ROADMAP_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as {
          roadmap: Roadmap | null;
          lastInput: UserInput | null;
        };
        setRoadmap(parsed.roadmap || null);
        setLastInput(parsed.lastInput || null);
      } catch {
        // Ignore broken local state.
      }
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthed) return;
    localStorage.setItem(
      ROADMAP_STATE_KEY,
      JSON.stringify({
        roadmap,
        lastInput,
      })
    );
  }, [roadmap, lastInput, isAuthed]);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  const handleSubmit = async (formData: UserInput) => {
    setIsLoading(true);
    setError(null);
    setRoadmap(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      setLastInput(formData);
      setRoadmap(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authChecked || !isAuthed) {
    return (
      <div className="relative min-h-screen flex items-center justify-center z-10">
        <p className="text-white/80">Checking login...</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ProfileMenu
          userName={userName}
          userEmail={userEmail}
          primaryLinkHref="/dashboard"
          primaryLinkLabel="Go to Dashboard"
          onLogout={handleLogout}
        />
      </div>
      <Chatbot />
      {!roadmap ? (
        <div>
          <LearningForm onSubmit={handleSubmit} isLoading={isLoading} />
          
          {error && (
            <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-500/90 border border-red-400 rounded-xl text-white shadow-lg animate-slide-in-left">
              <p className="font-semibold mb-1">❌ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <RoadmapDisplay
          roadmap={roadmap}
          userInput={lastInput}
          onBack={() => {
            setRoadmap(null);
            setError(null);
            setLastInput(null);
            localStorage.removeItem(ROADMAP_STATE_KEY);
          }}
        />
      )}
    </>
  );
}
