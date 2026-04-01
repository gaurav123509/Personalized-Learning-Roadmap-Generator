'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ProfileMenuProps {
  userName?: string;
  userEmail?: string;
  primaryLinkHref: string;
  primaryLinkLabel: string;
  onLogout: () => void;
}

export default function ProfileMenu({
  userName,
  userEmail,
  primaryLinkHref,
  primaryLinkLabel,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const initials = (userName || userEmail || 'U')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 text-black text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span>Profile</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 border border-white/20 shadow-xl p-3 z-50">
          <div className="p-2 border-b border-white/10">
            <p className="text-white font-semibold">{userName || 'User'}</p>
            <p className="text-white/70 text-sm break-all">{userEmail || 'No email'}</p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href={primaryLinkHref}
              onClick={() => setOpen(false)}
              className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              {primaryLinkLabel}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
