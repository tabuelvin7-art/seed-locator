import Link from 'next/link';
import { Product } from '@/lib/types';

const categoryColors: Record<string, string> = {
  'food-crop': 'bg-amber-50 text-amber-700 border-amber-200',
  'horticultural': 'bg-lime-50 text-lime-700 border-lime-200',
  'industrial': 'bg-blue-50 text-blue-700 border-blue-200',
  'indigenous': 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function ProductCard({ product }: { product: Product }) {
  const rating = product.averageRating;
  const fullStars = Math.round(rating);

  return (
    <Link href={`/products/${product._id}`}>
      <div className="group bg-white rounded-2xl border border-stone-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer">
        {/* Image area */}
        <div className="relative bg-stone-50 h-40 flex items-center justify-center border-b border-stone-100 overflow-hidden">
          {product.image
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            : <span className="text-6xl">{product.type === 'seed' ? '🌰' : '🌱'}</span>
          }
          <span className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[product.category] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
            {product.category.replace('-', ' ')}
          </span>
          <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${product.type === 'seed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {product.type}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-stone-800 truncate group-hover:text-emerald-700 transition">{product.name}</h3>
          <p className="text-xs text-stone-400 mt-0.5 truncate">{product.seller?.businessName}</p>

          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-xs ${i < fullStars ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
            ))}
            <span className="text-xs text-stone-400 ml-1">({product.ratingCount})</span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-50">
            <span className="text-emerald-700 font-bold text-sm">KES {product.price.toLocaleString()}</span>
            <span className="text-xs text-stone-400 truncate max-w-24">📍 {product.seller?.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
