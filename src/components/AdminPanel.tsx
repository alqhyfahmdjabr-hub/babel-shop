
import { useState, useRef, useEffect } from 'react';
import { Product, GoldPrice, ClientRequest } from '../types/types';
import { api } from '../services/api';
import { supabase } from '../supabase-client';
import { X, Save, Plus, Trash2, Edit2, TrendingUp, Package, Image as ImageIcon, Upload, Tag, Ruler, Loader2, ClipboardList, Phone, Calendar, Wifi, LogOut, User, ShieldAlert } from 'lucide-react';
import { imageService } from '../services/imageService';

interface AdminPanelProps {
  prices: GoldPrice[];
  products: Product[];
  onUpdatePrices: () => void;
  onUpdateProducts: () => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ prices, products, onUpdatePrices, onUpdateProducts, onClose }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'prices' | 'products' | 'orders'>('prices');
  const [editingPrices, setEditingPrices] = useState<GoldPrice[]>(JSON.parse(JSON.stringify(prices)));
  const [showProductForm, setShowProductForm] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<ClientRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ التحقق من الصلاحية
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const role = await api.getUserRole();
        console.log("AdminPanel: الرتبة الحالية ->", role);

        if (role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("فشل في التحقق من الصلاحيات", error);
        setIsAdmin(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkPermission();
  }, []);

  // Fetch orders when tab changes
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await api.getOrders();
      setOrders(fetchedOrders);
    } catch (e) {
      console.error("Failed to fetch orders");
    }
  };

  const handlePriceChange = (index: number, field: 'buy' | 'sell', value: string) => {
    const updated = [...editingPrices];
    updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
    setEditingPrices(updated);
  };

  const handleSavePrices = async () => {
    setIsSaving(true);
    try {
      await api.updatePrices(editingPrices);
      onUpdatePrices();
      alert('تم حفظ الأسعار بنجاح في قاعدة البيانات');
    } catch (e: any) {
      alert('حدث خطأ أثناء الحفظ: ' + (e.message || e.error_description || 'خطأ غير معروف'));
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ تسجيل الخروج بدون useNavigate
  const handleLogout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {
      await supabase.auth.signOut();
      onClose();
      // إعادة تحميل الصفحة بدلاً من التنقل
      window.location.reload();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && showProductForm) {
      if (!file.type.startsWith('image/')) {
        alert('عفواً، يجب اختيار ملف صورة فقط (JPG, PNG, etc).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً! الحد الأقصى هو 5 ميجابايت.');
        return;
      }
      try {
        const publicUrl = await imageService.uploadImage(file);
        setShowProductForm({
          ...showProductForm,
          imageUrl: publicUrl
        });
      } catch (error) {
        console.error("فشل رفع الصورة:", error);
        alert("حدث خطأ أثناء رفع الصورة، تأكد من الاتصال بالإنترنت.");
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProductForm) return;
    setIsSaving(true);
    try {
      const productToSave = {
        ...showProductForm,
        id: showProductForm.id || crypto.randomUUID()
      };
      await api.saveProduct(productToSave);
      onUpdateProducts();
      setShowProductForm(null);
    } catch (e) {
      alert('فشل الحفظ');
      onUpdateProducts();
      setShowProductForm(null);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setIsSaving(true);
      try {
        await api.deleteProduct(id);
        onUpdateProducts();
        alert('تم حذف المنتج بنجاح');
      } catch (e) {
        alert('حدث خطأ أثناء الحذف');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm('هل تريد حذف هذا الطلب نهائياً؟')) {
      try {
        await api.deleteOrder(id);
        fetchOrders();
        alert('تم حذف الطلب بنجاح');
      } catch (e) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const getCategoryLabel = (cat: string) => {
    const mapping: Record<string, string> = {
      'ring': 'خاتم',
      'set': 'طقم',
      'necklace': 'عقد',
      'bracelet': 'سوار',
      'earring': 'أقراط'
    };
    return mapping[cat] || cat;
  };

  // ✅ شاشة التحميل
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fade-in">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
        <p className="text-gold-200 font-bold">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  // ✅ شاشة المنع
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-fade-in p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-500 mb-2">وصول مرفوض</h2>
        <p className="text-gray-400 text-center mb-6">ليس لديك الصلاحيات الكافية للوصول إلى لوحة التحكم.</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            إغلاق
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition"
          >
            تسجيل خروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-neutral-900 p-4 border-b border-gold-900/30 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-gold-500">لوحة التحكم</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-[10px] text-gray-400">
              متصل بقاعدة البيانات (Supabase)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-900/40 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            خروج
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors duration-300">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-neutral-900/50 backdrop-blur-sm border-b border-gray-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('prices')}
          className={`flex-1 py-4 px-4 min-w-fit text-center font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out ${activeTab === 'prices' ? 'text-gold-400 border-b-2 border-gold-400 bg-gold-500/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <TrendingUp className="w-4 h-4" /> الأسعار
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-4 px-4 min-w-fit text-center font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out ${activeTab === 'products' ? 'text-gold-400 border-b-2 border-gold-400 bg-gold-500/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Package className="w-4 h-4" /> المنتجات
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 px-4 min-w-fit text-center font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out ${activeTab === 'orders' ? 'text-gold-400 border-b-2 border-gold-400 bg-gold-500/5' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <ClipboardList className="w-4 h-4" /> الطلبات
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 bg-gradient-to-b from-black to-neutral-900">

        {/* --- PRICES TAB --- */}
        {activeTab === 'prices' && (
          <div className="space-y-6 max-w-lg mx-auto animate-slide-up">
            <div className="bg-babil-card p-6 rounded-2xl border border-gold-900/20 shadow-xl">
              <h3 className="text-gold-200 mb-6 font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> تحديث الأسعار اللحظية
              </h3>
              {editingPrices.map((p, idx) => (
                <div key={p.karat} className="mb-8 last:mb-0 p-4 bg-black/40 rounded-xl border border-gray-800/50">
                  <p className="text-gold-500 font-bold mb-3 text-lg">ذهب عيار {p.karat}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 mr-1">شراء (من الزبون)</label>
                      <input
                        type="number"
                        value={p.buy}
                        onChange={(e) => handlePriceChange(idx, 'buy', e.target.value)}
                        className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all duration-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 mr-1">بيع (للزبون)</label>
                      <input
                        type="number"
                        value={p.sell}
                        onChange={(e) => handlePriceChange(idx, 'sell', e.target.value)}
                        className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all duration-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleSavePrices}
                disabled={isSaving}
                className="w-full bg-gold-600 text-black font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 shadow-lg shadow-gold-600/20 active:scale-95 transition-transform duration-200 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'جاري الحفظ...' : 'حفظ جميع الأسعار'}
              </button>
            </div>
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div className="space-y-4 max-w-lg mx-auto animate-slide-up">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-gray-400 text-sm">إجمالي القطع: <span className="text-gold-500 font-bold">{products.length}</span></span>
              <button
                onClick={() => setShowProductForm({ id: '', name: '', category: 'ring', weight: 0, priceEstimate: 0, imageUrl: '', description: '', karat: 21 })}
                className="bg-gold-600/10 text-gold-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-gold-600/30 hover:bg-gold-600/20 transition-colors duration-300"
              >
                <Plus className="w-4 h-4" /> إضافة جديد
              </button>
            </div>

            <div className="grid gap-3">
              {products.map(product => (
                <div key={product.id} className="bg-babil-card p-3 rounded-xl border border-gray-800/60 flex items-center gap-4 hover:border-gold-900/40 transition-colors duration-300 group">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700 shadow-inner">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate text-base mb-1">{product.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Ruler className="w-3 h-3 text-gold-600" />
                        <span>{product.weight} جم</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gold-500 font-bold px-1.5 py-0.5 bg-gold-500/10 rounded">
                        <span>عيار {product.karat}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Tag className="w-3 h-3 text-blue-400" />
                        <span>{getCategoryLabel(product.category)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowProductForm(product)}
                      className="p-2.5 text-blue-400 bg-blue-400/5 hover:bg-blue-400/20 rounded-xl transition-colors duration-200"
                      title="تعديل"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={isSaving}
                      className="p-2.5 text-red-500 bg-red-500/5 hover:bg-red-500/20 rounded-xl transition-colors duration-200 disabled:opacity-50"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-gray-800">
                <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد منتجات حالياً</p>
              </div>
            )}
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="space-y-4 max-w-lg mx-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-white font-bold text-lg">طلبات الصياغة ({orders.length})</h3>
              <button onClick={fetchOrders} className="text-gold-500 text-sm hover:underline">تحديث القائمة</button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-gray-800">
                <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد طلبات جديدة</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-babil-card border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg hover:border-gold-500/20 transition-colors">
                    <div className="flex gap-4">
                      {/* Order Image */}
                      <div className="w-24 h-24 bg-black rounded-xl overflow-hidden border border-gray-700 shrink-0">
                        <img src={order.imageUrl} className="w-full h-full object-cover" alt="Order Ref" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-gold-400 font-bold text-lg font-mono">#{order.id.slice(-4)}</h4>
                            {order.profiles?.full_name && (
                              <div className="flex items-center gap-1 text-xs text-gold-200 mb-1">
                                <User className="w-3 h-3" />
                                <span>{order.profiles.full_name}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {order.date}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-500 hover:text-red-400 bg-red-900/10 p-2 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Phone className="w-4 h-4 text-gold-600" />
                            <a href={`tel:${order.phone}`} className="hover:text-gold-400 font-mono" dir="ltr">{order.phone}</a>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Ruler className="w-4 h-4 text-gold-600" />
                            <span>{order.weight} جرام</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-neutral-900/80 p-3 rounded-lg text-xs text-gray-400 border border-white/5">
                        <span className="text-gold-600 font-bold block mb-1">ملاحظات:</span>
                        {order.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col animate-fade-in">
          <div className="bg-neutral-900 p-4 border-b border-gray-800 flex justify-between items-center shadow-md">
            <h3 className="text-white font-bold flex items-center gap-2">
              {showProductForm.id ? <Edit2 className="w-4 h-4 text-gold-500" /> : <Plus className="w-4 h-4 text-gold-500" />}
              {showProductForm.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
            </h3>
            <button onClick={() => setShowProductForm(null)} className="p-2 text-gray-400 hover:text-white transition-colors"><X /></button>
          </div>
          <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-4 space-y-6 max-w-lg mx-auto w-full animate-slide-up">
            {/* Image Upload Area */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-300 mr-1">صورة القطعة</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-w-[240px] mx-auto bg-neutral-900 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-gold-500/50 transition-all duration-300 overflow-hidden relative group shadow-2xl hover:shadow-gold-500/10"
              >
                {showProductForm.imageUrl ? (
                  <>
                    <img src={showProductForm.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Preview" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300">
                      <Upload className="w-10 h-10 text-white mb-2" />
                      <span className="text-white text-sm font-bold">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-neutral-800 rounded-full mb-3 text-gold-500 transition-transform duration-300 group-hover:scale-110">
                      <Upload className="w-10 h-10" />
                    </div>
                    <span className="text-sm text-gray-400 font-bold">اضغط هنا لرفع الصورة</span>
                    <span className="text-[10px] text-gray-600 mt-1">PNG, JPG حتى 5MB</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1.5 mr-1">اسم المنتج</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: طقم ملكي عيار 21"
                  value={showProductForm.name}
                  onChange={e => setShowProductForm({ ...showProductForm, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1.5 mr-1">الوزن (جرام)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={showProductForm.weight || ''}
                    onChange={e => setShowProductForm({ ...showProductForm, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none font-mono transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1.5 mr-1">العيار</label>
                  <select
                    value={showProductForm.karat}
                    onChange={e => setShowProductForm({ ...showProductForm, karat: parseInt(e.target.value) as any })}
                    className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none appearance-none transition-all duration-300"
                  >
                    <option value={18}>عيار 18</option>
                    <option value={21}>عيار 21</option>
                    <option value={24}>عيار 24</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1.5 mr-1">التصنيف</label>
                <select
                  value={showProductForm.category}
                  onChange={e => setShowProductForm({ ...showProductForm, category: e.target.value as any })}
                  className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none appearance-none transition-all duration-300"
                >
                  <option value="ring">خواتم</option>
                  <option value="set">أطقم كاملة</option>
                  <option value="necklace">عقود وسلاسل</option>
                  <option value="bracelet">أساور</option>
                  <option value="earring">أقراط / حلق</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1.5 mr-1">الوصف (اختياري)</label>
                <textarea
                  rows={3}
                  placeholder="وصف تفصيلي للقطعة..."
                  value={showProductForm.description}
                  onChange={e => setShowProductForm({ ...showProductForm, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-gray-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none resize-none transition-all duration-300"
                ></textarea>
              </div>
            </div>

            <div className="pt-4 pb-10">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gold-600 text-black font-extrabold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gold-600/10 active:scale-95 transition-all duration-300 ease-out-back disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات نهائياً'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
