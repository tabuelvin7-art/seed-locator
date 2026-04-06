'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string; checks: Record<string, boolean> } {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const levels = [
    { label: '', color: '' },
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-emerald-400' },
    { label: 'Very Strong', color: 'bg-emerald-500' },
  ];
  return { score, ...levels[score], checks };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'farmer', phone: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const passwordsMatch = confirmPassword === '' ? null : form.password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 3) {
      setError('Please choose a stronger password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push(form.role === 'seller' ? '/dashboard/seller/setup' : '/products');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-emerald-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-xl font-bold">
            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-emerald-900">🌱</span>
            <span>Seed<span className="text-emerald-400">Locator</span></span>
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-stone-400 text-sm mt-1">Join the SeedLocator community</p>
          </div>

          {/* Role toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
            {[
              { value: 'farmer', label: '🌾 Farmer' },
              { value: 'seller', label: '🏪 Seller' },
            ].map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  form.role === r.value
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl mb-5">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="johndoe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">
                Phone <span className="text-stone-600 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+254 7XX XXX XXX"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 2 ? 'text-red-400' : strength.score === 3 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {strength.label}
                  </p>

                  {/* Requirement checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2.5">
                    {[
                      { key: 'length', label: '8+ characters' },
                      { key: 'uppercase', label: 'Uppercase letter' },
                      { key: 'lowercase', label: 'Lowercase letter' },
                      { key: 'number', label: 'Number' },
                      { key: 'special', label: 'Special character' },
                    ].map(req => (
                      <div key={req.key} className="flex items-center gap-1.5">
                        <span className={`text-xs ${strength.checks[req.key] ? 'text-emerald-400' : 'text-stone-600'}`}>
                          {strength.checks[req.key] ? '✓' : '○'}
                        </span>
                        <span className={`text-xs ${strength.checks[req.key] ? 'text-stone-300' : 'text-stone-600'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-2 uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-white placeholder-stone-600 text-sm focus:outline-none transition ${
                    passwordsMatch === null
                      ? 'border-white/10 focus:border-emerald-500'
                      : passwordsMatch
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-red-500/50 focus:border-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition text-sm"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? '🙈' : '👁'}
                </button>
                {passwordsMatch !== null && (
                  <span className={`absolute right-9 top-1/2 -translate-y-1/2 text-sm ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passwordsMatch ? '✓' : '✗'}
                  </span>
                )}
              </div>
              {passwordsMatch === false && (
                <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passwordsMatch === false || strength.score < 3}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-900/40 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-stone-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-stone-700 text-xs mt-6">© 2025 SeedLocator Kenya</p>
      </div>
    </div>
  );
}
