import { useState } from 'react';
import { Product, ContactInfo } from '../types/types';
import { X, MessageCircle, Scale, Gem, Star } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  contact: ContactInfo;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, contact, isAuthenticated, onRequireAuth }) => {
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  if (!product) return null;

  const buildProductMessage = () => {
    return `مرحبا.. استفسار بخصوص قطعة من "مجوهرات بابل":%0A%0A` +
     `💎 *${product.name}*%0A` +
     `▫️ العيار: ${product.karat}%0A` +
     `▫️ الوزن: ${product.weight} جم%0A%0A` +
     `هل القطعة متوفرة حالياً للعرض أو الحجز؟`;
   };

  const handleWorkerSelect = (workerPhone: string) => {
    const url = `https://wa.me/967${workerPhone}?text=${buildProductMessage()}`;
    window.open(url, '_blank');
    setIsWorkerModalOpen(false);
  };

  const handleWhatsApp = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setIsWorkerModalOpen(true);
  };


  return (
    <div className="fixed inset-0 z-[80] modal-safe flex items-end justify-center sm:items-center sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card Container */}
      <div className="relative flex max-h-[min(92dvh,48rem)] w-full max-w-lg flex-col rounded-t-[3rem] border border-white/[0.05] bg-babil-card shadow-2xl animate-slide-up sm:rounded-[3rem]">

        {/* Close Button - Larger touch area & Fixed position */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 z-50 rounded-full border border-white/10 bg-black/40 p-3 text-white/80 backdrop-blur-xl transition-colors duration-500 hover:bg-black/60 hover:text-white sm:left-6 sm:top-6"
          aria-label="إغلاق"
          title="إغلاق"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Scrollable Content Wrapper */}
        <div className="overflow-y-auto flex-1 overscroll-contain no-scrollbar">

          {/* Product Image Area - Taller */}
          <div className="relative h-[48vh] min-h-[18rem] w-full shrink-0 sm:h-[450px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-babil-card z-10"></div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Karat Tag on Image */}
            <div className="absolute bottom-6 right-5 z-20 sm:bottom-8 sm:right-8">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-5 py-2 rounded-full border border-white/[0.05]">
                <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                <span className="text-gold-100 font-serif text-sm tracking-widest">عيار {product.karat}</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative z-20 -mt-10 min-h-[200px] space-y-6 rounded-t-[3rem] border-t border-white/[0.02] bg-babil-card px-5 pb-8 pt-2 sm:space-y-8 sm:px-8">

            {/* Header */}
            <div className="text-center pt-4">
              <h2 className="text-3xl font-serif text-gold-100/90 mb-3 leading-tight tracking-wide">
                {product.name}
              </h2>
              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600 font-light tracking-widest uppercase">
                <span>مجوهرات ملكية</span>
                <span className="w-0.5 h-0.5 bg-gold-600 rounded-full"></span>
                <span>تصميم فريد</span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="py-6 px-4 rounded-[2rem] bg-white/[0.01] border border-white/[0.02] flex flex-col items-center justify-center gap-3 group hover:border-gold-500/10 transition-colors duration-700">
                <Scale className="w-5 h-5 text-gray-600 group-hover:text-gold-500/50 transition-colors duration-500" strokeWidth={1} />
                <div className="text-center">
                  <span className="block text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">الوزن الصافي</span>
                  <span className="text-xl font-serif text-gray-200">{product.weight} <span className="text-[10px] text-gray-600 font-sans">جرام</span></span>
                </div>
              </div>

              <div className="py-6 px-4 rounded-[2rem] bg-white/[0.01] border border-white/[0.02] flex flex-col items-center justify-center gap-3 group hover:border-gold-500/10 transition-colors duration-700">
                <Gem className="w-5 h-5 text-gray-600 group-hover:text-gold-500/50 transition-colors duration-500" strokeWidth={1} />
                <div className="text-center">
                  <span className="block text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">التصنيف</span>
                  <span className="text-xl font-serif text-gray-200">
                    {product.category === 'ring' ? 'خواتم' :
                      product.category === 'set' ? 'طقم كامل' :
                        product.category === 'bracelet' ? 'سوار' :
                          product.category === 'earring' ? 'أقراط' :
                            product.category === 'necklace' ? 'عقد' : product.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-center text-gray-500 text-sm leading-8 font-light px-2 border-t border-b border-white/[0.02] py-6">
                {product.description}
              </p>
            )}

            {/* Action Button & Assurance */}
            <div>
              <button
                onClick={handleWhatsApp}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-gold-500/20 via-gold-400/20 to-gold-500/20 text-gold-100 font-medium text-lg border border-gold-500/20 hover:bg-gold-500/30 transition-all duration-700 flex items-center justify-center gap-3 group"
              >
                <MessageCircle className="w-5 h-5 text-gold-400/80 group-hover:rotate-12 transition-transform duration-500" strokeWidth={1.5} />
                <span className="font-serif tracking-wide">استفسار عن التفاصيل</span>
              </button>
              <p className="text-center text-[10px] text-gray-600 mt-4 font-light tracking-wide">
                فاتورة رسمية موثقة تضمن حقك في الوزن والعيار
              </p>
            </div>

            {/* Bottom Padding for scroll safety */}
            <div className="h-8"></div>
          </div>
        </div>
      </div>

      {/* --- نافذة اختيار العامل الجديدة --- */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-[100] modal-safe flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs bg-[#0a0a0a] border border-gold-500/20 rounded-[2.5rem] p-6 shadow-2xl relative">
            <h4 className="text-gold-100 text-center font-serif text-lg mb-6 tracking-widest uppercase">
              اختر رقم للتواصل
            </h4>
            
            <div className="space-y-3">
              {contact.workers.map((worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleWorkerSelect(worker.phone)}
                  className="w-full py-4 rounded-2xl bg-white/[0.03] hover:bg-gold-500/10 border border-white/[0.05] hover:border-gold-500/30 text-gold-100/90 text-sm font-medium transition-all duration-500 flex items-center justify-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4 text-gold-500/50 group-hover:text-gold-500" strokeWidth={1} />
                  <span>الفرع {worker.name} - {worker.phone}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsWorkerModalOpen(false)}
              className="w-full mt-6 py-2 text-gray-500 hover:text-white text-xs font-light tracking-widest transition-colors duration-500"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
