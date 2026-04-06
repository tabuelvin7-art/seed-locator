'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';
import Link from 'next/link';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-500',
};

export default function SellerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user?.role !== 'seller' && user?.role !== 'admin') router.push('/');
  }, [user, authLoading]);

  const fetchOrders = () => {
    api.get('/orders/seller').then(r => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: status as Order['status'] } : o));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  if (loading) return <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading orders...</div>;

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/seller" className="btn-outline text-xs px-3 py-2">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-stone-800">Incoming Orders</h1>
        </div>
        <button onClick={() => window.print()} className="btn-outline text-xs px-3 py-2 print:hidden">🖨️ Print</button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6 print:hidden">
        <button onClick={() => setFilter('')}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${!filter ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
          All ({orders.length})
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize transition ${filter === s ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No {filter || ''} orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-stone-800">
                    {(order.buyer as { username?: string })?.username || 'Customer'}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}#{order._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-stone-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-3 grid grid-cols-2 gap-3">
                <div className="text-xs text-stone-500 space-y-1">
                  <p>📍 {order.deliveryAddress}</p>
                  <p>📞 {order.phone}</p>
                  {order.notes && <p>📝 {order.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-stone-800">KES {order.total.toLocaleString()}</p>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <select
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={e => updateStatus(order._id, e.target.value)}
                      className="text-xs border-2 border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 cursor-pointer print:hidden">
                      {STATUSES.filter(s => s !== 'pending' || order.status === 'pending').map(s => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
