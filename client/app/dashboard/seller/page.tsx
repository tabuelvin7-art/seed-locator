'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{ totalProducts: number; totalRatings: number; totalOrders?: number; pendingOrders?: number; revenue?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'food-crop', type: 'seed', description: '', price: '', stockQuantity: '', image: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== 'seller' && user?.role !== 'admin') router.push('/');
  }, [user, authLoading]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/products/mine').then(r => setProducts(r.data)),
      api.get('/reports/seller').then(r => setStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  // Check if seller profile exists
  useEffect(() => {
    if (user?.role === 'seller') {
      api.get('/sellers').then(r => {
        const mine = r.data.find((s: { user: { _id?: string; id?: string } }) =>
          s.user?._id === user.id || s.user?.id === user.id
        );
        if (!mine) setNoProfile(true);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editId) {
        await api.put(`/products/${editId}`, { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) });
      } else {
        await api.post('/products', { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', category: 'food-crop', type: 'seed', description: '', price: '', stockQuantity: '', image: '' });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchData();
  };

  const startEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, type: p.type, description: p.description, price: String(p.price), stockQuantity: String(p.stockQuantity), image: p.image || '' });
    setEditId(p._id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({ name: '', category: 'food-crop', type: 'seed', description: '', price: '', stockQuantity: '', image: '' });
    setEditId(null);
    setShowForm(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-stone-400 text-sm">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Seller Dashboard</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage your product listings</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/account" className="btn-outline text-xs px-3 py-2">✏️ Edit Account</Link>
          <Link href="/dashboard/seller/orders" className="btn-outline text-xs px-3 py-2">📦 Orders</Link>
          <Link href="/dashboard/seller/report" className="btn-outline text-xs px-3 py-2">🖨️ Report</Link>
          <button onClick={openNew} disabled={noProfile}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={noProfile ? 'Complete your seller profile first' : ''}>
            <span>+</span> Add Product
          </button>
        </div>
      </div>

      {/* No profile warning */}
      {noProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Seller profile not set up</p>
            <p className="text-amber-700 text-xs mt-0.5">You need to complete your seller profile before adding products.</p>
            <a href="/dashboard/seller/setup"
              className="inline-block mt-2 text-xs font-semibold text-amber-800 underline hover:text-amber-900">
              Complete setup →
            </a>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          <div className="card p-5">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">Products</p>
            <p className="text-3xl font-bold text-stone-800">{stats.totalProducts}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">Total Ratings</p>
            <p className="text-3xl font-bold text-stone-800">{stats.totalRatings}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">Orders</p>
            <p className="text-3xl font-bold text-stone-800">{stats.totalOrders ?? 0}</p>
            {(stats.pendingOrders ?? 0) > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-1">{stats.pendingOrders} pending</p>
            )}
          </div>
          <div className="card p-5">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">Revenue</p>
            <p className="text-2xl font-bold text-emerald-700">KES {(stats.revenue ?? 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Low stock warning */}
      {products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Low stock alert</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).map(p => `${p.name} (${p.stockQuantity} left)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Product Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-emerald-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-stone-800">{editId ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600 text-lg">✕</button>
          </div>
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
              <span className="flex-shrink-0">⚠</span>
              <span>{saveError}</span>
            </div>
          )}
          <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-3">
            <div className="field">
              <input required placeholder="e.g. Hybrid Maize Seeds" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-base" />
              <label>Product Name</label>
            </div>
            <div className="field">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-base select-field">
                <option value="food-crop">Food Crop</option>
                <option value="horticultural">Horticultural</option>
                <option value="industrial">Industrial</option>
                <option value="indigenous">Indigenous</option>
              </select>
              <label>Category</label>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
            </div>
            <div className="field">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="input-base select-field">
                <option value="seed">Seed</option>
                <option value="seedling">Seedling</option>
              </select>
              <label>Type</label>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
            </div>
            <div className="field">
              <input type="number" required placeholder="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="input-base" />
              <label>Price (KES)</label>
            </div>
            <div className="field">
              <input type="number" placeholder="0" value={form.stockQuantity}
                onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                className="input-base" />
              <label>Stock Quantity</label>
            </div>
            <div className="field md:col-span-2">
              <textarea rows={2} placeholder="Describe the product..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-base textarea-field" />
              <label>Description</label>
            </div>
            <div className="field md:col-span-2">
              <input type="url" placeholder="https://example.com/image.jpg" value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                className="input-base" />
              <label>Image URL <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Product'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-700 text-sm">Your Listings</h2>
          <span className="text-xs text-stone-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Price</th>
                <th className="text-left px-4 py-3 font-semibold">Stock</th>
                <th className="text-left px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-stone-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-stone-800">{p.name}</div>
                    <div className="text-xs text-stone-400 capitalize">{p.category.replace('-', ' ')}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'seed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-700">KES {p.price.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-stone-500">
                    <span className={p.stockQuantity <= 5 && p.stockQuantity > 0 ? 'text-amber-600 font-semibold' : p.stockQuantity === 0 ? 'text-red-500 font-semibold' : ''}>
                      {p.stockQuantity}
                    </span>
                    {p.stockQuantity === 0 && <span className="ml-1 text-xs text-red-400">(out)</span>}
                    {p.stockQuantity > 0 && p.stockQuantity <= 5 && <span className="ml-1 text-xs text-amber-500">(low)</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(p.averageRating))}</span>
                    <span className="text-stone-400 text-xs ml-1">{p.averageRating > 0 ? p.averageRating : '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(p)} className="text-xs text-stone-500 hover:text-emerald-600 font-medium transition">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-xs text-stone-400 hover:text-red-500 font-medium transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm font-medium">No products yet</p>
              <p className="text-xs mt-1">Click "Add Product" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
