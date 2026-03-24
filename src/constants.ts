import { ContactInfo, Product, Pattern } from './types/types';

export const APP_NAME = 'مجوهرات بابل';
export const APP_VERSION = '1.0.0';

export const BACKGROUND_LOGO_URL = 'https://i.postimg.cc/25Knz1yL/babl3.png';

const createPatternDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const PATTERNS: Pattern[] = [
  {
    id: 'none',
    name: 'بدون نقش',
    url: '',
    description: 'خلفية صافية تركّز على المنتجات'
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

export const DEFAULT_BACKGROUND_PATTERN_URL =
  PATTERNS.find((pattern) => pattern.recommended)?.url ?? PATTERNS[0].url;

export const PRODUCT_CATEGORIES = {
  ring: { label: 'خواتم', icon: 'Ring' },
  set: { label: 'أطقم كاملة', icon: 'Crown' },
  necklace: { label: 'عقود وسلاسل', icon: 'Link' },
  bracelet: { label: 'أساور', icon: 'Circle' },
  earring: { label: 'أقراط / حلق', icon: 'Disc' }
} as const;

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'طقم ملكي فاخر',
    category: 'set',
    weight: 45.5,
    priceEstimate: 4500000,
    imageUrl: 'https://picsum.photos/id/1/600/600',
    description: 'طقم ذهب عيار 21 بتصميم بحريني تراثي فاخر، يتكون من عقد وسوار وقرطين وخاتم.',
    karat: 21
  },
  {
    id: '2',
    name: 'خاتم السلطانة',
    category: 'ring',
    weight: 8.2,
    priceEstimate: 850000,
    imageUrl: 'https://picsum.photos/id/2/600/600',
    description: 'خاتم عيار 21 مرصع بفصوص الزركون السويسري، تصميم عصري وجذاب.',
    karat: 21
  },
  {
    id: '3',
    name: 'سوار الحب الأبدي',
    category: 'bracelet',
    weight: 15.5,
    priceEstimate: 1600000,
    imageUrl: 'https://picsum.photos/id/3/600/600',
    description: 'سوار عيار 18 بتصميم إيطالي ناعم، مثالي للإهداء.',
    karat: 18
  },
  {
    id: '4',
    name: 'عقد اللؤلؤ الذهبي',
    category: 'necklace',
    weight: 22.0,
    priceEstimate: 2300000,
    imageUrl: 'https://picsum.photos/id/4/600/600',
    description: 'عقد ذهب عيار 21 ممزوج بحبات اللؤلؤ الصناعي عالي الجودة.',
    karat: 21
  },
  {
    id: '5',
    name: 'حلق الأميرة',
    category: 'earring',
    weight: 4.5,
    priceEstimate: 480000,
    imageUrl: 'https://picsum.photos/id/5/600/600',
    description: 'حلق خفيف عيار 21 مناسب للاستخدام اليومي بتصميم ورقة الشجر.',
    karat: 21
  },
  {
    id: '6',
    name: 'سبيكة بابل الخاصة',
    category: 'set',
    weight: 31.1,
    priceEstimate: 3500000,
    imageUrl: 'https://picsum.photos/id/6/600/600',
    description: 'أونصة ذهب عيار 24 صافي للاستثمار والادخار.',
    karat: 24
  }
];

export const WHATSAPP_COUNTRY_CODE = '967';

export const CONTACT_INFO: ContactInfo = {
  manager: '777772879',
  workers: [
    { id: '1', name: 'قعطبة', phone: '774198414' },
    { id: '2', name: 'سناح', phone: '774386432' }
  ],
  landlines: ['02451445', '02451944'],
  designer: {
    name: 'احمد جابر',
    phone: '783447222'
  }
};

export const QURAN_VERSE =
  'يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ';

export const KEY_PRODUCTS = 'products';
export const KEY_FAVORITES = 'favorites';
export const KEY_REQUESTS = 'requests';
export const KEY_PREFERENCES = 'app_preferences';

export const APP_SETTINGS = {
  ITEMS_PER_PAGE: 10,
  CONNECTION_TIMEOUT: 30000,
  SCROLL_THRESHOLD: 500,
  MAX_IMAGE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  CACHE_TTL_MINUTES: 60,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000
} as const;

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
  FAVORITE_ADDED: 'تمت الإضافة إلى المفضلة',
  FAVORITE_REMOVED: 'تمت الإزالة من المفضلة',
  PREFERENCES_SAVED: 'تم حفظ التفضيلات',
  DATA_REFRESHED: 'تم تحديث البيانات بنجاح',
  ORDER_SUBMITTED: 'تم إرسال الطلب بنجاح',
  PRODUCT_SAVED: 'تم حفظ المنتج بنجاح',
  PRODUCT_DELETED: 'تم حذف المنتج بنجاح',
  PRICES_UPDATED: 'تم تحديث الأسعار بنجاح',
  ERROR_GENERIC: 'حدث خطأ، يرجى المحاولة مرة أخرى',
  ERROR_NETWORK: 'تعذر الاتصال بالخادم',
  ERROR_UPLOAD: 'فشل رفع الصورة',
  ERROR_AUTH: 'فشل المصادقة'
} as const;

export const ORDER_STATUS = {
  NEW: { label: 'جديد', color: 'blue' },
  PENDING: { label: 'قيد المراجعة', color: 'yellow' },
  PROCESSING: { label: 'قيد التنفيذ', color: 'orange' },
  COMPLETED: { label: 'مكتمل', color: 'green' },
  CANCELLED: { label: 'ملغي', color: 'red' }
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
} as const;
