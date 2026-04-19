import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  Edit2,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Package,
  Phone,
  Plus,
  Ruler,
  Save,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Upload,
  User,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { imageService } from '../services/imageService';
import { supabase } from '../supabase-client';
import { ClientRequest, GoldPrice, OrderStatus, PricingSettings, Product } from '../types/types';
import { getOrderStatusUi } from '../utils/orderStatus';

interface DesignInspiration {
  id: string;
  title: string;
  piece_type: string;
  image_url: string;
  storage_path: string;
}

interface InspirationFormState {
  title: string;
  piece_type: 'general' | 'ring' | 'necklace' | 'bracelet' | 'earring';
  imageFile: File | null;
}

interface AdminPanelProps {
  prices: GoldPrice[];
  products: Product[];
  pricingSettings: PricingSettings;
  onUpdatePrices: () => void;
  onUpdateProducts: () => void;
  onClose: () => void;
}

const normalizeDigitsToEnglish = (value: string): string =>
  Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
      if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
      return char;
    })
    .join('');

const sanitizeNumericInput = (value: string): string =>
  value.replace(/[^0-9\u0660-\u0669\u06f0-\u06f9.,\u066b\u066c]/g, '');

const parseNumericInput = (value: string): number | null => {
  const normalizedDigits = normalizeDigitsToEnglish(value.trim());
  const withDotSeparator = normalizedDigits.replace(/[\u066b\u066c]/g, '.').replace(/,/g, '.');
  const cleaned = withDotSeparator.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const firstDotIndex = cleaned.indexOf('.');
  const normalizedNumber =
    firstDotIndex === -1
      ? cleaned
      : `${cleaned.slice(0, firstDotIndex + 1)}${cleaned.slice(firstDotIndex + 1).replace(/\./g, '')}`;

  if (!normalizedNumber) return null;

  const parsed = Number.parseFloat(normalizedNumber);
  return Number.isFinite(parsed) ? parsed : null;
};

const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'ring', label: 'خاتم' },
  { value: 'set', label: 'طقم' },
  { value: 'necklace', label: 'عقد' },
  { value: 'bracelet', label: 'سوار' },
  { value: 'earring', label: 'أقراط' }
] as const;

const PRODUCT_CATEGORY_INPUT_REGEX = /^[A-Za-z\u0621-\u063A\u0641-\u064A]+(?:\s[A-Za-z\u0621-\u063A\u0641-\u064A]+)*$/;

const sanitizeProductCategoryInput = (value: string): string =>
  value
    .replace(/[^A-Za-z\u0621-\u063A\u0641-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart();

const isPresetProductCategory = (value: string): boolean =>
  PRODUCT_CATEGORY_OPTIONS.some((option) => option.value === value);

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);

export const AdminPanel: React.FC<AdminPanelProps> = ({
  prices,
  products,
  pricingSettings,
  onUpdatePrices,
  onUpdateProducts,
  onClose
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'prices' | 'products' | 'orders' | 'inspirations'>('prices');
  const [exchangeRateInput, setExchangeRateInput] = useState<string>(String(pricingSettings.exchangeRate ?? ''));
  const [buyMarginInput, setBuyMarginInput] = useState<string>(String(pricingSettings.buyMarginPercent ?? ''));
  const [sellMarginInput, setSellMarginInput] = useState<string>(String(pricingSettings.sellMarginPercent ?? ''));
  const [isSavingPricingSettings, setIsSavingPricingSettings] = useState(false);
  const [showProductForm, setShowProductForm] = useState<Product | null>(null);
  const [orders, setOrders] = useState<ClientRequest[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [inspirations, setInspirations] = useState<DesignInspiration[]>([]);
  const [isLoadingInspirations, setIsLoadingInspirations] = useState(false);
  const [inspirationForm, setInspirationForm] = useState<InspirationFormState>({
    title: '',
    piece_type: 'general',
    imageFile: null
  });

  const productImageInputRef = useRef<HTMLInputElement>(null);
  const inspirationImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const role = await api.getUserRole();
        setIsAdmin(role === 'admin');
      } catch (error) {
        console.error('Role check error:', error);
        setIsAdmin(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    void checkRole();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') void fetchOrders();
    if (activeTab === 'inspirations') void fetchInspirations();
  }, [activeTab]);

  useEffect(() => {
    setExchangeRateInput(String(pricingSettings.exchangeRate ?? ''));
    setBuyMarginInput(String(pricingSettings.buyMarginPercent ?? ''));
    setSellMarginInput(String(pricingSettings.sellMarginPercent ?? ''));
  }, [pricingSettings]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    }
  };

  const fetchInspirations = async () => {
    setIsLoadingInspirations(true);
    try {
      const { data, error } = await supabase
        .from('design_inspirations')
        .select('id, title, piece_type, image_url, storage_path')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInspirations((data || []) as DesignInspiration[]);
    } catch (error) {
      console.error('Fetch inspirations error:', error);
      alert('تعذر تحميل صور الإلهام');
    } finally {
      setIsLoadingInspirations(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    await supabase.auth.signOut();
    onClose();
    window.location.reload();
  };

  const handleSavePricingSettings = async () => {
    const parsedExchangeRate = parseNumericInput(exchangeRateInput);
    if (parsedExchangeRate === null || parsedExchangeRate <= 0) {
      alert('يرجى إدخال سعر صرف صحيح أكبر من صفر');
      return;
    }

    const parsedBuyMargin = parseNumericInput(buyMarginInput);
    if (parsedBuyMargin === null || parsedBuyMargin < 0 || parsedBuyMargin >= 100) {
      alert('يرجى إدخال هامش شراء صحيح من 0 إلى أقل من 100');
      return;
    }

    const parsedSellMargin = parseNumericInput(sellMarginInput);
    if (parsedSellMargin === null || parsedSellMargin < 0 || parsedSellMargin >= 100) {
      alert('يرجى إدخال هامش بيع صحيح من 0 إلى أقل من 100');
      return;
    }

    setIsSavingPricingSettings(true);
    try {
      await api.updatePricingSettings({
        exchangeRate: parsedExchangeRate,
        buyMarginPercent: parsedBuyMargin,
        sellMarginPercent: parsedSellMargin
      });
      setExchangeRateInput(String(parsedExchangeRate));
      setBuyMarginInput(String(parsedBuyMargin));
      setSellMarginInput(String(parsedSellMargin));
      onUpdatePrices();
      alert('تم حفظ إعدادات التسعير بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      alert(`فشل حفظ إعدادات التسعير: ${message}`);
    } finally {
      setIsSavingPricingSettings(false);
    }
  };

  const handleProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !showProductForm) return;

    const validation = imageService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error || 'ملف الصورة غير صالح');
      return;
    }

    try {
      const url = await imageService.uploadImage(file);
      setShowProductForm({ ...showProductForm, imageUrl: url });
    } catch (error) {
      console.error('Product image upload error:', error);
      alert('فشل رفع صورة المنتج');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProductForm) return;

    const categoryValue = isPresetProductCategory(showProductForm.category)
      ? showProductForm.category
      : sanitizeProductCategoryInput(showProductForm.category).trim();

    if (!categoryValue) {
      alert('يرجى اختيار الفئة أو إدخالها يدويًا');
      return;
    }

    if (!isPresetProductCategory(categoryValue) && !PRODUCT_CATEGORY_INPUT_REGEX.test(categoryValue)) {
      alert('الفئة يجب أن تحتوي على حروف عربية أو إنجليزية فقط');
      return;
    }

    setIsSaving(true);
    try {
      await api.saveProduct({
        ...showProductForm,
        category: categoryValue,
        id: showProductForm.id || crypto.randomUUID()
      });
      onUpdateProducts();
      setShowProductForm(null);
    } catch (error) {
      console.error('Save product error:', error);
      alert('فشل حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    setIsSaving(true);
    try {
      await api.deleteProduct(id);
      onUpdateProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      alert('فشل حذف المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائيًا؟')) return;
    try {
      await api.adminDeleteOrder(id);
      await fetchOrders();
    } catch (error) {
      console.error('Delete order error:', error);
      alert('فشل حذف الطلب');
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    setUpdatingOrderId(id);
    try {
      await api.updateOrderStatus(id, status);
      await fetchOrders();
    } catch (error) {
      console.error('Update order status error:', error);
      alert('فشل تحديث حالة الطلب');
    } finally {
      setUpdatingOrderId((prev) => (prev === id ? null : prev));
    }
  };

  const handleInspirationImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const validation = imageService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error || 'ملف الصورة غير صالح');
      return;
    }

    setInspirationForm((prev) => ({ ...prev, imageFile: file }));
  };

  const handleUploadInspiration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspirationForm.title.trim() || !inspirationForm.imageFile) {
      alert('يرجى إدخال العنوان واختيار صورة');
      return;
    }

    setIsSaving(true);
    try {
      const uploaded = await imageService.uploadStudioInspirationImage(inspirationForm.imageFile);
      const { error } = await supabase.from('design_inspirations').insert({
        title: inspirationForm.title.trim(),
        piece_type: inspirationForm.piece_type,
        image_url: uploaded.url,
        storage_path: uploaded.path,
        is_active: true
      });
      if (error) throw error;

      setInspirationForm({ title: '', piece_type: 'general', imageFile: null });
      if (inspirationImageInputRef.current) inspirationImageInputRef.current.value = '';
      await fetchInspirations();
    } catch (error) {
      console.error('Upload inspiration error:', error);
      alert('فشل رفع صورة الإلهام');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInspiration = async (item: DesignInspiration) => {
    if (!confirm('هل تريد حذف صورة الإلهام؟')) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('design_inspirations').delete().eq('id', item.id);
      if (error) throw error;
      await imageService.deleteImage(item.storage_path);
      await fetchInspirations();
    } catch (error) {
      console.error('Delete inspiration error:', error);
      alert('فشل حذف صورة الإلهام');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-14 h-14 text-red-500 mb-4" />
        <h2 className="text-red-500 text-2xl font-bold mb-2">وصول مرفوض</h2>
        <p className="text-gray-400 text-center mb-6">هذه اللوحة متاحة للمشرف فقط.</p>
        <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-800 text-white">إغلاق</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-gold-400 font-bold text-xl">لوحة الإدارة</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs flex items-center gap-1">
            <LogOut className="w-3 h-3" />
            خروج
          </button>
          <button type="button" onClick={onClose} className="p-2 text-gray-400" aria-label="إغلاق" title="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 overflow-x-auto">
        <button onClick={() => setActiveTab('prices')} className={`px-4 py-3 text-sm ${activeTab === 'prices' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}>
          <TrendingUp className="w-4 h-4 inline ml-1" />
          الأسعار
        </button>
        <button onClick={() => setActiveTab('products')} className={`px-4 py-3 text-sm ${activeTab === 'products' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}>
          <Package className="w-4 h-4 inline ml-1" />
          المنتجات
        </button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-3 text-sm ${activeTab === 'orders' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}>
          <ClipboardList className="w-4 h-4 inline ml-1" />
          الطلبات
        </button>
        <button onClick={() => setActiveTab('inspirations')} className={`px-4 py-3 text-sm ${activeTab === 'inspirations' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}>
          <ImageIcon className="w-4 h-4 inline ml-1" />
          الإلهام
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'prices' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-gold-300 font-bold">إعدادات التسعير المركزية</p>
                <p className="text-xs text-gray-400 leading-6">
                  يتم التعديل هنا مباشرة. بعد الحفظ تقوم قاعدة البيانات بإعادة احتساب جدول الأسعار تلقائيًا اعتمادًا على آخر أونصة محفوظة في السجل.
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="admin-exchange-rate">سعر الصرف (USD إلى SAR)</label>
                <input
                  id="admin-exchange-rate"
                  type="text"
                  inputMode="decimal"
                  className="w-full bg-black border border-gray-700 rounded-lg p-2"
                  value={exchangeRateInput}
                  onChange={(e) => setExchangeRateInput(sanitizeNumericInput(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="admin-buy-margin">هامش الشراء %</label>
                  <input
                    id="admin-buy-margin"
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-black border border-gray-700 rounded-lg p-2"
                    value={buyMarginInput}
                    onChange={(e) => setBuyMarginInput(sanitizeNumericInput(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">يُخصم من السعر الأساسي عند حساب سعر الشراء.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="admin-sell-margin">هامش البيع %</label>
                  <input
                    id="admin-sell-margin"
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-black border border-gray-700 rounded-lg p-2"
                    value={sellMarginInput}
                    onChange={(e) => setSellMarginInput(sanitizeNumericInput(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">يُضاف إلى السعر الأساسي عند حساب سعر البيع.</p>
                </div>
              </div>

              <button
                onClick={handleSavePricingSettings}
                disabled={isSavingPricingSettings}
                className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold"
              >
                <Save className="w-4 h-4 inline ml-2" />
                {isSavingPricingSettings ? 'جاري حفظ الإعدادات...' : 'حفظ إعدادات التسعير'}
              </button>
            </div>

            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gold-300 font-bold">الأسعار الحالية من قاعدة البيانات</p>
                <span className="text-[11px] text-gray-500">قراءة فقط</span>
              </div>
              <div className="space-y-3">
                {prices.map((price) => (
                  <div key={price.karat} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gold-200">عيار {price.karat}</p>
                      <span className="text-[11px] text-gray-500">
                        الفارق: {formatUsd(Math.max(0, price.sell - price.buy))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-white/5 bg-[#111] p-3">
                        <p className="text-gray-500 text-xs mb-1">شراء</p>
                        <p className="text-gray-100 font-bold">{formatUsd(price.buy)}</p>
                      </div>
                      <div className="rounded-lg border border-gold-500/20 bg-[#161106] p-3">
                        <p className="text-gray-500 text-xs mb-1">بيع</p>
                        <p className="text-gold-200 font-bold">{formatUsd(price.sell)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {prices.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-700 p-4 text-center text-sm text-gray-500">
                    لا توجد أسعار متاحة حاليًا.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="max-w-lg mx-auto space-y-3">
            <button
              onClick={() => setShowProductForm({ id: '', name: '', category: 'ring', weight: 0, priceEstimate: 0, imageUrl: '', description: '', karat: 21 })}
              className="w-full py-3 rounded-xl border border-gold-500/30 text-gold-300"
            >
              <Plus className="w-4 h-4 inline ml-1" />
              إضافة منتج
            </button>
            {products.map((product) => (
              <div key={product.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3 flex gap-3">
                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.weight} جرام - عيار {product.karat}</p>
                </div>
                <button type="button" onClick={() => setShowProductForm(product)} className="p-2 text-blue-400" aria-label="تعديل المنتج" title="تعديل المنتج">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => void handleDeleteProduct(product.id)} className="p-2 text-red-400" aria-label="حذف المنتج" title="حذف المنتج">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="max-w-lg mx-auto space-y-3">
            {orders.map((order) => {
              const statusUi = getOrderStatusUi(order.status);
              const isUpdating = updatingOrderId === order.id;

              return (
                <div key={order.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3">
                  <div className="flex gap-3">
                    <img src={order.imageUrl} alt="Order" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gold-300">#{order.id.slice(0, 8)}</p>
                          {order.profiles?.full_name && (
                            <p className="text-xs text-gold-100 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.profiles.full_name}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-full text-[11px] ${statusUi.badgeClass}`}>
                          {statusUi.label}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.phone}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {order.weight} جرام
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {order.date}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="flex-1 bg-black border border-gray-700 rounded-lg p-2 text-xs"
                          title="حالة الطلب"
                          aria-label="حالة الطلب"
                          value={statusUi.status}
                          disabled={isUpdating}
                          onChange={(e) => void handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        >
                          <option value="new">تم استلام الطلب</option>
                          <option value="pending">قيد المراجعة</option>
                          <option value="processing">قيد التنفيذ</option>
                          <option value="completed">جاهز للاستلام</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-gold-400" aria-label="جاري تحديث الحالة" />}
                      </div>
                    </div>

                    <button type="button" onClick={() => void handleDeleteOrder(order.id)} className="p-2 text-red-400" aria-label="حذف الطلب" title="حذف الطلب">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'inspirations' && (
          <div className="max-w-lg mx-auto space-y-4">
            <form onSubmit={handleUploadInspiration} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-3">
              <input
                className="w-full bg-black border border-gray-700 rounded-lg p-2"
                placeholder="عنوان صورة الإلهام"
                value={inspirationForm.title}
                onChange={(e) => setInspirationForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <select
                className="w-full bg-black border border-gray-700 rounded-lg p-2"
                title="نوع القطعة"
                aria-label="نوع القطعة"
                value={inspirationForm.piece_type}
                onChange={(e) => setInspirationForm((prev) => ({ ...prev, piece_type: e.target.value as InspirationFormState['piece_type'] }))}
              >
                <option value="general">عام</option>
                <option value="ring">خاتم</option>
                <option value="necklace">عقد</option>
                <option value="bracelet">سوار</option>
                <option value="earring">أقراط</option>
              </select>
              <input
                id="admin-inspiration-image"
                ref={inspirationImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="صورة الإلهام"
                title="صورة الإلهام"
                onChange={handleInspirationImage}
              />
              <button type="button" onClick={() => inspirationImageInputRef.current?.click()} className="w-full py-2 rounded-lg border border-dashed border-gray-700">
                <Upload className="w-4 h-4 inline ml-1" />
                اختيار صورة
              </button>
              {inspirationForm.imageFile && <p className="text-xs text-gray-400">{inspirationForm.imageFile.name}</p>}
              <button type="submit" disabled={isSaving} className="w-full py-2 rounded-lg bg-gold-600 text-black font-bold">رفع صورة إلهام</button>
            </form>

            {isLoadingInspirations ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold-400" /></div>
            ) : (
              inspirations.map((item) => (
                <div key={item.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <img src={item.image_url} alt={item.title} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-xs text-gray-500">النوع: {item.piece_type}</p>
                  </div>
                  <button type="button" onClick={() => void handleDeleteInspiration(item)} className="p-2 text-red-400" aria-label="حذف الإلهام" title="حذف الإلهام">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showProductForm && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-lg">{showProductForm.id ? 'تعديل منتج' : 'إضافة منتج'}</h3>
            <button type="button" onClick={() => setShowProductForm(null)} className="p-2 text-gray-400" aria-label="إغلاق" title="إغلاق">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSaveProduct} className="p-4 overflow-y-auto flex-1 space-y-3 max-w-lg mx-auto w-full">
            <input
              id="admin-product-image"
              ref={productImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="صورة المنتج"
              title="صورة المنتج"
              onChange={handleProductImage}
            />
            <button type="button" onClick={() => productImageInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-gray-700">
              <Upload className="w-4 h-4 inline ml-1" />
              اختيار صورة المنتج
            </button>
            {showProductForm.imageUrl && <img src={showProductForm.imageUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" />}
            <input className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.name} onChange={(e) => setShowProductForm({ ...showProductForm, name: e.target.value })} placeholder="اسم المنتج" required />
            <input type="number" step="0.01" className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.weight || ''} onChange={(e) => setShowProductForm({ ...showProductForm, weight: Number(e.target.value) || 0 })} placeholder="الوزن" required />
            <select className="w-full bg-black border border-gray-700 rounded-lg p-3" title="العيار" aria-label="العيار" value={showProductForm.karat} onChange={(e) => setShowProductForm({ ...showProductForm, karat: Number(e.target.value) as 18 | 21 | 24 })}>
              <option value={18}>18</option>
              <option value={21}>21</option>
              <option value={24}>24</option>
            </select>
            <select
              className="w-full bg-black border border-gray-700 rounded-lg p-3"
              title="الفئة"
              aria-label="الفئة"
              value={isPresetProductCategory(showProductForm.category) ? showProductForm.category : 'custom'}
              onChange={(e) => {
                const nextValue = e.target.value;
                setShowProductForm({
                  ...showProductForm,
                  category:
                    nextValue === 'custom'
                      ? (isPresetProductCategory(showProductForm.category) ? '' : showProductForm.category)
                      : nextValue
                });
              }}
            >
              {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="custom">إدخال يدوي</option>
            </select>
            {!isPresetProductCategory(showProductForm.category) && (
              <input
                className="w-full bg-black border border-gray-700 rounded-lg p-3"
                title="الفئة"
                aria-label="الفئة"
                value={showProductForm.category}
                onChange={(e) =>
                  setShowProductForm({
                    ...showProductForm,
                    category: sanitizeProductCategoryInput(e.target.value)
                  })
                }
                placeholder="الفئة"
                autoComplete="off"
                required
              />
            )}
            <textarea rows={3} className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.description} onChange={(e) => setShowProductForm({ ...showProductForm, description: e.target.value })} placeholder="وصف المنتج" />
            <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold">
              <Save className="w-4 h-4 inline ml-1" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
