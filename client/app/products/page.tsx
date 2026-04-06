'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'food-crop', label: '🌽 Food Crops' },
  { value: 'horticultural', label: '🥦 Horticultural' },
  { value: 'industrial', label: '🌿 Industrial' },
  { value: 'indigenous', label: '🌾 Indigenous' },
];

const TYPES = [
  { value: '', label: 'Seeds & Seedlings' },
  { value: 'seed', label: '🌰 Seeds only' },
  { value: 'seedling', label: '🌱 Seedlings only' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    api.get(`/products?${params}`).then(r => {
      setProducts(r.data.products);
      setTotal(r.data.total);
      setPages(r.data.pages);
    }).finally(() => setLoading(false));
  }, [q, category, type, sort, page]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`/products?${params}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-stone-800">Browse Seeds & Seedlings</h1>
        <p className="text-stone-500 text-sm mt-1">Find quality planting materials from verified sellers across Kenya</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <form onSubmit={e => { e.preventDefault(); updateParam('q', search); }} className="flex gap-2 flex-1 min-w-52">
          <div className="field flex-1">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="e.g. Hybrid Maize"
              className="input-base"
            />
            <label>Search by name</label>
          </div>
          <button type="submit" className="btn-primary self-end">Search</button>
        </form>
        <div className="field min-w-40">
          <select value={category} onChange={e => updateParam('category', e.target.value)} className="input-base select-field">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label>Category</label>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
        </div>
        <div className="field min-w-40">
          <select value={type} onChange={e => updateParam('type', e.target.value)} className="input-base select-field">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label>Type</label>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
        </div>
        <div className="field min-w-40">
          <select value={sort} onChange={e => updateParam('sort', e.target.value)} className="input-base select-field">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label>Sort by</label>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-xs">▾</span>
        </div>
      </div>

      <p className="text-xs text-stone-400 mb-4 font-medium">
        {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
              <div className="bg-stone-100 h-40" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
                <div className="h-4 bg-stone-100 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">🌾</p>
          <p className="font-medium text-stone-500">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => updateParam('page', String(p))}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${p === page ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-300'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
