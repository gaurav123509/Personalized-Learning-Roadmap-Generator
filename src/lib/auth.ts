export const AUTH_FLAG_KEY = 'roadmap_auth_logged_in';
export const AUTH_USER_KEY = 'roadmap_auth_user';
const AUTH_USERS_KEY = 'roadmap_auth_users';
const AUTH_RESET_KEY = 'roadmap_auth_reset';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string; // demo-only storage
  createdAt: number;
}

interface PasswordResetState {
  email: string;
  code: string;
  expiresAt: number;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readUsers(): AuthUser[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AuthUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: AuthUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function writeSession(email: string) {
  // Keep active login in sessionStorage so it doesn't persist like localStorage.
  sessionStorage.setItem(AUTH_FLAG_KEY, 'true');
  sessionStorage.setItem(AUTH_USER_KEY, normalizeEmail(email));
}

export function clearSession() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(AUTH_FLAG_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  // Clear legacy localStorage session keys if present.
  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isLoggedIn() {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(AUTH_FLAG_KEY) === 'true';
}

export function getCurrentUserEmail() {
  if (!isBrowser()) return null;
  return sessionStorage.getItem(AUTH_USER_KEY);
}

export function getCurrentUser() {
  if (!isBrowser()) return null;
  const email = getCurrentUserEmail();
  if (!email) return null;
  const user = readUsers().find((u) => u.email === email);
  if (!user) {
    return {
      name: 'User',
      email,
    };
  }
  return {
    name: user.name,
    email: user.email,
  };
}

export function signUp(name: string, email: string, password: string) {
  if (!isBrowser()) return { ok: false, message: 'Unavailable on server.' };

  const safeName = name.trim();
  const safeEmail = normalizeEmail(email);
  const safePassword = password.trim();

  if (!safeName) return { ok: false, message: 'Name is required.' };
  if (!safeEmail) return { ok: false, message: 'Email is required.' };
  if (safePassword.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

  const users = readUsers();
  const exists = users.some((u) => u.email === safeEmail);
  if (exists) return { ok: false, message: 'Account already exists. Please sign in.' };

  const user: AuthUser = {
    id: crypto.randomUUID(),
    name: safeName,
    email: safeEmail,
    password: safePassword,
    createdAt: Date.now(),
  };

  writeUsers([user, ...users]);
  writeSession(safeEmail);
  return { ok: true as const, user };
}

export function signIn(email: string, password: string) {
  if (!isBrowser()) return { ok: false, message: 'Unavailable on server.' };

  const safeEmail = normalizeEmail(email);
  const safePassword = password.trim();
  const user = readUsers().find((u) => u.email === safeEmail);

  if (!user) return { ok: false, message: 'No account found for this email.' };
  if (user.password !== safePassword) return { ok: false, message: 'Incorrect password.' };

  writeSession(safeEmail);
  return { ok: true as const, user };
}

export function startPasswordReset(email: string) {
  if (!isBrowser()) return { ok: false, message: 'Unavailable on server.' };

  const safeEmail = normalizeEmail(email);
  const user = readUsers().find((u) => u.email === safeEmail);
  if (!user) return { ok: false, message: 'No account found for this email.' };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const payload: PasswordResetState = {
    email: safeEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  localStorage.setItem(AUTH_RESET_KEY, JSON.stringify(payload));

  return { ok: true as const, code };
}

function readResetState(): PasswordResetState | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(AUTH_RESET_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PasswordResetState;
  } catch {
    return null;
  }
}

export function resetPassword(email: string, code: string, newPassword: string) {
  if (!isBrowser()) return { ok: false, message: 'Unavailable on server.' };

  const safeEmail = normalizeEmail(email);
  const safeCode = code.trim();
  const safePassword = newPassword.trim();

  if (safePassword.length < 6) return { ok: false, message: 'New password must be at least 6 characters.' };

  const resetState = readResetState();
  if (!resetState) return { ok: false, message: 'Reset session not found. Please request a new code.' };
  if (Date.now() > resetState.expiresAt) return { ok: false, message: 'Reset code expired. Request a new code.' };
  if (resetState.email !== safeEmail) return { ok: false, message: 'Email does not match reset request.' };
  if (resetState.code !== safeCode) return { ok: false, message: 'Invalid reset code.' };

  const users = readUsers();
  const idx = users.findIndex((u) => u.email === safeEmail);
  if (idx === -1) return { ok: false, message: 'Account not found.' };

  const updated = [...users];
  updated[idx] = { ...updated[idx], password: safePassword };
  writeUsers(updated);
  localStorage.removeItem(AUTH_RESET_KEY);

  return { ok: true as const };
}
