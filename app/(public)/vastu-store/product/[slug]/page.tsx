'use client';
/**
 * app/(public)/vastu-store/product/[slug]/page.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 2 — Issue #7, page
 * speed / Cloudinary):
 *
 * The main product image is the single largest LCP (Largest
 * Contentful Paint) element on this page — it was a raw <img> with no
 * `priority` hint, no responsive `sizes`, and no Cloudinary delivery
 * transform, so the browser was downloading the full upload-resolution
 * image (per upload.routes.ts's transformation: width 1200, height
 * 1200) even though it renders inside a much smaller box on mobile.
 *
 * FIXED: migrated the main image and thumbnail strip to next/image
 * with `priority` on the main image (it's above the fold), explicit
 * `sizes` matching the actual rendered layout, and optimizeImageUrl()
 * applying Cloudinary's f_auto/q_auto/w_ delivery transform sized to
 * where each image actually renders (full main image vs. small 64px
 * thumbnails) — so thumbnails no longer download the same large file
 * as the hero image.
 *
 * UPI/Buy Now logic, cart logic, and all other page behavior are
 * unchanged from the prior round.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../../../components/layout/Navbar';
import Footer from '../../../../../components/layout/Footer';
import CartDrawer from '../../../../../components/common/CartDrawer';
import WhatsAppButton from '../../../../../components/common/WhatsAppButton';
import ProductCard from '../../../../../components/store/ProductCard';
import PriceDisplay from '../../../../../components/common/PriceDisplay';
import UpiPaymentModal from '../../../../../components/payment/UpiPaymentModal';
import { useUIStore } from '../../../../../store/uiStore';
import { useCartStore } from '../../../../../store/cartStore';
import { productsAPI } from '../../../../../lib/api';
import { optimizeImageUrl } from '../../../../../lib/imageOptimize';
import { Product } from '../../../../../types';
import { ShoppingCart, CheckCircle, Star, MessageCircle, QrCode } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATIC_REVIEWS = [
  { name: 'Priya S.', city: 'Mumbai',    rating: 5, text: 'Amazing product! The energy in my home has completely transformed.',           date: '2 days ago' },
  { name: 'Rahul M.', city: 'Delhi',     rating: 5, text: 'Genuine product, beautifully packaged. Highly recommend!',                    date: '1 week ago' },
  { name: 'Anjali K.', city: 'Bangalore', rating: 4, text: 'Very happy with the quality. Fast delivery and well-wrapped.',               date: '2 weeks ago' },
  { name: 'Deepak R.', city: 'Pune',     rating: 5, text: 'Bought this on the recommendation of Dr. PPS Tomar. Absolutely authentic.',   date: '3 weeks ago' },
];

function hasValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder|no-image|noimage|undefined/i.test(t)) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/');
}

export default function ProductDetailPage() {
  const { slug }   = useParams();
  const { lang }   = useUIStore();
  const addItem    = useCartStore(s => s.addItem);
  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<Product[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [added,    setAdded]    = useState(false);
  const [upiOpen,  setUpiOpen]  = useState(false);

  useEffect(() => {
    if (slug) {
      productsAPI.getBySlug(slug as string)
        .then(r => { setProduct(r.data.data); setRelated(r.data.related || []); })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) return (<><Navbar /><div className="min-h-screen flex items-center justify-center"><div className="text-5xl animate-spin">🕉️</div></div><Footer /></>);
  if (!product) return (<><Navbar /><div className="min-h-screen flex items-center justify-center text-center"><div><div className="text-5xl mb-3">📦</div><p>Product not found</p><Link href="/vastu-store" className="text-primary hover:underline mt-4 block">Back to Store</Link></div></div><Footer /></>);

  // Filter out invalid images
  const validImages = (product.images || []).filter(hasValidImage);

  const name        = lang === 'hi' && product.name.hi ? product.name.hi : product.name.en;
  const description = lang === 'hi' && product.description.hi ? product.description.hi : product.description.en;
  const discount    = product.price > product.offerPrice ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;

  // Filter related to only those with valid images
  const validRelated = related.filter(p => hasValidImage((p.images || [])[0]));

  return (
    <>
      <Navbar />
      <main className="bg-cream min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link href="/" className="hover:text-primary">Home</Link><span>›</span>
            <Link href="/vastu-store" className="hover:text-primary">Vastu Store</Link><span>›</span>
            <Link href={`/vastu-store/${product.category}`} className="hover:text-primary capitalize">{product.category}</Link><span>›</span>
            <span className="text-gray-600 truncate max-w-[150px]">{name}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <div className="space-y-3">
              <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-orange-100 relative">
                {discount > 0 && <div className="absolute top-4 left-4 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">{discount}% OFF</div>}
                {product.isNewLaunch && <div className="absolute top-4 right-4 z-10 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl">NEW</div>}
                {validImages[activeImg] ? (
                  // FIXED: next/image with priority (above-the-fold LCP element),
                  // explicit responsive sizes, and Cloudinary delivery transform
                  // sized to the actual rendered box instead of the full upload.
                  <Image
                    src={optimizeImageUrl(validImages[activeImg], 800)}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-orange-50">🕉️</div>
                )}
              </div>
              {validImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {validImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImg === i ? 'border-primary' : 'border-transparent hover:border-orange-200'}`}>
                      {/* FIXED: thumbnails request a small 100px-wide transform
                          instead of downloading the same large hero image. */}
                      <Image src={optimizeImageUrl(img, 100)} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-5">
              <div>
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1 capitalize">{product.category}</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-dark leading-snug">{name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.round(product.rating || 4.8) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />)}</div>
                  <span className="text-sm font-semibold text-gray-700">{(product.rating || 4.8).toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({product.reviewCount || STATIC_REVIEWS.length} reviews)</span>
                  {product.totalSold > 0 && <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">{product.totalSold}+ sold</span>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                <PriceDisplay original={product.price} offer={product.offerPrice} size="lg" />
                {discount > 0 && <p className="text-green-600 text-sm font-semibold mt-1">🎉 You save ₹{(product.price - product.offerPrice).toLocaleString('en-IN')} ({discount}% off)</p>}
              </div>

              <p className="text-text-mid text-sm leading-relaxed">{description}</p>

              {product.benefits.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-text-dark text-sm">Key Benefits</p>
                  {product.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-text-mid text-sm">{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all shadow-orange disabled:opacity-50 ${added ? 'bg-green-500 text-white' : 'bg-primary hover:bg-primary-dark text-white'}`}
                  >
                    <ShoppingCart size={18} />
                    {added ? '✓ Added!' : product.stock > 0 ? (lang === 'en' ? 'Add to Cart' : 'कार्ट में जोड़ें') : 'Out of Stock'}
                  </button>
                  <a href="https://wa.me/917000343804" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm bg-[#25D366] hover:bg-[#128C7E] text-white transition-all">
                    <MessageCircle size={18} /> Ask
                  </a>
                </div>
                {/* UPI direct pay */}
                {product.stock > 0 && (
                  <button
                    onClick={() => setUpiOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-orange-400 text-orange-700 font-bold text-sm hover:bg-orange-50 transition-all"
                  >
                    <QrCode size={16} />
                    Pay via UPI QR — ₹{product.offerPrice.toLocaleString('en-IN')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related products - only show those with valid images */}
        {validRelated.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            <h2 className="font-display text-2xl font-bold text-text-dark mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {validRelated.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />

      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={product.offerPrice}
        itemName={product.name.en}
        itemId={product._id}
        itemType="product"
        requiresAddress={true}
        onSuccess={refId => {
          setUpiOpen(false);
          toast.success(`Order submitted! Ref: ${refId}`);
        }}
      />
    </>
  );
}
