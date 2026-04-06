'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function AdminRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [form, setForm] = useState({
    username: 'admin',
    email: 'admin@gmail.com',
    password: 'Admin@254',
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim() === '') return;
    setUnlocked(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const { data } = await api.post('/auth/admin-register', {
        secret,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setMessage(data.message || 'Admin account ready.');
      setDone(true);
      // Auto-login
      await login(form.email, form.password);
      setTimeout(() => router.push('/dashboard/admin'), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(msg || 'Something went wrong.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-emerald-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-xl font-bold">
            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-emerald-900">🌱</span>
            <span>Seed<span className="text-emerald-400">Locator</span></span>
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Lock icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">
              🔐
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Access</h1>
              <p className="text-stone-500 text-xs">Restricted area</p>
            </div>
          </div>

          {/* Step 1 — enter secret key */}
          {!unlocked ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">
                  Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="Enter admin secret key"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition">
                Unlock
              </button>
            </form>
          ) : (
            /* Step 2 — create admin account */
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${
                  isError
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                }`}>
                  <span>{isError ? '⚠' : '✓'}</span>
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-sm">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || done}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-900/40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : done ? '✓ Redirecting to dashboard...' : 'Create Admin Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-stone-700 text-xs mt-6">
          This page is not publicly listed. Keep the URL private.
        </p>
      </div>
    </div>
  );
}
