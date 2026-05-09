'use client';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';

export default function CartDrawer() {
  const { showCartDrawer, setShowCartDrawer, lang } = useUIStore();
  const { items, removeItem, updateQty, totalPrice } = useCartStore();
  return (
    <>
      {showCartDrawer && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCartDrawer(false)} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transition-transform duration-300 flex flex-col ${showCartDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-saffron-gradient p-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-white text-lg flex items-center gap-2"><ShoppingCart size={20} />{lang==='en'?'Your Cart':'आपका कार्ट'}</h2>
          <button onClick={() => setShowCartDrawer(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16"><div className="text-5xl mb-3">🛒</div><p className="text-text-light">{lang==='en'?'Your cart is empty':'आपका कार्ट खाली है'}</p><Link href="/vastu-store" onClick={() => setShowCartDrawer(false)} className="mt-4 inline-block text-primary font-semibold text-sm hover:underline">{lang==='en'?'Continue Shopping':'खरीदारी जारी रखें'}</Link></div>
          ) : (
            items.map(item => (
              <div key={item.product._id} className="flex gap-3 p-3 bg-cream rounded-xl">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
                  {item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name.en} className="w-full h-full object-cover rounded-lg" /> : '🕉️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-dark truncate">{item.product.name[lang==='en'?'en':'hi']||item.product.name.en}</p>
                  <p className="text-primary font-bold text-sm">{formatPrice(item.product.offerPrice)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQty(item.product._id, item.qty-1)} className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"><Minus size={12} /></button>
                    <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product._id, item.qty+1)} className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"><Plus size={12} /></button>
                    <button onClick={() => removeItem(item.product._id)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t border-orange-100 bg-white">
            <div className="flex justify-between mb-3"><span className="font-semibold text-text-mid">{lang==='en'?'Total':'कुल'}:</span><span className="font-display font-bold text-xl text-primary">{formatPrice(totalPrice())}</span></div>
            <Link href="/checkout" onClick={() => setShowCartDrawer(false)} className="block w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-center transition-all shadow-orange">{lang==='en'?'🛒 Proceed to Checkout':'चेकआउट करें'}</Link>
          </div>
        )}
      </div>
    </>
  );
}
