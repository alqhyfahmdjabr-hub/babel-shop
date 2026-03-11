import { useState, useCallback, memo } from 'react';
import { Product } from '../types/types';
import { Heart } from 'lucide-react';
import { useImageLoader } from '../hooks/useImageLoader';

interface ProductCardProps {
  product: Product;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onClick: (product: Product) => void;
}

/**
 * ProductCard - بطاقة المنتج
 * مكون معزز بتحميل الصور الكسول والأداء المحسن
 */
export const ProductCard: React.FC<ProductCardProps> = memo(({ product, isFav, onToggleFav, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const { src, isLoaded, imageRef } = useImageLoader(
    product.imageUrl,
    undefined,
    { lazy: true, threshold: 0.1, rootMargin: '100px' }
  );

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFav(product.id);
  }, [onToggleFav, product.id]);

  const handleCardClick = useCallback(() => {
    onClick(product);
  }, [onClick, product]);

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      ring: 'خاتم',
      set: 'طقم',
      bracelet: 'سوار',
      earring: 'أقراط',
      necklace: 'عقد'
    };
    return labels[category] || category;
  };

  return (
      <div
        className="group relative bg-[#080808] rounded-[2rem] overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_10px_30px_-5px_rgba(180,140,40,0.1)] hover:-translate-y-1 cursor-pointer border border-white/[0.05] hover:border-gold-500/30"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {/* Skeleton Loader */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Product Image */}
        <img
          ref={imageRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt={product.name}
          className={`
            w-full h-full object-cover transition-all duration-[2000ms] ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${isHovered ? 'scale-105' : 'scale-100'}
          `}
          loading="lazy"
          decoding="async"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-1000 group-hover:opacity-90" />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.08] hover:bg-gold-500/20 hover:border-gold-500/40 transition-all duration-500 group/fav active:scale-90"
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-500 ${
              isFav ? 'fill-gold-500 text-gold-500' : 'text-gray-300 group-hover/fav:text-gold-200'
            }`}
            strokeWidth={isFav ? 0 : 1.5}
          />
        </button>

        {/* Karat Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-gold-100 text-[10px] font-bold tracking-wider shadow-sm bg-black/60 backdrop-blur-md border border-gold-500/20">
            {product.karat}k
          </span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
          <div className="flex flex-col items-center text-center space-y-2">
            {/* Category & Weight */}
            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-700">
              <span className="text-[10px] text-gray-400 font-bold font-sans">{product.weight}g</span>
              <span className="w-0.5 h-3 bg-gold-700/50 rounded-full" />
              <span className="text-[10px] text-gold-500 font-serif tracking-wide">
                {getCategoryLabel(product.category)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-lg text-white font-medium tracking-wide leading-tight drop-shadow-md line-clamp-2">
              {product.name}
            </h3>

            {/* Trust Badge */}
            <div className="h-0 overflow-hidden group-hover:h-6 transition-all duration-500 delay-100">
              <p className="text-[9px] text-gold-300/60 font-light tracking-widest pt-1 border-t border-white/5 mt-1">
                GOLD & JEWELRY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
