'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function CartPage() {
  const { items, remove, updateQty, clear, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ deliveryAddress: '', phone: '', notes: '' });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill phone from user profile once loaded
  useEffect(() => {
    if (user?.phone && !form.phone) setForm(f => ({ ...f, phone: user.phone || '' }));
  }, [user]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!items.length) return;
    setPlacing(true); setError('');
    try {
      await api.post('/orders', {
        items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
        deliveryAddress: form.deliveryAddress,
        phone: form.phone,
        notes: form.notes,
      });
      clear();
      router.push('/orders?placed=1');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place order.');
    } finally {
      setPlacing(false); }
  };

  if (!items.length) return (
    <div className="max-w-lg mx-auto px-5 py-20 text-center">
      <p className="text-5xl mb-4">🛒</p>
      <h1 className="text-xl font-bold text-stone-800 mb-2">Your cart is empty</h1>
      <p className="text-stone-400 text-sm mb-6">Browse products and add some seeds or seedlings.</p>
      <Link href="/products" className="btn-primary">Browse Products</Link>
    </div>
  );

  const sellerName = items[0]?.product.seller?.businessName;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/products" className="btn-outline text-xs px-3 py-2">← Continue Shopping</Link>
        <h1 className="text-2xl font-bold text-stone-800">Your Cart</h1>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Items */}
        <div className="md:col-span-3 space-y-3">
          <p className="text-xs text-stone-400 font-medium">From: {sellerName}</p>
          {items.map(({ product: p, quantity }) => (
            <div key={p._id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-2xl flex-shrink-0">
                {p.type === 'seed' ? '🌰' : '🌱'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-sm truncate">{p.name}</p>
                <p className="text-xs text-stone-400 capitalize">{p.category.replace('-', ' ')} · {p.type}</p>
                <p className="text-emerald-700 font-bold text-sm mt-0.5">KES {p.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center border-2 border-stone-200 rounded-xl overflow-hidden flex-shrink-0">
                <button onClick={() => updateQty(p._id, quantity - 1)}
                  className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-50 font-bold text-sm transition">−</button>
                <span className="px-3 py-1.5 text-sm font-semibold text-stone-800">{quantity}</span>
                <button onClick={() => updateQty(p._id, quantity + 1)}
                  className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-50 font-bold text-sm transition">+</button>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-stone-800 text-sm">KES {(p.price * quantity).toLocaleString()}</p>
                <button onClick={() => remove(p._id)} className="text-xs text-stone-400 hover:text-red-500 transition mt-1">Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div className="md:col-span-2">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-stone-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {items.map(({ product: p, quantity }) => (
                <div key={p._id} className="flex justify-between text-stone-600">
                  <span className="truncate mr-2">{p.name} × {quantity}</span>
                  <span className="flex-shrink-0">KES {(p.price * quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-stone-100 pt-2 flex justify-between font-bold text-stone-800">
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-4">
                ⚠ {error}
              </div>
            )}

            {!user ? (
              <div className="text-center">
                <p className="text-sm text-stone-500 mb-3">Sign in to place your order</p>
                <Link href="/login" className="btn-primary block text-center">Login to Checkout</Link>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="field">
                  <input required placeholder=" " value={form.deliveryAddress}
                    onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                    className="input-base" />
                  <label>Delivery Address</label>
                </div>
                <div className="field">
                  <input required type="tel" placeholder=" " value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input-base" />
                  <label>Phone Number</label>
                </div>
                <div className="field">
                  <textarea rows={2} placeholder=" " value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="input-base textarea-field" />
                  <label>Notes <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
                </div>
                <button type="submit" disabled={placing} className="btn-primary w-full">
                  {placing
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order...</span>
                    : 'Place Order'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
