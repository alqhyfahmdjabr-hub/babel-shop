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
import { ClientRequest, GoldPrice, PricingSettings, Product } from '../types/types';

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

const sanitizeExchangeRateInput = (value: string): string =>
  value.replace(/[^0-9\u0660-\u0669\u06f0-\u06f9.,\u066b\u066c]/g, '');

const parseExchangeRateInput = (value: string): number | null => {
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

  const [editingPrices, setEditingPrices] = useState<GoldPrice[]>(
    JSON.parse(JSON.stringify(prices))
  );
  const [editingPricingSettings, setEditingPricingSettings] = useState<PricingSettings>({
    ...pricingSettings
  });
  const [exchangeRateInput, setExchangeRateInput] = useState<string>(
    String(pricingSettings.exchangeRate ?? '')
  );
  const [isSavingPricingSettings, setIsSavingPricingSettings] = useState(false);
  const [showProductForm, setShowProductForm] = useState<Product | null>(null);
  const [orders, setOrders] = useState<ClientRequest[]>([]);
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
    setEditingPricingSettings({ ...pricingSettings });
    setExchangeRateInput(String(pricingSettings.exchangeRate ?? ''));
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
      const { data, error } = await (supabase as any)
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

  const handleSavePrices = async () => {
    setIsSaving(true);
    try {
      await api.updatePrices(editingPrices);
      onUpdatePrices();
      alert('تم حفظ الأسعار بنجاح');
    } catch (error: any) {
      alert(`فشل حفظ الأسعار: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePricingSettings = async () => {
    const parsedExchangeRate = parseExchangeRateInput(exchangeRateInput);
    if (parsedExchangeRate === null || parsedExchangeRate <= 0) {
      alert('يرجى إدخال سعر صرف صحيح أكبر من صفر');
      return;
    }
    const safeExchangeRate = parsedExchangeRate;

    setIsSavingPricingSettings(true);
    try {
      await api.updatePricingSettings({
        exchangeRate: safeExchangeRate,
        calcMethod: editingPricingSettings.calcMethod
      });
      setEditingPricingSettings((prev) => ({
        ...prev,
        exchangeRate: safeExchangeRate
      }));
      setExchangeRateInput(String(safeExchangeRate));
      onUpdatePrices();
      alert('تم حفظ إعدادات التسعير بنجاح');
    } catch (error: any) {
      alert(`فشل حفظ إعدادات التسعير: ${error?.message || 'خطأ غير معروف'}`);
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

    setIsSaving(true);
    try {
      await api.saveProduct({
        ...showProductForm,
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
      await api.deleteOrder(id);
      await fetchOrders();
    } catch (error) {
      console.error('Delete order error:', error);
      alert('فشل حذف الطلب');
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
      const { error } = await (supabase as any).from('design_inspirations').insert({
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
      const { error } = await (supabase as any).from('design_inspirations').delete().eq('id', item.id);
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
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs flex items-center gap-1"><LogOut className="w-3 h-3" />خروج</button>
          <button onClick={onClose} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex border-b border-white/10 overflow-x-auto">
        <button onClick={() => setActiveTab('prices')} className={`px-4 py-3 text-sm ${activeTab === 'prices' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}><TrendingUp className="w-4 h-4 inline ml-1" />الأسعار</button>
        <button onClick={() => setActiveTab('products')} className={`px-4 py-3 text-sm ${activeTab === 'products' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}><Package className="w-4 h-4 inline ml-1" />المنتجات</button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-3 text-sm ${activeTab === 'orders' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}><ClipboardList className="w-4 h-4 inline ml-1" />الطلبات</button>
        <button onClick={() => setActiveTab('inspirations')} className={`px-4 py-3 text-sm ${activeTab === 'inspirations' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500'}`}><ImageIcon className="w-4 h-4 inline ml-1" />الإلهام</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'prices' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-gold-300 font-bold">{'\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u062a\u0633\u0639\u064a\u0631 \u0627\u0644\u0630\u0647\u0628'}</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{'\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 (USD \u0625\u0644\u0649 SAR)'}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full bg-black border border-gray-700 rounded-lg p-2"
                  value={exchangeRateInput}
                  onChange={(e) => {
                    setExchangeRateInput(sanitizeExchangeRateInput(e.target.value));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{'\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062d\u0633\u0627\u0628'}</label>
                <select
                  className="w-full bg-black border border-gray-700 rounded-lg p-2"
                  value={editingPricingSettings.calcMethod}
                  onChange={(e) => {
                    const calcMethod = e.target.value === 'from_ounce' ? 'from_ounce' : 'db_prices';
                    setEditingPricingSettings((prev) => ({ ...prev, calcMethod }));
                  }}
                >
                  <option value="db_prices">{'\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u062b\u0627\u0628\u062a\u0629'}</option>
                  <option value="from_ounce">{'\u062d\u0633\u0627\u0628 \u0622\u0644\u064a \u0645\u0646 \u0627\u0644\u0623\u0648\u0646\u0635\u0629'}</option>
                </select>
              </div>
              <button
                onClick={handleSavePricingSettings}
                disabled={isSavingPricingSettings}
                className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold"
              >
                <Save className="w-4 h-4 inline ml-2" />
                {isSavingPricingSettings ? '\u062c\u0627\u0631\u064a \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a...' : '\u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062a\u0633\u0639\u064a\u0631'}
              </button>
            </div>

            {editingPrices.map((p, i) => (
              <div key={p.karat} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4">
                <p className="text-gold-300 font-bold mb-2">عيار {p.karat}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="bg-black border border-gray-700 rounded-lg p-2" value={p.buy} onChange={(e) => { const next = [...editingPrices]; next[i] = { ...next[i], buy: Number(e.target.value) || 0 }; setEditingPrices(next); }} />
                  <input type="number" className="bg-black border border-gray-700 rounded-lg p-2" value={p.sell} onChange={(e) => { const next = [...editingPrices]; next[i] = { ...next[i], sell: Number(e.target.value) || 0 }; setEditingPrices(next); }} />
                </div>
              </div>
            ))}
            <button onClick={handleSavePrices} disabled={isSaving} className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold"><Save className="w-4 h-4 inline ml-2" />{isSaving ? 'جاري الحفظ...' : 'حفظ الأسعار'}</button>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="max-w-lg mx-auto space-y-3">
            <button onClick={() => setShowProductForm({ id: '', name: '', category: 'ring', weight: 0, priceEstimate: 0, imageUrl: '', description: '', karat: 21 })} className="w-full py-3 rounded-xl border border-gold-500/30 text-gold-300"><Plus className="w-4 h-4 inline ml-1" />إضافة منتج</button>
            {products.map((product) => (
              <div key={product.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3 flex gap-3">
                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.weight} جرام - عيار {product.karat}</p>
                </div>
                <button onClick={() => setShowProductForm(product)} className="p-2 text-blue-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => void handleDeleteProduct(product.id)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="max-w-lg mx-auto space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3">
                <div className="flex gap-3">
                  <img src={order.imageUrl} alt="Order" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-gold-300">#{order.id.slice(0, 8)}</p>
                    {order.profiles?.full_name && <p className="text-xs text-gold-100 flex items-center gap-1"><User className="w-3 h-3" />{order.profiles.full_name}</p>}
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{order.phone}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Ruler className="w-3 h-3" />{order.weight} جرام</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{order.date}</p>
                  </div>
                  <button onClick={() => void handleDeleteOrder(order.id)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inspirations' && (
          <div className="max-w-lg mx-auto space-y-4">
            <form onSubmit={handleUploadInspiration} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 space-y-3">
              <input className="w-full bg-black border border-gray-700 rounded-lg p-2" placeholder="عنوان صورة الإلهام" value={inspirationForm.title} onChange={(e) => setInspirationForm((prev) => ({ ...prev, title: e.target.value }))} />
              <select className="w-full bg-black border border-gray-700 rounded-lg p-2" value={inspirationForm.piece_type} onChange={(e) => setInspirationForm((prev) => ({ ...prev, piece_type: e.target.value as InspirationFormState['piece_type'] }))}>
                <option value="general">عام</option><option value="ring">خاتم</option><option value="necklace">عقد</option><option value="bracelet">سوار</option><option value="earring">أقراط</option>
              </select>
              <input ref={inspirationImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInspirationImage} />
              <button type="button" onClick={() => inspirationImageInputRef.current?.click()} className="w-full py-2 rounded-lg border border-dashed border-gray-700"><Upload className="w-4 h-4 inline ml-1" />اختيار صورة</button>
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
                  <button onClick={() => void handleDeleteInspiration(item)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
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
            <button onClick={() => setShowProductForm(null)} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSaveProduct} className="p-4 overflow-y-auto flex-1 space-y-3 max-w-lg mx-auto w-full">
            <input ref={productImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleProductImage} />
            <button type="button" onClick={() => productImageInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-gray-700">
              <Upload className="w-4 h-4 inline ml-1" />اختيار صورة المنتج
            </button>
            {showProductForm.imageUrl && <img src={showProductForm.imageUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" />}
            <input className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.name} onChange={(e) => setShowProductForm({ ...showProductForm, name: e.target.value })} placeholder="اسم المنتج" required />
            <input type="number" step="0.01" className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.weight || ''} onChange={(e) => setShowProductForm({ ...showProductForm, weight: Number(e.target.value) || 0 })} placeholder="الوزن" required />
            <select className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.karat} onChange={(e) => setShowProductForm({ ...showProductForm, karat: Number(e.target.value) as 18 | 21 | 24 })}>
              <option value={18}>18</option><option value={21}>21</option><option value={24}>24</option>
            </select>
            <select className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.category} onChange={(e) => setShowProductForm({ ...showProductForm, category: e.target.value })}>
              <option value="ring">خاتم</option><option value="set">طقم</option><option value="necklace">عقد</option><option value="bracelet">سوار</option><option value="earring">أقراط</option>
            </select>
            <textarea rows={3} className="w-full bg-black border border-gray-700 rounded-lg p-3" value={showProductForm.description} onChange={(e) => setShowProductForm({ ...showProductForm, description: e.target.value })} placeholder="وصف المنتج" />
            <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold"><Save className="w-4 h-4 inline ml-1" />{isSaving ? 'جاري الحفظ...' : 'حفظ المنتج'}</button>
          </form>
        </div>
      )}
    </div>
  );
};
