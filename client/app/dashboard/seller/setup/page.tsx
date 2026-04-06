'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const fields = [
  { label: 'Business Name', key: 'businessName', required: true, placeholder: 'e.g. Eldoret Agro Supplies' },
  { label: 'Location', key: 'location', required: true, placeholder: 'e.g. Eldoret, Uasin Gishu' },
  { label: 'Latitude', key: 'latitude', required: true, placeholder: '0.5143' },
  { label: 'Longitude', key: 'longitude', required: true, placeholder: '35.2698' },
  { label: 'Phone Number', key: 'phone', required: false, placeholder: '+254 7XX XXX XXX' },
];

export default function SellerSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '', businessType: 'agro-dealer', description: '',
    location: '', latitude: '', longitude: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/sellers', {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      router.push('/dashboard/seller');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-stone-800">Set Up Your Seller Profile</h1>
          <p className="text-stone-500 text-sm mt-1">This information will be shown to farmers browsing your products.</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Text fields */}
          {fields.map(f => (
            <div key={f.key} className="field">
              <input
                required={f.required}
                placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="input-base bg-white shadow-sm rounded-xl border-0 border-b-2"
              />
              <label>{f.label}{!f.required && <span className="text-stone-300 ml-1 normal-case tracking-normal font-normal">(optional)</span>}</label>
            </div>
          ))}

          {/* Business Type */}
          <div className="field">
            <select
              value={form.businessType}
              onChange={e => setForm({ ...form, businessType: e.target.value })}
              className="input-base select-field bg-white shadow-sm rounded-xl border-0 border-b-2"
            >
              <option value="agro-dealer">Agro-dealer</option>
              <option value="nursery">Nursery Operator</option>
              <option value="farmer-producer">Farmer Producer</option>
            </select>
            <label>Business Type</label>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
          </div>

          {/* Description */}
          <div className="field">
            <textarea
              rows={3}
              placeholder="Tell farmers about your business..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-base textarea-field bg-white shadow-sm rounded-xl border-0 border-b-2"
            />
            <label>Description <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
          </div>

          {/* Coords hint */}
          <p className="text-xs text-stone-400 px-1">
            💡 To get coordinates, right-click your location on{' '}
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
              Google Maps
            </a>{' '}
            and copy the numbers shown.
          </p>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Profile & Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
