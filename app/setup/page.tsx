'use client';

import { useState, useEffect } from 'react';

export default function SetupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/setup')
      .then(r => r.json())
      .then((data: { hasUser: boolean }) => {
        if (data.hasUser) {
          window.location.href = '/';
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Setup failed');
      } else {
        window.location.href = '/login';
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0d10] text-[#e6edf3]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 border border-[#1e2025] rounded-xl bg-[#111318]">
        <h1 className="text-2xl font-semibold mb-2 text-center">Create your account</h1>
        <p className="text-xs text-[#8b949e] mb-6 text-center">This will be your only account for Intik.</p>
        {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}
        <label className="block mb-4">
          <span className="text-xs text-[#8b949e] mb-1 block">Username</span>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#0c0d10] border border-[#1e2025] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#30363d]"
            required
            autoFocus
          />
        </label>
        <label className="block mb-4">
          <span className="text-xs text-[#8b949e] mb-1 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0c0d10] border border-[#1e2025] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#30363d]"
            required
            minLength={6}
          />
        </label>
        <label className="block mb-6">
          <span className="text-xs text-[#8b949e] mb-1 block">Confirm password</span>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full bg-[#0c0d10] border border-[#1e2025] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#30363d]"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black py-2 rounded text-sm font-medium hover:bg-[#e6edf3] disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1e2025]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-[#111318] text-[#8b949e]">or</span>
          </div>
        </div>
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2 w-full bg-white text-black py-2 rounded text-sm font-medium hover:bg-[#e6edf3]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign up with Google
        </a>
      </form>
    </div>
  );
}
