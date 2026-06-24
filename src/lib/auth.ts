'use client';

/** Lightweight demo auth (client-only flag). Real deployments swap this for
 *  Auth.js + JWT/OAuth per the spec — the UI gate stays the same. */
const KEY = 'prontus-auth';

export function isAuthed() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function signIn() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {}
}

export function signOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
