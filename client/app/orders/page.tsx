'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Order } from '@/lib/types';
import Link from 'next/link';
import { Suspense } from 'react';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-500',
};

function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get('placed') === '1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  const fetchOrders = () => {
    if (user) api.get('/orders/my').then(r => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    setCancelling(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading orders...</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/products" className="btn-outline text-xs px-3 py-2">← Browse</Link>
        <h1 className="text-2xl font-bold text-stone-800">My Orders</h1>
      </div>

      {justPlaced && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-sm">Order placed successfully!</p>
            <p className="text-xs mt-0.5">The seller will confirm your order shortly.</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">Your orders will appear here after you buy something.</p>
          <Link href="/products" className="btn-primary inline-block mt-5">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-stone-800">{order.seller?.businessName}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {' · '}Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-stone-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                <div className="text-xs text-stone-400">
                  <p>📍 {order.deliveryAddress}</p>
                  <p>📞 {order.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={cancelling === order._id}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition disabled:opacity-50">
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  <p className="font-bold text-stone-800">KES {order.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersContent /></Suspense>;
}
