'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
      } else {
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        window.location.href = callbackUrl;
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 border border-[#1e2025] rounded-xl bg-[#111318]">
      <h1 className="text-2xl font-semibold mb-6 text-center">Intik</h1>
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
      <label className="block mb-6">
        <span className="text-xs text-[#8b949e] mb-1 block">Password</span>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-[#0c0d10] border border-[#1e2025] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#30363d]"
          required
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black py-2 rounded text-sm font-medium hover:bg-[#e6edf3] disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginClient() {
  useEffect(() => {
    fetch('/api/auth/setup')
      .then(r => r.json())
      .then((data: { hasUser: boolean }) => {
        if (!data.hasUser) {
          window.location.href = '/setup';
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0d10] text-[#e6edf3]">
      <Suspense fallback={<div className="w-full max-w-sm p-8 border border-[#1e2025] rounded-xl bg-[#111318] text-center text-sm text-[#8b949e]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
