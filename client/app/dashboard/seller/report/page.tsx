'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProductStat {
  _id: string; name: string; category: string; type: string;
  stock: number; price: number; rating: number; ratingCount: number; createdAt: string;
}
interface SellerReport {
  seller: { businessName: string; location: string; businessType: string };
  totalProducts: number; totalRatings: number;
  totalOrders: number; pendingOrders: number; revenue: number;
  productStats: ProductStat[];
  recentRatings: { _id: string; ratingValue: number; reviewText: string; createdAt: string; user: { username: string }; product: { name: string } }[];
}

export default function SellerReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && user?.role !== 'seller' && user?.role !== 'admin') router.push('/'); }, [user, authLoading]);
  useEffect(() => {
    if (user) api.get('/reports/seller').then(r => setReport(r.data)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading report...</div>;
  if (!report) return null;

  const avgRating = report.productStats.length
    ? (report.productStats.reduce((s, p) => s + p.rating, 0) / report.productStats.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-7 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/seller" className="btn-outline text-xs px-3 py-2">← Back</Link>
          <h1 className="text-xl font-bold text-stone-800">Sales Report</h1>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* ── PRINTABLE CONTENT ── */}
      <div className="space-y-6">
        {/* Report header */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌱</span>
                <span className="text-lg font-bold text-stone-800">SeedLocator</span>
              </div>
              <p className="text-xs text-stone-400">Seller Analytics Report</p>
            </div>
            <div className="text-right text-xs text-stone-400">
              <p>Generated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="mt-0.5">{new Date().toLocaleTimeString('en-KE')}</p>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-4 pt-4">
            <p className="font-bold text-stone-800 text-lg">{report.seller.businessName}</p>
            <p className="text-stone-500 text-sm capitalize">{report.seller.businessType?.replace('-', ' ')} · {report.seller.location}</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: report.totalProducts, color: 'text-emerald-600' },
            { label: 'Total Reviews', value: report.totalRatings, color: 'text-blue-600' },
            { label: 'Avg Rating', value: avgRating, color: 'text-amber-600' },
            { label: 'Revenue (KES)', value: `${(report.revenue ?? 0).toLocaleString()}`, color: 'text-emerald-700' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Orders', value: report.totalOrders ?? 0, color: 'text-stone-800' },
            { label: 'Pending Orders', value: report.pendingOrders ?? 0, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Products table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-700">Product Listings</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-right px-4 py-3 font-semibold">Price (KES)</th>
                <th className="text-right px-4 py-3 font-semibold">Stock</th>
                <th className="text-right px-4 py-3 font-semibold">Rating</th>
                <th className="text-right px-4 py-3 font-semibold">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {report.productStats.map(p => (
                <tr key={p._id}>
                  <td className="px-5 py-3 font-medium text-stone-800">{p.name}</td>
                  <td className="px-4 py-3 text-stone-500 capitalize text-xs">{p.category.replace('-', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'seed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-stone-500">{p.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-amber-400">{'★'.repeat(Math.round(p.rating))}</span>
                    <span className="text-stone-400 text-xs ml-1">{p.rating > 0 ? p.rating : '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-500">{p.ratingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.productStats.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No products yet.</p>}
        </div>

        {/* Recent reviews */}
        {report.recentRatings.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-700">Recent Customer Reviews</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {report.recentRatings.map(r => (
                <div key={r._id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-700 text-sm">{r.user?.username}</span>
                      <span className="text-stone-300 text-xs">on</span>
                      <span className="text-stone-500 text-xs">{r.product?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < r.ratingValue ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                      ))}
                      <span className="text-xs text-stone-400 ml-1">{new Date(r.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  {r.reviewText && <p className="text-sm text-stone-500 leading-relaxed">{r.reviewText}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block text-center text-xs text-stone-400 pt-4 border-t">
          SeedLocator Kenya · Confidential Seller Report · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
