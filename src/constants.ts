import { ContactInfo, Product, GoldPrice } from './types/types';

export const APP_NAME = "مجوهرات بابل";
export const APP_VERSION = "1.0.0";

export const BACKGROUND_LOGO_URL = "https://i.postimg.cc/25Knz1yL/babl3.png";

// Patterns for background
export const PATTERNS = [
  { id: 'arabesque', name: 'زخرفة عربية', url: 'https://www.transparenttextures.com/patterns/arabesque.png' },
  { id: 'scales', name: 'حراشف التنين', url: 'https://www.transparenttextures.com/patterns/black-scales.png' },
  { id: 'diamond', name: 'تنجيد فاخر', url: 'https://www.transparenttextures.com/patterns/black-thread.png' },
  { id: 'leather', name: 'جلد أسود', url: 'https://www.transparenttextures.com/patterns/black-leather.png' },
  { id: 'carbon', name: 'كاربون فايبر', url: 'https://www.transparenttextures.com/patterns/carbon-fibre.png' },
  { id: 'wood', name: 'خشب محروق', url: 'https://www.transparenttextures.com/patterns/purty-wood.png' },
];

// Product Categories
export const PRODUCT_CATEGORIES = {
  ring: { label: 'خواتم', icon: 'Ring' },
  set: { label: 'أطقم كاملة', icon: 'Crown' },
  necklace: { label: 'عقود وسلاسل', icon: 'Link' },
  bracelet: { label: 'أساور', icon: 'Circle' },
  earring: { label: 'أقراط / حلق', icon: 'Disc' }
} as const;

// Mock Products (for fallback)
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
    name: 'حلق الاميرة',
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

// Mock Prices (for fallback)
export const MOCK_PRICES: GoldPrice[] = [
  { karat: 24, buy: 34500, sell: 35000 },
  { karat: 21, buy: 30200, sell: 30800 },
  { karat: 18, buy: 25800, sell: 26500 },
];

export const WHATSAPP_COUNTRY_CODE = '967'; // إضافة كود الدولة كمرجع ثابت
// Contact Information
export const CONTACT_INFO: ContactInfo = {
  manager: '777772879',
  workers: [
    { id: '1', name: 'نايف ', phone: '774198414' },
    { id: '2', name: 'عباس', phone: '774386432' }
  ],
  landlines: ['02451445', '02451944'],
  designer: {
    name: 'احمد جابر',
    phone: '783447222'
  }
};

// Quran Verse
export const QURAN_VERSE = "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ إِلَّا أَن تَكُونَ تِجَارَةً عَن تَرَاضٍ مِّنكُمْ";

// Storage Keys
export const KEY_PRICES = 'gold_prices';
export const KEY_PRODUCTS = 'products';
export const KEY_FAVORITES = 'favorites';
export const KEY_REQUESTS = 'requests';
export const KEY_PREFERENCES = 'app_preferences';

// App Settings
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

// Toast Messages
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

// Order Status
export const ORDER_STATUS = {
  NEW: { label: 'جديد', color: 'blue' },
  PENDING: { label: 'قيد المراجعة', color: 'yellow' },
  PROCESSING: { label: 'قيد التنفيذ', color: 'orange' },
  COMPLETED: { label: 'مكتمل', color: 'green' },
  CANCELLED: { label: 'ملغي', color: 'red' }
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
} as const;
