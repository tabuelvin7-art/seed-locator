'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';

interface AdminUser {
  _id: string; username: string; email: string;
  role: string; phone?: string; createdAt: string;
}
interface AdminOrder {
  _id: string; total: number; status: string; createdAt: string;
  buyer: { username: string };
  seller: { businessName: string };
  items: { name: string; quantity: number; price: number }[];
}
interface AdminReport {
  totalUsers: number; totalProducts: number; totalSellers: number; totalSearches: number;
  totalOrders: number; totalRevenue: number;
  topRated: Product[];
  recentSearches: { _id: string; searchTerm: string; user?: { username: string }; searchDate: string }[];
  allUsers: AdminUser[];
  allProducts: Product[];
  allOrders: AdminOrder[];
  usersByRole: { farmer: number; seller: number; admin: number };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'products' | 'orders'>('overview');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { if (!authLoading && user?.role !== 'admin') router.push('/'); }, [user, authLoading]);

  const fetchReport = () => {
    api.get('/reports/overview').then(r => setReport(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { if (user?.role === 'admin') fetchReport(); }, [user]);

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({ username: u.username, email: u.email, phone: u.phone || '', role: u.role });
    setSaveMsg('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true); setSaveMsg('');
    try {
      await api.put(`/auth/users/${editUser._id}`, editForm);
      setSaveMsg('User updated.');
      fetchReport();
      setTimeout(() => setEditUser(null), 800);
    } catch (err: unknown) {
      setSaveMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await api.delete(`/auth/users/${id}`);
    fetchReport();
  };

  if (loading) return <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading...</div>;
  if (!report) return null;

  const filteredUsers = report.allUsers.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statCards = [
    { label: 'Total Users', value: report.totalUsers, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Products', value: report.totalProducts, icon: '🌱', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sellers', value: report.totalSellers, icon: '🏪', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Orders', value: report.totalOrders, icon: '📦', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue (KES)', value: (report.totalRevenue ?? 0).toLocaleString(), icon: '💰', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Searches', value: report.totalSearches, icon: '🔍', color: 'text-stone-600', bg: 'bg-stone-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Admin Dashboard</h1>
          <p className="text-stone-500 text-sm mt-0.5">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <a href="/account" className="btn-outline flex items-center gap-2 text-sm">✏️ Edit Account</a>
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2">
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 mb-7 print:hidden">
        {(['overview', 'users', 'products', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : t === 'products' ? '🌱 Products' : '📦 Orders'}
          </button>
        ))}
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌱</span>
          <span className="text-lg font-bold">SeedLocator</span>
        </div>
        <h2 className="text-xl font-bold capitalize">Admin Report — {tab}</h2>
        <p className="text-sm text-stone-500">Generated: {new Date().toLocaleString('en-KE')}</p>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-7">
            {statCards.map(s => (
              <div key={s.label} className="card p-5">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3 print:hidden`}>{s.icon}</div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-stone-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-5 mb-5">
            <h2 className="font-semibold text-stone-700 text-sm mb-4">Users by Role</h2>
            <div className="flex gap-8">
              {Object.entries(report.usersByRole).map(([role, count]) => (
                <div key={role} className="text-center">
                  <p className="text-2xl font-bold text-stone-800">{count}</p>
                  <p className="text-xs text-stone-400 capitalize">{role}s</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h2 className="font-semibold text-stone-700 text-sm mb-4">Top Rated Products</h2>
              <div className="space-y-3">
                {report.topRated.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 text-sm truncate">{p.name}</p>
                      <p className="text-stone-400 text-xs">{p.seller?.businessName}</p>
                    </div>
                    <span className="text-amber-400 text-xs font-semibold">★ {p.averageRating}</span>
                  </div>
                ))}
                {report.topRated.length === 0 && <p className="text-stone-400 text-sm">No rated products yet.</p>}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-stone-700 text-sm mb-4">Recent Searches</h2>
              <div className="space-y-2.5">
                {report.recentSearches.map(s => (
                  <div key={s._id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-stone-300 text-xs">🔍</span>
                      <span className="font-medium text-stone-700 text-sm truncate">"{s.searchTerm}"</span>
                      {s.user && <span className="text-stone-400 text-xs">· {s.user.username}</span>}
                    </div>
                    <span className="text-stone-400 text-xs flex-shrink-0">
                      {new Date(s.searchDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
                {report.recentSearches.length === 0 && <p className="text-stone-400 text-sm">No searches yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center gap-3 mb-4 print:hidden">
            <div className="field flex-1 max-w-xs">
              <input placeholder="Search users..." value={userSearch}
                onChange={e => setUserSearch(e.target.value)} className="input-base" />
              <label>Search</label>
            </div>
            <span className="text-xs text-stone-400">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredUsers.map(u => (
                  <tr key={u._id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-stone-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'seller' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 print:hidden">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(u)} className="text-xs text-stone-500 hover:text-emerald-600 font-medium transition">Edit</button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u._id, u.username)} className="text-xs text-stone-400 hover:text-red-500 font-medium transition">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No users found.</p>}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-700 text-sm">All Products</h2>
            <span className="text-xs text-stone-400">{report.allProducts.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Seller</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {report.allProducts.map(p => (
                  <tr key={p._id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-stone-800">{p.name}</div>
                      <div className="text-xs text-stone-400 capitalize">{p.category.replace('-', ' ')}</div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 text-xs">{p.seller?.businessName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'seed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">KES {p.price.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-stone-500">{p.stockQuantity}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(p.averageRating))}</span>
                      <span className="text-stone-400 text-xs ml-1">{p.averageRating > 0 ? p.averageRating : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.allProducts.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No products yet.</p>}
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-700 text-sm">All Orders</h2>
            <span className="text-xs text-stone-400">{report.allOrders.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Order</th>
                  <th className="text-left px-4 py-3 font-semibold">Buyer</th>
                  <th className="text-left px-4 py-3 font-semibold">Seller</th>
                  <th className="text-left px-4 py-3 font-semibold">Total</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {report.allOrders.map(o => (
                  <tr key={o._id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3.5 font-mono text-xs text-stone-500">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3.5 font-medium text-stone-800">{o.buyer?.username}</td>
                    <td className="px-4 py-3.5 text-stone-500 text-xs">{o.seller?.businessName}</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">KES {o.total.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-500' :
                        o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-400 text-xs">
                      {new Date(o.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.allOrders.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No orders yet.</p>}
          </div>
        </div>
      )}

      {/* Print footer */}
      <div className="hidden print:block text-center text-xs text-stone-400 pt-4 border-t mt-8">
        SeedLocator Kenya · Confidential Admin Report · {new Date().getFullYear()}
      </div>

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-stone-800 text-lg">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
            </div>
            {saveMsg && (
              <div className={`text-sm px-4 py-3 rounded-xl mb-4 border ${saveMsg === 'User updated.' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {saveMsg}
              </div>
            )}
            <form onSubmit={handleEditSave} className="space-y-3">
              {[
                { label: 'Username', key: 'username', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map(f => (
                <div key={f.key} className="field">
                  <input type={f.type} placeholder=" "
                    value={(editForm as Record<string, string>)[f.key]}
                    onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    className="input-base" />
                  <label>{f.label}</label>
                </div>
              ))}
              <div className="field">
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="input-base select-field">
                  <option value="farmer">Farmer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
                <label>Role</label>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
