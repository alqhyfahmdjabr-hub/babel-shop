import { useState, useEffect, useRef, useCallback, Suspense, lazy, useMemo, useDeferredValue, type ChangeEvent, type FC } from 'react';
import { DEFAULT_BACKGROUND_PATTERN_URL, BACKGROUND_LOGO_URL } from './constants/background';
import { CONTACT_INFO } from './constants/contact';
import { QURAN_VERSE } from './constants/text';
import { Product, ViewState, GoldPrice, AppPreferences, PricingSettings } from './types/types';
import { clearLegacyServerBackedData, toggleFavorite, getAppPreferences, saveAppPreferences, getFavorites  } from './services/storage';
import { api } from './services/api';
import { supabase } from './supabase-client';
// 🆕 NEW: Toast and Error Boundary imports
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppChrome } from './app/AppChrome';
import { AppModals } from './app/AppModals';

// 🆕 NEW: Lazy load components for better performance
const GoldTicker = lazy(() => import('./components/GoldTicker').then(m => ({ default: m.GoldTicker })));
const ProductCard = lazy(() => import('./components/ProductCard').then(m => ({ default: m.ProductCard })));
const RequestSection = lazy(() => import('./components/RequestSection').then(m => ({ default: m.RequestSection })));
const Footer = lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));

import { 
  Search, Settings, Sparkles, 
  ShieldCheck, Award, Gem, Handshake, 
  BadgeCheck, Crown, Loader2, X,
  WifiOff 
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// --- Performance Constants ---
const ITEMS_PER_PAGE = 10;
const HOME_FEATURED_COUNT = 6;
const CONNECTION_TIMEOUT = 30000;
const SCROLL_THRESHOLD = 500;
type ProtectedAction = 'requests' | 'checkout' | 'admin';
const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  exchangeRate: 3.8,
  buyMarginPercent: 0,
  sellMarginPercent: 0
};

// 🆕 NEW: Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
  </div>
);

const HOME_TRUST_BADGES = [
  { icon: ShieldCheck, text: 'ضمان العيار' },
  { icon: Gem, text: 'أصالة و جودة' },
  { icon: Award, text: 'دقة في الوزن' }
] as const;

const App: FC = () => {
  // ==========================================
  // 🔒 Security & Auth States
  // ==========================================
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  // ==========================================
  // 🎯 App States
  // ==========================================
  const [activeTab, setActiveTab] = useState<ViewState>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  // أمر لجلب المفضلة من ذاكرة الهاتف فور تشغيل التطبيق
  useEffect(() => {
    void clearLegacyServerBackedData();
    getFavorites().then(setFavorites);
  }, []);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState('');

  // Pagination State
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());
  const [currentPrices, setCurrentPrices] = useState<GoldPrice[]>([]);
  const [liveOunceUsd, setLiveOunceUsd] = useState<number | null>(null);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);

  const [preferences, setPreferences] = useState<AppPreferences>({
    backgroundPattern: DEFAULT_BACKGROUND_PATTERN_URL,
    backgroundOpacity: 0.03
  });

  const [bgState, setBgState] = useState({
    layers: [preferences.backgroundPattern, preferences.backgroundPattern],
    activeIdx: 0
  });

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState<ProtectedAction | null>(null);

  // 🆕 NEW: Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  const canViewGoldPricing = Boolean(session?.user?.email);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevSessionUserIdRef = useRef<string | null>(null);

  // ==========================================
  // 🛠️ Utility Functions
  // ==========================================
  const fetchWithTimeout = useCallback(<T,>(promise: Promise<T>, ms: number = CONNECTION_TIMEOUT): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Connection Timeout')), ms)
      )
    ]);
  }, []);

  const openAuthPrompt = useCallback((action: ProtectedAction | null = null) => {
    setPendingProtectedAction(action);
    setIsAuthPromptOpen(true);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setPendingProtectedAction(null);
    setIsAuthPromptOpen(false);
  }, []);

  // ==========================================
  // 📊 Data Fetching
  // ==========================================
  const fetchInitialData = useCallback(async () => {
    try {
      setLoadingError('');
      const [loadedPrefs, fetchedProducts, pricingData] = await Promise.all([
        getAppPreferences(),
        fetchWithTimeout(api.getProducts(0, ITEMS_PER_PAGE)),
        canViewGoldPricing
          ? Promise.all([
              fetchWithTimeout(api.getPrices()),
              fetchWithTimeout(api.getLatestOuncePriceUsd()),
              fetchWithTimeout(api.getPricingSettings())
            ])
          : Promise.resolve<[GoldPrice[], number | null, PricingSettings | null]>([[], null, null])
      ]);
      const [fetchedPrices, fetchedOunceUsd, fetchedPricingSettings] = pricingData;

      setPreferences(loadedPrefs);
      setBgState({
        layers: [loadedPrefs.backgroundPattern, loadedPrefs.backgroundPattern],
        activeIdx: 0
      });
      setCurrentPrices(fetchedPrices);
      setLiveOunceUsd(fetchedOunceUsd);
      setPricingSettings(fetchedPricingSettings ?? DEFAULT_PRICING_SETTINGS);
      setProducts(fetchedProducts);
      setPage(1);
      setHasMoreProducts(fetchedProducts.length >= ITEMS_PER_PAGE);

    } catch (error) {
      console.error('Failed to load app data', error);
      const errorMessage = error instanceof Error && error.message === 'Connection Timeout'
        ? 'الشبكة بطيئة، يرجى التحقق من الاتصال'
        : 'تعذر تحميل البيانات، يرجى المحاولة لاحقاً';
      setLoadingError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [canViewGoldPricing, fetchWithTimeout, showError]);

  const checkUserRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      setUserRole(data?.role ?? 'user');
    } catch (error) {
      console.error('Error fetching role:', error);
      setUserRole('user');
    }
  }, []);

  // ==========================================
  // 🔐 Auth Effects
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;

      setSession(currentSession);
      if (currentSession) {
        checkUserRole(currentSession.user.id);
      } else {
        setUserRole(null);
      }
      setIsGlobalLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        checkUserRole(nextSession.user.id);
        if (event === 'SIGNED_IN') {
          success('تم تسجيل الدخول بنجاح');
          if (nextSession.user.email) {
            void Promise.all([
              fetchWithTimeout(api.getPrices()),
              fetchWithTimeout(api.getLatestOuncePriceUsd()),
              fetchWithTimeout(api.getPricingSettings())
            ])
              .then(([prices, ounceUsd, settings]) => {
                if (!isMounted) return;
                setCurrentPrices(prices);
                setLiveOunceUsd(ounceUsd);
                setPricingSettings(settings ?? DEFAULT_PRICING_SETTINGS);
              })
              .catch((err) => {
                console.error('Failed to refresh gold pricing after sign-in', err);
              });
          }
        }
      } else {
        setUserRole(null);
        setIsAdminOpen(false);
      }

      setIsGlobalLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserRole, success]);

  useEffect(() => {
    if (isGlobalLoading) return;
    void fetchInitialData();
  }, [isGlobalLoading, fetchInitialData]);

  useEffect(() => {
    if (!session || !pendingProtectedAction) return;

    if (pendingProtectedAction === 'requests') {
      setActiveTab('requests');
      closeAuthPrompt();
      return;
    }

    if (pendingProtectedAction === 'checkout') {
      closeAuthPrompt();
      success('تم تسجيل الدخول، أعد محاولة التواصل');
      return;
    }

    if (pendingProtectedAction === 'admin') {
      if (!userRole) return;

      if (userRole === 'admin') {
        setIsAdminOpen(true);
      } else {
        showError('لا تملك صلاحية الوصول للإدارة');
      }
      closeAuthPrompt();
    }
  }, [session, pendingProtectedAction, userRole, closeAuthPrompt, success, showError]);

  useEffect(() => {
    const currentUserId = session?.user?.id ?? null;
    const prevUserId = prevSessionUserIdRef.current;
    prevSessionUserIdRef.current = currentUserId;

    if (prevUserId) return;
    if (!currentUserId) return;
    if (!isAuthPromptOpen) return;
    if (pendingProtectedAction) return;

    closeAuthPrompt();
  }, [session, isAuthPromptOpen, pendingProtectedAction, closeAuthPrompt]);

  useEffect(() => {
    if (!session && activeTab === 'requests') {
      setActiveTab('home');
    }
  }, [session, activeTab]);

  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const newProducts = await api.getProducts(page, ITEMS_PER_PAGE);
      if (newProducts.length === 0) {
        setHasMoreProducts(false);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
        setHasMoreProducts(newProducts.length >= ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more products', error);
      showError('فشل تحميل المزيد من المنتجات');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, showError]);

  useEffect(() => {
    const handleScroll = () => {
      // Infinite scroll
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - SCROLL_THRESHOLD &&
        !isLoadingMore &&
        hasMoreProducts &&
        !searchTerm &&
        activeTab !== 'requests'
      ) {
        loadMoreProducts();
      }

      // Show scroll to top button
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMoreProducts, searchTerm, activeTab, loadMoreProducts]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // 🎨 Background Effect
  // ==========================================
  useEffect(() => {
    const currentActivePattern = bgState.layers[bgState.activeIdx];
    if (preferences.backgroundPattern === currentActivePattern) {
      return;
    }

    const nextIdx = bgState.activeIdx === 0 ? 1 : 0;
    if (!preferences.backgroundPattern) {
      setBgState(prev => {
        const newLayers = [...prev.layers];
        newLayers[nextIdx] = '';
        return { layers: newLayers, activeIdx: nextIdx };
      });
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.src = preferences.backgroundPattern;
    img.onload = () => {
      if (isCancelled) return;

      setBgState(prev => {
        const newLayers = [...prev.layers];
        newLayers[nextIdx] = preferences.backgroundPattern;
        return { layers: newLayers, activeIdx: nextIdx };
      });
    };

    return () => {
      isCancelled = true;
    };
  }, [preferences.backgroundPattern, bgState.layers, bgState.activeIdx]);

  // ==========================================
  // ❤️ Favorites Handler
  // ==========================================
  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const newFavs = await toggleFavorite(id);
      setFavorites(newFavs);
      
      const isNowFavorite = newFavs.includes(id);
      success(isNowFavorite ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
    } catch (err) {
      showError('فشل تحديث المفضلة');
    }
  }, [success, showError]);

  // ==========================================
  // ⚙️ Preferences Handler
  // ==========================================
  const handleUpdatePreferences = useCallback(async (newPrefs: AppPreferences) => {
    try {
      setPreferences(newPrefs);
      await saveAppPreferences(newPrefs);
      success('تم حفظ التفضيلات');
    } catch (err) {
      showError('فشل حفظ التفضيلات');
    }
  }, [success, showError]);

  // ==========================================
  // 🔐 Admin Access
  // ==========================================
  const handleTabChange = useCallback((tab: ViewState) => {
    if (tab === 'requests' && !session) {
      openAuthPrompt('requests');
      return;
    }
    setActiveTab(tab);
  }, [session, openAuthPrompt]);

  const handleOpenAdmin = useCallback(() => {
    setIsSettingsOpen(false);

    if (!session) {
      openAuthPrompt('admin');
      return;
    }

    if (userRole === 'admin') {
      setIsAdminOpen(true);
      return;
    }

    showError('لا تملك صلاحية الوصول للإدارة');
  }, [session, userRole, openAuthPrompt, showError]);

  const handleRequireCheckoutAuth = useCallback(() => {
    openAuthPrompt('checkout');
  }, [openAuthPrompt]);

  const handleLogout = async () => {
    if (!session) {
      showError('لا يوجد حساب مسجل حالياً');
      return;
    }

    try {
      await supabase.auth.signOut();
      setIsSettingsOpen(false);
      setIsAdminOpen(false);
      setActiveTab('home');
      setFavorites([]);
      setCurrentPrices([]);
      setLiveOunceUsd(null);
      setPricingSettings(DEFAULT_PRICING_SETTINGS);
      success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('Error signing out:', error);
      showError('فشل تسجيل الخروج');
    }
  };

  // ==========================================
  // 🔄 Refresh Data
  // ==========================================
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [initialProds, pricingData] = await Promise.all([
        fetchWithTimeout(api.getProducts(0, ITEMS_PER_PAGE)),
        canViewGoldPricing
          ? Promise.all([
              fetchWithTimeout(api.getPrices()),
              fetchWithTimeout(api.getLatestOuncePriceUsd()),
              fetchWithTimeout(api.getPricingSettings())
            ])
          : Promise.resolve<[GoldPrice[], number | null, PricingSettings | null]>([[], null, null])
      ]);
      const [updatedPrices, updatedOunceUsd, updatedPricingSettings] = pricingData;
      setCurrentPrices(updatedPrices);
      setLiveOunceUsd(updatedOunceUsd);
      setPricingSettings(updatedPricingSettings ?? DEFAULT_PRICING_SETTINGS);
      setProducts(initialProds);
      setPage(1);
      setHasMoreProducts(true);
      success('تم تحديث البيانات بنجاح');
    } catch (e) {
      console.error(e);
      showError('تعذر تحديث البيانات');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [canViewGoldPricing, fetchWithTimeout, success, showError]);

  // ==========================================
  // 🔍 Search Handler
  // ==========================================
  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  // ==========================================
  // 📋 Filtered Products
  // ==========================================
  const filteredProducts = useMemo(() => {
    const favoriteIds = new Set(favorites);
    const baseProducts =
      activeTab === 'favorites'
        ? products.filter((product) => favoriteIds.has(product.id))
        : products;

    if (!deferredSearchTerm) {
      return baseProducts;
    }

    return baseProducts.filter((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      return haystack.includes(deferredSearchTerm);
    });
  }, [products, deferredSearchTerm, activeTab, favorites]);

  const displayedProducts = useMemo(() => {
    if (activeTab === 'home') {
      return products.slice(0, HOME_FEATURED_COUNT);
    }
    return filteredProducts;
  }, [activeTab, filteredProducts, products]);

  const isHomeTab = activeTab === 'home';

  // ==========================================
  // 🛑 Render Checkpoints
  // ==========================================
  if (isGlobalLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-900/20 via-[#020202] to-[#020202]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
          <div className="relative mb-12 group">
            <div className="absolute inset-0 bg-gold-500 blur-[60px] opacity-10 animate-pulse-slow" />
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <img 
                src={BACKGROUND_LOGO_URL} 
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-scale-up" 
                alt="Logo" 
              />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-serif tracking-wide mb-3 opacity-0 animate-slide-up anim-delay-300">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#FFF5D6] via-[#F4D03F] to-[#B7950B]">بابل</span>
          </h1>
          
          <div className="flex items-center gap-3 opacity-0 animate-slide-up anim-delay-600">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gold-500/50" />
            <p className="text-gold-400/80 font-serif text-sm tracking-[0.4em] uppercase">Luxury Jewelry</p>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gold-500/50" />
          </div>
          
          <div className="mt-16 h-8 flex items-center justify-center">
            {loadingError ? (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <WifiOff className="w-6 h-6 text-red-400" />
                <p className="text-red-400 text-sm font-sans">{loadingError}</p>
                <button 
                  onClick={() => { setIsLoading(true); fetchInitialData(); }} 
                  className="mt-2 text-xs text-gold-500 underline hover:text-gold-400"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className="w-48 h-[1px] bg-gray-900 rounded-full relative overflow-visible">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-[shimmer_1.5s_infinite_linear] w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎨 Main Render
  // ==========================================
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#020202] font-sans pb-[max(8rem,env(safe-area-inset-bottom,0px))] selection:bg-gold-900/30 selection:text-gold-100 relative overflow-hidden animate-fade-in text-gray-200">
        {/* 🆕 NEW: Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        {/* Background Effects */}
        <div className="bg-noise" />
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#080808] to-[#050505]" />
          <div
            className="absolute inset-0 z-0 opacity-[0.05]"
            style={{
              backgroundImage: `url('${BACKGROUND_LOGO_URL}')`,
              backgroundPosition: 'center 40%',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100vw',
              filter: 'grayscale(100%) blur(0.5px)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 z-10" />
          {bgState.layers.map((patternUrl, index) =>
            patternUrl ? (
              <div
                key={index}
                className="absolute inset-0 z-20 bg-repeat transition-opacity duration-[2000ms]"
                style={{
                  backgroundImage: `url('${patternUrl}')`,
                  backgroundSize: '140px',
                  opacity: bgState.activeIdx === index ? preferences.backgroundOpacity : 0
                }}
              />
            ) : null
          )}
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header
            className={`relative px-6 text-center ${
              isHomeTab
                ? 'pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-6'
                : 'pt-[max(2rem,env(safe-area-inset-top,0px))] pb-10'
            }`}
          >
            <div className={`flex justify-between items-start ${isHomeTab ? 'mb-4' : 'mb-6'}`}>
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className={`text-gold-600/30 hover:text-gold-400 transition-colors duration-500 rounded-full hover:bg-gold-500/10 ${isHomeTab ? 'p-2.5' : 'p-3'}`}
                aria-label="الإعدادات"
                title="الإعدادات"
              >
                <Settings className="w-5 h-5" strokeWidth={1} />
              </button>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-slow" />
                <div className={`relative bg-gradient-to-br from-[#1a1a1a] to-black rounded-full border border-gold-500/30 shadow-2xl flex items-center justify-center overflow-hidden ${isHomeTab ? 'w-14 h-14 p-2.5' : 'w-16 h-16 p-3'}`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/10 to-transparent" />
                  <img 
                    src={BACKGROUND_LOGO_URL} 
                    alt="Babil" 
                    className="w-full h-full object-contain opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                  />
                </div>
              </div>
            </div>
            
            <div className={`flex flex-col items-center justify-center animate-slide-up ${isHomeTab ? 'space-y-1.5' : 'space-y-2'}`}>
              <h1 className={`font-serif tracking-wide drop-shadow-2xl relative ${isHomeTab ? 'text-5xl md:text-7xl mb-1' : 'text-6xl md:text-8xl mb-2'}`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#FFF5D6] via-[#DCCB96] to-[#A88836] drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">بابل</span>
              </h1>
              <div className={`flex items-center uppercase font-serif text-gold-400/60 ${isHomeTab ? 'gap-3 text-[9px] md:text-[11px] tracking-[0.35em]' : 'gap-4 text-[10px] md:text-xs tracking-[0.5em]'}`}>
                <span className={`${isHomeTab ? 'w-6' : 'w-8'} h-[1px] bg-gradient-to-r from-transparent to-gold-500/50`} />
                <span className="text-gold-200 font-light">للمجوهرات الملكية</span>
                <span className={`${isHomeTab ? 'w-6' : 'w-8'} h-[1px] bg-gradient-to-l from-transparent to-gold-500/50`} />
              </div>
              <div className={`flex flex-wrap justify-center animate-slide-up anim-delay-150 ${isHomeTab ? 'mt-4 gap-2' : 'mt-6 gap-3'}`}>
                {HOME_TRUST_BADGES.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-full bg-gold-900/20 border border-gold-500/20 backdrop-blur-sm flex items-center shadow-lg shadow-black/20 ${isHomeTab ? 'px-2.5 py-1 gap-1.5' : 'px-3 py-1.5 gap-2'}`}
                  >
                    <item.icon className="w-3 h-3 text-gold-400" />
                    <span className={`${isHomeTab ? 'text-[9px]' : 'text-[10px]'} text-gold-200 font-bold tracking-wide`}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`animate-slide-up relative px-4 anim-delay-300 ${isHomeTab ? 'mt-5' : 'mt-8'}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                <Sparkles className={`${isHomeTab ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gold-600/30`} />
              </div>
              <div className={`relative border-t border-b border-gold-500/10 bg-gradient-to-r from-transparent via-gold-900/5 to-transparent ${isHomeTab ? 'py-3' : 'py-4'}`}>
                <p className={`text-center font-serif max-w-2xl mx-auto text-gold-100/90 drop-shadow-md px-2 ${isHomeTab ? 'text-base md:text-lg leading-8' : 'text-lg md:text-xl leading-9'}`}>
                  {QURAN_VERSE}
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-xl mx-auto px-6 relative z-10 space-y-10 min-h-[500px]">
            {activeTab === 'home' && (
              <Suspense fallback={<ComponentLoader />}>
                {canViewGoldPricing ? (
                  <GoldTicker prices={currentPrices} liveOunceUsd={liveOunceUsd} pricingSettings={pricingSettings} />
                ) : (
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-gold-500/15 bg-[#0D0D0D]/85 p-6 text-center shadow-[0_25px_90px_-40px_rgba(212,175,55,0.28)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_55%)]" />
                    <div className="relative z-10 space-y-3">
                      <p className="text-xs uppercase tracking-[0.35em] text-gold-400/60">Gold Pricing Access</p>
                      <h3 className="font-serif text-2xl text-gold-100">سجّل الدخول لعرض أسعار الأونصة</h3>
                      <p className="mx-auto max-w-md text-sm leading-7 text-gray-400">
                        أسعار الذهب المباشرة وإعدادات التحويل لا تظهر إلا للمستخدمين المسجلين ببريد إلكتروني.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAuthPrompt()}
                        className="inline-flex items-center justify-center rounded-2xl bg-gold-600 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-500"
                      >
                        تسجيل الدخول
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 animate-fade-in mb-8">
                  {[
                    { icon: Crown, title: 'موديلات حصرية', subtitle: 'ومتجددة' },
                    { icon: BadgeCheck, title: 'سعر مضمون', subtitle: 'ومنافس للسوق' },
                    { icon: Handshake, title: 'أمانة في', subtitle: 'البيع والشراء' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2.5 group hover:border-gold-500/20 hover:bg-gold-500/5 transition-all duration-500 shadow-lg"
                    >
                      <item.icon className="w-6 h-6 text-gold-600 group-hover:text-gold-400 transition-colors" strokeWidth={1.5} />
                      <span className="text-[10px] text-gray-400 group-hover:text-gold-100 font-medium leading-tight font-serif tracking-wide">
                        {item.title}<br />{item.subtitle}
                      </span>
                    </div>
                  ))}
                </div>
              </Suspense>
            )}

            {/* Search Bar */}
            {(activeTab === 'catalog' || activeTab === 'favorites') && (
              <div className="relative mx-1 animate-slide-up group">
                <div className="absolute inset-0 bg-gold-500/5 rounded-2xl blur-md group-hover:bg-gold-500/10 transition-colors duration-500" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="ابحث عن قطعة نادرة..." 
                  value={searchTerm} 
                  onChange={handleSearch}
                  className="relative w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-5 pr-14 pl-12 text-gold-100 focus:outline-none focus:border-gold-500/40 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all duration-500 placeholder-gray-600 text-sm font-sans shadow-xl"
                />
                <Search className="absolute right-6 top-5 w-5 h-5 text-gray-500 group-hover:text-gold-400 transition-colors duration-500 z-10" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gold-400 transition-colors"
                    aria-label="مسح البحث"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Products Section */}
            {activeTab !== 'requests' && (
              <div className="animate-fade-in border-b border-white/5 pb-4 px-2">
                <div className="flex items-end justify-between">
                  <h2 className="text-3xl font-serif text-gold-100 flex items-center gap-3 drop-shadow-md">
                    {activeTab === 'home' ? 'مختارات بابل' : activeTab === 'favorites' ? 'المقتنيات المحفوظة' : 'الكتالوج العام'}
                  </h2>
                  {activeTab === 'home' && (
                    <button 
                      onClick={() => setActiveTab('catalog')} 
                      className="text-[10px] text-gold-600 hover:text-gold-300 font-bold font-sans tracking-widest transition-all duration-500 underline underline-offset-8 decoration-gold-500/30 decoration-1"
                    >
                      تصفح المزيد
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gold-500/50 font-sans mt-2 tracking-wide font-light">
                  {activeTab === 'home' ? 'قطع فنية تروي قصة الفخامة' : activeTab === 'favorites' ? 'قائمتك المنتقاة بعناية فائقة' : 'تصفح إرثنا من الذهب والمجوهرات'}
                </p>
              </div>
            )}

            {/* Products Grid */}
            {activeTab === 'requests' ? (
              <Suspense fallback={<ComponentLoader />}>
                <RequestSection contact={CONTACT_INFO} prices={currentPrices} />
              </Suspense>
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-5 md:gap-6 animate-fade-in">
                  {displayedProducts.map(product => (
                    <Suspense key={product.id} fallback={<ComponentLoader />}>
                      <ProductCard 
                        product={product} 
                        isFav={favorites.includes(product.id)} 
                        onToggleFav={handleToggleFavorite} 
                        onClick={setSelectedProduct}
                      />
                    </Suspense>
                  ))}
                </div>
                {activeTab !== 'home' && isLoadingMore && (
                  <div className="flex justify-center py-6 animate-fade-in">
                    <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  </div>
                )}
                {activeTab !== 'home' && !hasMoreProducts && filteredProducts.length > ITEMS_PER_PAGE && (
                  <p className="text-center text-gray-600 text-sm py-4">
                    لا يوجد المزيد من المنتجات
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-32 text-gray-600 border border-dashed border-gray-800 rounded-[2rem] animate-fade-in">
                <p className="font-serif text-lg tracking-wide">
                  {searchTerm ? 'لا توجد قطع مطابقة للبحث' : 'لا توجد منتجات'}
                </p>
              </div>
            )}

            {activeTab !== 'requests' && (
              <Suspense fallback={<ComponentLoader />}>
                <Footer contact={CONTACT_INFO} />
              </Suspense>
            )}
          </main>
        </div>

        <AppChrome
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          refreshData={refreshData}
          showScrollTop={showScrollTop}
          scrollToTop={scrollToTop}
        />

        <AppModals
          fallback={<ComponentLoader />}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          preferences={preferences}
          handleUpdatePreferences={handleUpdatePreferences}
          handleOpenAdmin={handleOpenAdmin}
          handleLogout={handleLogout}
          isAuthPromptOpen={isAuthPromptOpen}
          closeAuthPrompt={closeAuthPrompt}
          isAdminOpen={isAdminOpen}
          setIsAdminOpen={setIsAdminOpen}
          currentPrices={currentPrices}
          products={products}
          pricingSettings={pricingSettings}
          refreshData={refreshData}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          contact={CONTACT_INFO}
          session={session}
          handleRequireCheckoutAuth={handleRequireCheckoutAuth}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;

