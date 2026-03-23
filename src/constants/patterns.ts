import type { Pattern } from '../types/types';

const createPatternDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const PATTERNS: Pattern[] = [
  {
    id: 'none',
    name: 'بدون نقش',
    url: '',
    description: 'خلفية صافية تركز على المنتجات'
  },
  {
    id: 'arabesque-soft',
    name: 'أرابيسك هادئ',
    url: createPatternDataUrl(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'>
        <g stroke='#D4AF37' stroke-opacity='.24' stroke-width='1.2'>
          <circle cx='30' cy='30' r='18'/>
          <circle cx='90' cy='30' r='18'/>
          <circle cx='30' cy='90' r='18'/>
          <circle cx='90' cy='90' r='18'/>
          <path d='M30 12v36M12 30h36M90 12v36M72 30h36M30 72v36M12 90h36M90 72v36M72 90h36'/>
        </g>
        <circle cx='60' cy='60' r='4' fill='#FFF5D6' fill-opacity='.28'/>
      </svg>
    `),
    description: 'الأكثر ملاءمة لهوية المجوهرات',
    recommended: true
  },
  {
    id: 'filigree-grid',
    name: 'شبكة ذهبية ناعمة',
    url: createPatternDataUrl(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'>
        <g stroke='#D4AF37' stroke-opacity='.22' stroke-width='1'>
          <path d='M0 20h120M0 60h120M0 100h120M20 0v120M60 0v120M100 0v120'/>
          <path d='M20 20l40 40 40-40M20 100l40-40 40 40'/>
        </g>
      </svg>
    `),
    description: 'نقش هندسي فاخر وخفيف'
  },
  {
    id: 'silk-weave',
    name: 'نسيج مخملي',
    url: createPatternDataUrl(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120' fill='none'>
        <g stroke='#EAD8A0' stroke-opacity='.2' stroke-width='1.2'>
          <path d='M0 18c18-7 36-7 54 0s36 7 54 0 34-7 52 0'/>
          <path d='M0 42c18 7 36 7 54 0s36-7 54 0 34 7 52 0'/>
          <path d='M0 66c18-7 36-7 54 0s36 7 54 0 34-7 52 0'/>
          <path d='M0 90c18 7 36 7 54 0s36-7 54 0 34 7 52 0'/>
        </g>
      </svg>
    `),
    description: 'ملمس ناعم يهدئ الخلفية'
  },
  {
    id: 'marble-vein',
    name: 'رخام فاخر',
    url: createPatternDataUrl(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120' fill='none'>
        <g stroke='#FFF5D6' stroke-opacity='.18' stroke-width='1.1'>
          <path d='M10 18c16 10 31 10 48 0s30-10 48 0 31 10 46 0'/>
          <path d='M0 50c20-12 39-12 58 0s37 12 56 0 30-12 46 0'/>
          <path d='M14 84c16 9 31 9 47 0s33-9 50 0 31 9 45 0'/>
        </g>
      </svg>
    `),
    description: 'أهدأ خيار بصري مع لمسة فخامة'
  }
];

