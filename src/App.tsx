import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { CONTACT_INFO, QURAN_VERSE, BACKGROUND_LOGO_URL } from './constants';
import { Product, ViewState, GoldPrice, AppPreferences } from './types/types';
import { toggleFavorite, getAppPreferences, saveAppPreferences, getFavorites  } from './services/storage';
import { api } from './services/api';
import { supabase } from './supabase-client';
import * as React from 'react'
// 🆕 NEW: Toast and Error Boundary imports
import { useToast, ToastContainer } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// 🆕 NEW: Lazy load components for better performance
const GoldTicker = lazy(() => import('./components/GoldTicker').then(m => ({ default: m.GoldTicker })));
const ProductCard = lazy(() => import('./components/ProductCard').then(m => ({ default: m.ProductCard })));
const ProductModal = lazy(() => import('./components/ProductModal').then(m => ({ default: m.ProductModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const RequestSection = lazy(() => import('./components/RequestSection').then(m => ({ default: m.RequestSection })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const Footer = lazy(() => import('./components/Footer').then(m => ({ default: m.Footer })));
const LoginScreen = lazy(() => import('./LoginScreen').then(m => ({ default: m.default })));

import { 
  Home, Grid, Heart, Search, Settings, Lock, Sparkles, 
  ClipboardList, ShieldCheck, Award, Gem, Handshake, 
  BadgeCheck, Crown, RefreshCw, LogIn, X, Loader2, 
  WifiOff, ChevronUp 
} from 'lucide-react';
import  { Session } from '@supabase/supabase-js';

// --- Performance Constants ---
const ITEMS_PER_PAGE = 10;
const CONNECTION_TIMEOUT = 30000;
const SCROLL_THRESHOLD = 500;

// 🆕 NEW: Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
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
  const [currentPrices, setCurrentPrices] = useState<GoldPrice[]>([]);

  const [preferences, setPreferences] = useState<AppPreferences>({
    backgroundPattern: 'https://www.transparenttextures.com/patterns/arabesque.png',
    backgroundOpacity: 0.03
  });

  const [bgState, setBgState] = useState({
    layers: [preferences.backgroundPattern, preferences.backgroundPattern],
    activeIdx: 0
  });

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [passwordTarget, setPasswordTarget] = useState<'settings' | 'admin'>('settings');

  // 🆕 NEW: Toast notifications
  const { toasts, removeToast, success, error: showError } = useToast();

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // ==========================================
  // 📊 Data Fetching
  // ==========================================
  const fetchInitialData = useCallback(async () => {
    try {
      setLoadingError('');
      const loadedPrefs = await getAppPreferences();
      setPreferences(loadedPrefs);
      setBgState({
        layers: [loadedPrefs.backgroundPattern, loadedPrefs.backgroundPattern],
        activeIdx: 0
      });

      const minWaitPromise = new Promise(resolve => setTimeout(resolve, 1500));
      const [fetchedPrices, fetchedProducts] = await Promise.all([
        fetchWithTimeout(api.getPrices()),
        fetchWithTimeout(api.getProducts(0, ITEMS_PER_PAGE)),
        minWaitPromise
      ]);

      setCurrentPrices(fetchedPrices);
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
  }, [fetchWithTimeout, showError]);

  const checkUserRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setIsGlobalLoading(false);
    }
  }, []);

  // ==========================================
  // 🔐 Auth Effects
  // ==========================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setIsGlobalLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN') {
        setIsLoading(true);
        setIsGlobalLoading(false);
        success('تم تسجيل الدخول بنجاح');
      }

      if (session) {
        if (!userRole) checkUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsGlobalLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchInitialData, checkUserRole, userRole, success]);

  useEffect(() => {
    if (session) {
      fetchInitialData();
    }
  }, [fetchInitialData, session]);

  // ==========================================
  // 📱 Scroll Handler
  // ==========================================
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
  }, [isLoadingMore, hasMoreProducts, searchTerm, activeTab]);

  const loadMoreProducts = async () => {
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
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // 🎨 Background Effect
  // ==========================================
  useEffect(() => {
    const currentActivePattern = bgState.layers[bgState.activeIdx];
    if (preferences.backgroundPattern !== currentActivePattern) {
      const img = new Image();
      img.src = preferences.backgroundPattern;
      img.onload = () => {
        setBgState(prev => {
          const nextIdx = prev.activeIdx === 0 ? 1 : 0;
          const newLayers = [...prev.layers];
          newLayers[nextIdx] = preferences.backgroundPattern;
          return { layers: newLayers, activeIdx: nextIdx };
        });
      };
    }
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
  const openPasswordFor = useCallback((target: 'settings' | 'admin') => {
    if (userRole === 'admin') {
      if (target === 'settings') setIsSettingsOpen(true);
      else setIsAdminOpen(true);
      return;
    }

    setPasswordTarget(target);
    setIsPasswordModalOpen(true);
    setAuthError('');
  }, [userRole]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      // 1. جلب كلمة المرور الصحيحة من قاعدة البيانات
      // إرسال الرقم الذي أدخله المستخدم للحارس الآمن ليفحصه
      const isPasswordCorrect = await api.verifyAdminPassword(password);

      if (isPasswordCorrect || userRole === 'admin') {
        setIsPasswordModalOpen(false);
        setPassword('');
        if (passwordTarget === 'settings') setIsSettingsOpen(true);
        else setIsAdminOpen(true);
      } else {
        setAuthError('كلمة المرور غير صحيحة أو ليس لديك صلاحية المدير');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsSettingsOpen(false);
      setFavorites([]);
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
      const [updatedPrices, initialProds] = await Promise.all([
        fetchWithTimeout(api.getPrices()),
        fetchWithTimeout(api.getProducts(0, ITEMS_PER_PAGE))
      ]);
      setCurrentPrices(updatedPrices);
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
  }, [fetchWithTimeout, success, showError]);

  // ==========================================
  // 🔍 Search Handler
  // ==========================================
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  // ==========================================
  // 📋 Filtered Products
  // ==========================================
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'favorites') return favorites.includes(p.id) && matchesSearch;
      return matchesSearch;
    });
  }, [products, searchTerm, activeTab, favorites]);

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

  if (!session) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <LoginScreen />
      </Suspense>
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
          
          <h1 className="text-6xl md:text-7xl font-serif tracking-wide mb-3 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#FFF5D6] via-[#F4D03F] to-[#B7950B]">بابل</span>
          </h1>
          
          <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
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
      <div className="min-h-screen bg-[#020202] font-sans pb-32 selection:bg-gold-900/30 selection:text-gold-100 relative overflow-hidden animate-fade-in text-gray-200">
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
          {bgState.layers.map((patternUrl, index) => (
            <div 
              key={index} 
              className="absolute inset-0 z-20 bg-repeat transition-opacity duration-[2000ms]" 
              style={{ 
                backgroundImage: `url('${patternUrl}')`, 
                opacity: bgState.activeIdx === index ? preferences.backgroundOpacity : 0,
                filter: 'invert(1) contrast(0.7)' 
              }} 
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="relative pt-8 pb-10 px-6 text-center">
            <div className="flex justify-between items-start mb-6">
              <button 
                onClick={() => openPasswordFor('settings')} 
                className="p-3 text-gold-600/30 hover:text-gold-400 transition-colors duration-500 rounded-full hover:bg-gold-500/10"
                aria-label="الإعدادات"
              >
                <Settings className="w-5 h-5" strokeWidth={1} />
              </button>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse-slow" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#1a1a1a] to-black rounded-full border border-gold-500/30 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/10 to-transparent" />
                  <img 
                    src={BACKGROUND_LOGO_URL} 
                    alt="Babil" 
                    className="w-full h-full object-contain opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center animate-slide-up space-y-2">
              <h1 className="font-serif text-6xl md:text-8xl mb-2 tracking-wide drop-shadow-2xl relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#FFF5D6] via-[#DCCB96] to-[#A88836] drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">بابل</span>
              </h1>
              <div className="flex items-center gap-4 text-gold-400/60 text-[10px] md:text-xs tracking-[0.5em] uppercase font-serif">
                <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-gold-500/50" />
                <span className="text-gold-200 font-light">للمجوهرات الملكية</span>
                <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-gold-500/50" />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                {[
                  { icon: ShieldCheck, text: 'ضمان العيار' },
                  { icon: Gem, text: 'أصالة و جودة' },
                  { icon: Award, text: 'دقة في الوزن' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-gold-900/20 border border-gold-500/20 backdrop-blur-sm flex items-center gap-2 shadow-lg shadow-black/20"
                  >
                    <item.icon className="w-3 h-3 text-gold-400" />
                    <span className="text-[10px] text-gold-200 font-bold tracking-wide">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 animate-slide-up relative px-4" style={{ animationDelay: '0.3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">
                <Sparkles className="w-4 h-4 text-gold-600/30" />
              </div>
              <div className="relative py-4 border-t border-b border-gold-500/10 bg-gradient-to-r from-transparent via-gold-900/5 to-transparent">
                <p className="text-center font-serif text-lg md:text-xl leading-9 max-w-2xl mx-auto text-gold-100/90 drop-shadow-md px-2">
                  {QURAN_VERSE}
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-xl mx-auto px-6 relative z-10 space-y-10 min-h-[500px]">
            {activeTab === 'home' && (
              <Suspense fallback={<ComponentLoader />}>
                <GoldTicker prices={currentPrices} />
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
            {(activeTab === 'home' || activeTab === 'catalog' || activeTab === 'favorites') && (
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
                    onClick={clearSearch}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gold-400 transition-colors"
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
                <RequestSection contact={CONTACT_INFO} />
              </Suspense>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-5 md:gap-6 animate-fade-in">
                  {filteredProducts.map(product => (
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
                {isLoadingMore && (
                  <div className="flex justify-center py-6 animate-fade-in">
                    <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  </div>
                )}
                {!hasMoreProducts && filteredProducts.length > ITEMS_PER_PAGE && (
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

        {/* Bottom Navigation */}
        <nav className="fixed bottom-6 left-6 right-6 h-20 bg-[#080808]/80 backdrop-blur-xl border border-white/10 rounded-full z-40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] max-w-md mx-auto">
          <div className="flex justify-around items-center h-full px-2">
            {[
              { id: 'home', icon: Home, label: 'الرئيسية' },
              { id: 'catalog', icon: Grid, label: 'المعرض' },
              { id: 'requests', icon: ClipboardList, label: 'الطلبات' },
              { id: 'favorites', icon: Heart, label: 'المفضلة' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as ViewState)} 
                className="flex flex-col items-center justify-center w-16 h-full space-y-1.5 transition-all duration-500 group relative"
              >
                {activeTab === item.id && (
                  <div className="absolute top-0 w-8 h-1 bg-gold-500 rounded-b-full shadow-[0_2px_10px_rgba(212,175,55,0.5)]" />
                )}
                <item.icon 
                  className={`w-5 h-5 transition-transform duration-500 ${
                    activeTab === item.id 
                      ? '-translate-y-1 text-gold-400 scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' 
                      : 'text-gray-600 group-hover:text-gray-400 group-hover:-translate-y-0.5'
                  }`} 
                  strokeWidth={activeTab === item.id ? 2 : 1.5} 
                  fill={activeTab === item.id && item.id === 'favorites' ? 'currentColor' : 'none'} 
                />
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${
                  activeTab === item.id ? 'text-gold-100 opacity-100 translate-y-0' : 'text-gray-600 opacity-0 translate-y-2'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Status Bar */}
        <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#020202] border-t border-white/10 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-2 text-[9px] text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading || isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`} />
            <span className="font-sans font-medium tracking-wide">
              {activeTab === 'home' ? 'الرئيسية' : activeTab === 'catalog' ? 'المعرض العام' : activeTab === 'requests' ? 'قسم الطلبات الخاصة' : 'المفضلة'}
            </span>
          </div>
          <button 
            onClick={refreshData} 
            disabled={isRefreshing} 
            className="flex items-center gap-1.5 text-[9px] text-gold-600 hover:text-gold-400 transition-colors group"
          >
            <span>تحديث البيانات</span>
            <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin text-gold-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-28 right-6 w-10 h-10 bg-gold-600/20 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center text-gold-400 hover:bg-gold-600/30 transition-all z-30 animate-fade-in"
            aria-label="العودة للأعلى"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Modals */}
        {isSettingsOpen && (
          <Suspense fallback={<ComponentLoader />}>
            <SettingsModal 
              preferences={preferences} 
              onUpdatePreferences={handleUpdatePreferences} 
              onOpenAdmin={() => { setIsSettingsOpen(false); setIsAdminOpen(true); }} 
              onClose={() => setIsSettingsOpen(false)} 
              onLogout={handleLogout}
            />
          </Suspense>
        )}

        {/* Password Modal */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-black/95 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0F0F0F] border border-white/[0.05] p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl animate-scale-up relative">
              <button 
                onClick={() => { setIsPasswordModalOpen(false); setAuthError(''); setPassword(''); }} 
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <Lock className="w-8 h-8 text-gold-600/60 mx-auto mb-6 opacity-80" strokeWidth={0.5} />
              <h3 className="text-lg font-serif text-gold-100 mb-2 tracking-wide">تسجيل الدخول</h3>
              <p className="text-gray-600 text-[10px] mb-8 font-light tracking-wider">لوحة تحكم المشرفين فقط</p>
              
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute right-4 top-4 w-5 h-5 text-gray-600" />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    autoFocus 
                    required 
                    placeholder="كلمة المرور" 
                    className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-gold-500/50 transition-all font-sans text-sm"
                  />
                </div>
                
                {authError && (
                  <div className="text-red-400 text-xs py-2 animate-pulse">{authError}</div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isAuthLoading} 
                  className="w-full bg-gold-600/10 hover:bg-gold-600/20 border border-gold-600/20 text-gold-400 font-bold py-4 rounded-xl transition-all duration-500 font-serif flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <span className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><LogIn className="w-4 h-4" /><span>دخول</span></>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {isAdminOpen && (
          <Suspense fallback={<ComponentLoader />}>
            <AdminPanel
              prices={currentPrices}
              products={products}
              onUpdatePrices={() => refreshData()}
              onUpdateProducts={() => refreshData()}
              onClose={() => setIsAdminOpen(false)}
            />
          </Suspense>
        )}

        {selectedProduct && (
          <Suspense fallback={<ComponentLoader />}>
            <ProductModal 
              product={selectedProduct} 
              onClose={() => setSelectedProduct(null)} 
              contact={CONTACT_INFO}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;