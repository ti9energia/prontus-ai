'use client';

import * as React from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

let items: ToastItem[] = [];
let seq = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function add(tone: ToastTone, title: string, description?: string, duration = 3600) {
  const id = `toast_${seq++}`;
  items = [...items, { id, tone, title, description, duration }];
  emit();
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, description?: string) => add('success', title, description),
  error: (title: string, description?: string) => add('error', title, description, 5000),
  info: (title: string, description?: string) => add('info', title, description),
};

export function useToasts() {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );
}
