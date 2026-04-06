'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Product, Rating } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import SellerMap from '@/components/SellerMap';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  'food-crop': 'bg-amber-50 text-amber-700 border-amber-200',
  'horticultural': 'bg-lime-50 text-lime-700 border-lime-200',
  'industrial': 'bg-blue-50 text-blue-700 border-blue-200',
  'indigenous': 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);
  const [ratingForm, setRatingForm] = useState({ ratingValue: 5, reviewText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState('');
  const [ratingError, setRatingError] = useState(false);
  const [canRate, setCanRate] = useState<boolean | null>(null);

  const fetchProduct = () => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data.product);
      setRatings(r.data.ratings);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProduct(); }, [id]);

  // Check if farmer has a delivered order with this product
  useEffect(() => {
    if (user?.role === 'farmer' && id) {
      api.get('/orders/my').then(r => {
        const delivered = r.data.some((o: { status: string; items: { product: string }[] }) =>
          o.status === 'delivered' && o.items.some(i => i.product === id)
        );
        setCanRate(delivered);
      }).catch(() => setCanRate(false));
    }
  }, [user, id]);

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRatingMsg('');
    setRatingError(false);
    try {
      await api.post(`/products/${id}/rate`, ratingForm);
      setRatingMsg('Your rating has been submitted!');
      setRatingForm({ ratingValue: 5, reviewText: '' });
      fetchProduct();
    } catch {
      setRatingMsg('Failed to submit rating. Please try again.');
      setRatingError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Loading...</div>
  );
  if (!product) return (
    <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">Product not found.</div>
  );

  const seller = product.seller;
  const fullStars = Math.round(product.averageRating);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">

        {/* ── Product Info ── */}
        <div>
          <div className="bg-stone-50 border border-stone-100 rounded-2xl h-60 flex items-center justify-center text-8xl mb-5 overflow-hidden">
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              : (product.type === 'seed' ? '🌰' : '🌱')}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${categoryColors[product.category] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
              {product.category.replace('-', ' ')}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${product.type === 'seed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {product.type}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-stone-800">{product.name}</h1>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < fullStars ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
              ))}
            </div>
            <span className="text-sm text-stone-500">{product.averageRating} · {product.ratingCount} review{product.ratingCount !== 1 ? 's' : ''}</span>
          </div>

          <p className="text-3xl font-bold text-emerald-700 mt-4">KES {product.price.toLocaleString()}</p>
          <p className="text-sm text-stone-400 mt-1">{product.stockQuantity} units in stock</p>

          {/* Add to Cart */}
          {product.stockQuantity > 0 && user?.role !== 'seller' && user?.role !== 'admin' && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-stone-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2 text-stone-500 hover:bg-stone-50 font-bold transition">−</button>
                  <span className="px-4 py-2 text-sm font-semibold text-stone-800 min-w-[2.5rem] text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}
                    className="px-3 py-2 text-stone-500 hover:bg-stone-50 font-bold transition">+</button>
                </div>
                <button
                  onClick={() => {
                    add(product, qty);
                    setAddedMsg(true);
                    setTimeout(() => setAddedMsg(false), 2000);
                  }}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  🛒 {addedMsg ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
              {addedMsg && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700">
                  <span>✓ Added to cart</span>
                  <Link href="/cart" className="font-semibold underline">View Cart →</Link>
                </div>
              )}
            </div>
          )}
          {product.stockQuantity === 0 && (
            <p className="mt-4 text-sm text-red-500 font-medium">Out of stock</p>
          )}

          {product.description && (
            <p className="text-stone-600 mt-4 text-sm leading-relaxed border-t border-stone-100 pt-4">
              {product.description}
            </p>
          )}
        </div>

        {/* ── Seller Info + Map ── */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Seller</p>
            <p className="font-bold text-stone-800 text-lg">{seller.businessName}</p>
            <p className="text-sm text-stone-500 capitalize mt-0.5">{seller.businessType?.replace('-', ' ')}</p>
            <div className="mt-3 space-y-1.5 text-sm text-stone-600">
              <p>📍 {seller.location}</p>
              {seller.user?.phone && <p>📞 {seller.user.phone}</p>}
              {seller.user?.email && <p>✉️ {seller.user.email}</p>}
            </div>
          </div>

          {seller.latitude && seller.longitude && (
            <SellerMap lat={seller.latitude} lng={seller.longitude} name={seller.businessName} />
          )}
        </div>
      </div>

      {/* ── Rating Form ── */}
      {user?.role === 'farmer' && (
        <div className="mt-10 card p-6">
          <h2 className="font-bold text-stone-800 text-lg mb-1">Leave a Review</h2>
          <p className="text-stone-400 text-sm mb-5">Share your experience with this product</p>

          {canRate === false && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <span>🔒</span>
              <span>You can only review products you have purchased and received. Place an order first.</span>
            </div>
          )}

          {canRate === true && (
            <>
              {ratingMsg && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 ${
                  ratingError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  <span>{ratingError ? '⚠' : '✓'}</span><span>{ratingMsg}</span>
                </div>
              )}
              <form onSubmit={submitRating} className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Your Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" onClick={() => setRatingForm({ ...ratingForm, ratingValue: v })}
                        className={`text-2xl transition-transform hover:scale-110 ${v <= ratingForm.ratingValue ? 'text-amber-400' : 'text-stone-200'}`}>★</button>
                    ))}
                    <span className="ml-2 text-sm text-stone-500 self-center">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingForm.ratingValue]}
                    </span>
                  </div>
                </div>
                <div className="field">
                  <textarea rows={3} placeholder="Write your review here..." value={ratingForm.reviewText}
                    onChange={e => setRatingForm({ ...ratingForm, reviewText: e.target.value })}
                    className="input-base textarea-field" />
                  <label>Review <span className="text-stone-300 normal-case tracking-normal font-normal">(optional)</span></label>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</span> : 'Submit Review'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── Reviews List ── */}
      {ratings.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-stone-800 text-lg mb-4">Reviews <span className="text-stone-400 font-normal text-base">({ratings.length})</span></h2>
          <div className="space-y-3">
            {ratings.map(r => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      {r.user.username[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-stone-700">{r.user.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-xs ${i < r.ratingValue ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                {r.reviewText && <p className="text-sm text-stone-600 leading-relaxed">{r.reviewText}</p>}
                <p className="text-xs text-stone-400 mt-2">{new Date(r.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
