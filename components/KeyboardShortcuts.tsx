'use client';

import { useEffect } from 'react';

export default function KeyboardShortcuts({ onAdd, onSearch, onNavigate, onOpenSettings, onOpenRecurring, onOpenAnalytics }: any) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as any)?.tagName);
      if (isInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onAdd?.();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        onOpenSettings?.();
      } else if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNavigate?.('prev');
      } else if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNavigate?.('next');
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        onOpenRecurring?.();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        onOpenAnalytics?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAdd, onSearch, onNavigate, onOpenSettings, onOpenRecurring, onOpenAnalytics]);

  return null;
}
