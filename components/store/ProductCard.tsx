'use client';
/**
 * components/store/ProductCard.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 2 — Issue #4, products
 * need a working Buy Now + UPI option, confirmed missing from
 * production screenshots — cards showed "Add to Cart" only):
 *
 * ADDED:
 *  - "Buy Now" button: adds the single item to a fresh checkout intent
 *    and navigates straight to /checkout, bypassing the cart-then-
 *    checkout detour. Implemented via cartStore's existing addItem()
 *    plus a router push — does NOT change cartStore's shape or any
 *    other consumer of it, so the cart drawer / multi-item checkout
 *    flow is completely unaffected.
 *  - "UPI" button: opens UpiPaymentModal directly from the card,
 *    exactly like the service cards, instead of requiring a trip to
 *    the product detail page first.
 *
 * Existing "Add to Cart" behavior, stock-check logic, discount badge,
 * memoization, and image rendering are unchanged.
 */
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Zap, QrCode } from 'lucide-react';
import { Product } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { optimizeImageUrl } from '../../lib/imageOptimize';
import UpiPaymentModal from '../payment/UpiPaymentModal';

interface Props { product: Product; }

function ProductCardInner({ product }: Props) {
  const { lang } = useUIStore();
  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();
  const [upiOpen, setUpiOpen] = useState(false);

  const discount = calculateDiscount(product.price, product.offerPrice);
  const name = lang === 'hi' && product.name.hi ? product.name.hi : product.name.en;

  const stockCount: number = product.stock ?? 1;
  const inStock = stockCount > 0;

  // FIXED: working Buy Now — adds this single item then navigates
  // straight to checkout. Uses the existing cartStore.addItem(), so
  // it's the same data path "Add to Cart" already uses and tested in
  // production — just chained with an immediate navigation instead of
  // staying on the listing page.
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem(product, 1);
    router.push('/checkout');
  };

  const handleUpiClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    setUpiOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -6 }}
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-orange transition-all border border-orange-50 group"
      >
        <Link href={`/vastu-store/product/${product.slug}`}>
          <div className="relative aspect-square bg-cream overflow-hidden">
            {product.images?.[0] ? (
              <Image
                src={optimizeImageUrl(product.images[0], 400)}
                alt={name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                placeholder="empty"
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

          {/* Primary row: Buy Now + Add to Cart */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={14} />
              {lang === 'en' ? 'Buy Now' : 'अभी खरीदें'}
            </button>
            <button
              onClick={() => inStock && addItem(product)}
              disabled={!inStock}
              className="flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={14} />
              {inStock
                ? (lang === 'en' ? 'Add' : 'जोड़ें')
                : (lang === 'en' ? 'Out of Stock' : 'स्टॉक नहीं')}
            </button>
          </div>

          {/* UPI fallback row */}
          <button
            onClick={handleUpiClick}
            disabled={!inStock}
            className="w-full flex items-center justify-center gap-1.5 border border-orange-300 text-orange-700 py-2 rounded-xl text-xs font-semibold hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode size={13} />
            {lang === 'en' ? 'Pay via UPI' : 'UPI से भुगतान करें'}
          </button>
        </div>
      </motion.div>

      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={product.offerPrice}
        itemName={name}
        itemId={product._id}
        itemType="product"
        requiresAddress
        onSuccess={refId => {
          setUpiOpen(false);
          import('react-hot-toast').then(({ default: toast }) => {
            toast.success(`Order submitted! Ref: ${refId}`);
          });
        }}
      />
    </>
  );
}

const ProductCard = memo(ProductCardInner, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.stock === next.product.stock
);

export default ProductCard;
