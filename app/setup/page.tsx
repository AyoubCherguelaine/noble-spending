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
      </form>
    </div>
  );
}
