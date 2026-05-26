'use client';
// components/store/ProductCard.tsx
// Fixes:
//  1. Undefined stock (search results missing field) — treat undefined as "in stock" 
//     rather than silently defaulting to "out of stock".
//  2. Memoized with React.memo so cart-store updates don't re-render every card.
import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, calculateDiscount } from '../../lib/utils';

interface Props { product: Product; }

function ProductCardInner({ product }: Props) {
  const { lang } = useUIStore();
  const addItem = useCartStore(s => s.addItem);

  const discount = calculateDiscount(product.price, product.offerPrice);
  const name = lang === 'hi' && product.name.hi ? product.name.hi : product.name.en;

  // FIX: stock can be undefined when the product comes from search results
  // (the search API previously omitted the field).
  // Treat undefined as "available" — the product detail page will show the real value.
  // Treat 0 explicitly as "out of stock".
  const stockCount: number = product.stock ?? 1; // undefined → 1 (assume available)
  const inStock = stockCount > 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-orange transition-all border border-orange-50 group"
    >
      <Link href={`/vastu-store/product/${product.slug}`}>
        <div className="relative aspect-square bg-cream overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={name}
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl" aria-hidden="true">
              🕉️
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              {discount}% OFF
            </div>
          )}
          {product.isNewLaunch && (
            <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg">
              NEW
            </div>
          )}

          {/* Only show "Out of Stock" overlay when stock is explicitly 0 */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-text-dark text-sm font-bold px-3 py-1 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/vastu-store/product/${product.slug}`}>
          <h3 className="font-semibold text-text-dark text-sm mb-1 line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-500">
            {product.rating > 0 ? product.rating.toFixed(1) : '4.8'} ({product.reviewCount || 120})
          </span>
          {(product.totalSold ?? 0) > 0 && (
            <span className="ml-auto text-xs text-green-600 font-medium">{product.totalSold}+ sold</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="font-bold text-primary text-lg">{formatPrice(product.offerPrice)}</span>
          {product.price > product.offerPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={() => inStock && addItem(product)}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={14} />
          {inStock
            ? (lang === 'en' ? 'Add to Cart' : 'कार्ट में जोड़ें')
            : (lang === 'en' ? 'Out of Stock' : 'स्टॉक नहीं')}
        </button>
      </div>
    </motion.div>
  );
}

// Memoize: re-render only when the product object or lang changes,
// not on every cart-store update that ripples through the tree.
const ProductCard = memo(ProductCardInner, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.stock === next.product.stock
);

export default ProductCard;
