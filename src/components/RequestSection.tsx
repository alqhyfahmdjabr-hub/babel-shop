import { useEffect, useMemo, useState } from 'react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageCircle,
  RefreshCw,
  Scale,
  Send,
  Smartphone,
  Trash2,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../supabase-client';
import { ClientRequest, ContactInfo, GoldPrice, PricingSettings } from '../types/types';
import { calculateGramPrice } from '../utils/goldCalculator';

interface RequestSectionProps {
  contact: ContactInfo;
  liveOunceUsd?: number | null;
  pricingSettings: PricingSettings;
}

interface DesignInspiration {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
}

interface StudioSubmissionSnapshot {
  pieceName: string;
  pieceType: 'ring' | 'necklace' | 'bracelet' | 'custom';
  karat: 18 | 21 | 24;
  rawGoldEstimateUsd: number | null;
  selectedInspirationTitle?: string;
  selectedInspirationUrl?: string;
}

const pieceTypeLabel: Record<'ring' | 'necklace' | 'bracelet' | 'custom', string> = {
  ring: 'خاتم',
  necklace: 'عقد',
  bracelet: 'سوار',
  custom: 'مخصص'
};

export const RequestSection: React.FC<RequestSectionProps> = ({
  contact,
  liveOunceUsd = null,
  pricingSettings
}) => {
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingInspirations, setIsLoadingInspirations] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('جاري معالجة الصورة...');

  const [myOrders, setMyOrders] = useState<ClientRequest[]>([]);
  const [pricingSourcePrices, setPricingSourcePrices] = useState<GoldPrice[]>([]);
  const [lastOrder, setLastOrder] = useState<ClientRequest | null>(null);
  const [pendingWhatsAppMessage, setPendingWhatsAppMessage] = useState('');
  const [inspirations, setInspirations] = useState<DesignInspiration[]>([]);
  const [selectedInspirationId, setSelectedInspirationId] = useState<string | null>(null);
  const [lastStudioSnapshot, setLastStudioSnapshot] = useState<StudioSubmissionSnapshot | null>(null);

  const [pieceName, setPieceName] = useState('');
  const [pieceType, setPieceType] = useState<'ring' | 'necklace' | 'bracelet' | 'custom'>('custom');
  const [selectedKarat, setSelectedKarat] = useState<18 | 21 | 24>(21);
  const [formData, setFormData] = useState({
    phone: '',
    weight: '',
    notes: '',
    imageFile: null as File | null,
    imageUrl: ''
  });

  const parsedWeight = Number.parseFloat(formData.weight);
  const isWeightValid = Number.isFinite(parsedWeight) && parsedWeight > 0;
  const exchangeRate =
    typeof pricingSettings?.exchangeRate === 'number' &&
    Number.isFinite(pricingSettings.exchangeRate) &&
    pricingSettings.exchangeRate > 0
      ? pricingSettings.exchangeRate
      : 3.8;
  const calcMethod = pricingSettings?.calcMethod === 'from_ounce' ? 'from_ounce' : 'db_prices';
  const ounceDerivedGramUsd = calculateGramPrice(liveOunceUsd, selectedKarat, exchangeRate).usd;
  const selectedDbPrice = pricingSourcePrices.find((p) => p.karat === selectedKarat) || null;
  const dbDerivedGramUsd = (() => {
    if (!selectedDbPrice) return null;
    const buy = Number(selectedDbPrice.buy);
    const sell = Number(selectedDbPrice.sell);
    const validBuy = Number.isFinite(buy) && buy > 0 ? buy : null;
    const validSell = Number.isFinite(sell) && sell > 0 ? sell : null;
    if (validBuy !== null && validSell !== null) return (validBuy + validSell) / 2;
    return validSell ?? validBuy;
  })();
  const estimatedGramUsd = calcMethod === 'from_ounce' ? ounceDerivedGramUsd : dbDerivedGramUsd;
  const rawGoldEstimateUsd = estimatedGramUsd !== null && isWeightValid
    ? parsedWeight * estimatedGramUsd
    : null;

  const selectedInspiration = useMemo(
    () => inspirations.find((item) => item.id === selectedInspirationId) || null,
    [inspirations, selectedInspirationId]
  );

  useEffect(() => {
    if (activeView === 'track') {
      void fetchMyOrders();
    }
    if (activeView === 'create' && inspirations.length === 0) {
      void fetchInspirations();
    }
  }, [activeView, inspirations.length]);

  useEffect(() => {
    let isCancelled = false;
    const loadPricingSource = async () => {
      if (calcMethod !== 'db_prices') return;
      try {
        const rows = await api.getPrices();
        if (!isCancelled) setPricingSourcePrices(rows);
      } catch (error) {
        console.error('Error loading pricing source prices:', error);
      }
    };
    void loadPricingSource();
    return () => {
      isCancelled = true;
    };
  }, [calcMethod]);

  useEffect(() => {
    return () => {
      if (formData.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imageUrl);
      }
    };
  }, [formData.imageUrl]);

  const fetchMyOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const orders = await api.getOrders();
      setMyOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchInspirations = async () => {
    setIsLoadingInspirations(true);
    try {
      const { data, error } = await (supabase as any)
        .from('design_inspirations')
        .select('id, title, image_url, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInspirations((data || []) as DesignInspiration[]);
    } catch (error) {
      console.error('Error loading design inspirations:', error);
    } finally {
      setIsLoadingInspirations(false);
    }
  };

  const smartCompressImage = async (file: File): Promise<File> => {
    const MAX_SIZE = 1024 * 1024;
    if (file.size <= MAX_SIZE) return file;
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const max = 1600;
    const ratio = Math.min(max / imageBitmap.width, max / imageBitmap.height, 1);
    canvas.width = Math.round(imageBitmap.width * ratio);
    canvas.height = Math.round(imageBitmap.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.9;
    while (quality >= 0.5) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );
      if (blob && blob.size <= MAX_SIZE) {
        return new File([blob], `request_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
      quality -= 0.1;
    }
    return file;
  };

  const openCameraOrGallery = async () => {
    try {
      setIsProcessingImage(true);
      setProcessingMessage('جاري فتح الكاميرا...');
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        width: 1600,
        height: 1600,
        correctOrientation: true
      });
      if (!image.webPath) return;
      setProcessingMessage('جاري قراءة الصورة...');
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], `temp_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setProcessingMessage('جاري تحسين الصورة...');
      const optimized = await smartCompressImage(file);
      const imageUrl = URL.createObjectURL(optimized);
      setFormData((prev) => ({ ...prev, imageFile: optimized, imageUrl }));
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('cancel') || msg.includes('dismiss')) return;
      alert('حدث خطأ أثناء التقاط الصورة');
    } finally {
      setIsProcessingImage(false);
      setProcessingMessage('جاري معالجة الصورة...');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pieceName.trim() || !formData.phone.trim() || !isWeightValid) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (!formData.imageFile && !selectedInspiration) {
      alert('يرجى رفع صورة أو اختيار صورة إلهام');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalImageUrl = selectedInspiration?.image_url || '';
      if (formData.imageFile) {
        const path = `requests/${Date.now()}_${formData.imageFile.name}`;
        const { data, error } = await supabase.storage.from('products').upload(path, formData.imageFile, { upsert: false });
        if (error) throw error;
        finalImageUrl = supabase.storage.from('products').getPublicUrl(data.path).data.publicUrl;
      }
      if (!finalImageUrl) throw new Error('image missing');

      const summary = [
        `اسم القطعة: ${pieceName.trim()}`,
        `نوع القطعة: ${pieceTypeLabel[pieceType]}`,
        `العيار: ${selectedKarat}`,
        `الوزن: ${parsedWeight} جرام`,
        rawGoldEstimateUsd ? `التقدير المبدئي للذهب: ${rawGoldEstimateUsd.toFixed(2)}$` : 'التقدير المبدئي للذهب: غير متاح',
        'أجور المصنعية تُحدّد عبر واتساب',
        selectedInspiration ? `مرجع الإلهام: ${selectedInspiration.title}` : 'مرجع الإلهام: صورة العميل'
      ].join(' | ');

      const savedOrder = await api.submitOrder({
        phone: formData.phone.trim(),
        weight: parsedWeight,
        imageUrl: finalImageUrl,
        notes: [formData.notes.trim(), `[الاستوديو] ${summary}`].filter(Boolean).join('\n'),
        date: new Date().toISOString(),
        status: 'new'
      });

      setLastOrder(savedOrder);
      setLastStudioSnapshot({
        pieceName: pieceName.trim(),
        pieceType,
        karat: selectedKarat,
        rawGoldEstimateUsd: rawGoldEstimateUsd ?? null,
        selectedInspirationTitle: selectedInspiration?.title,
        selectedInspirationUrl: selectedInspiration?.image_url
      });
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert('تعذر إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('هل تريد إلغاء هذا الطلب؟')) return;
    try {
      await api.deleteOrder(orderId);
      setMyOrders((prev) => prev.filter((item) => item.id !== orderId));
    } catch (error) {
      console.error(error);
      alert('فشل إلغاء الطلب');
    }
  };

  const openWorkerPickerForOrder = () => {
    if (!lastOrder) return;
    const snapshot = lastStudioSnapshot;
    const text =
      `*طلب صياغة جديد (رقم #${lastOrder.id.slice(0, 8)})*%0A%0A` +
      `*الهاتف:* ${lastOrder.phone}%0A` +
      `*اسم القطعة:* ${snapshot?.pieceName || 'قطعة مخصصة'}%0A` +
      `*نوع القطعة:* ${snapshot ? pieceTypeLabel[snapshot.pieceType] : 'مخصص'}%0A` +
      `*العيار:* ${snapshot?.karat || selectedKarat}%0A` +
      `*الوزن:* ${lastOrder.weight} جرام%0A` +
      `*التقدير المبدئي:* ${snapshot?.rawGoldEstimateUsd ? `${snapshot.rawGoldEstimateUsd.toFixed(2)}$` : 'غير متاح'}%0A` +
      `*الملاحظات:* ${lastOrder.notes || 'لا يوجد'}`;
    setPendingWhatsAppMessage(text);
    setIsWorkerModalOpen(true);
  };

  const renderCreateView = (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#0A0A0A] p-5 rounded-3xl border border-white/10">
      <h3 className="text-2xl font-serif text-gold-100">الاستوديو الذكي</h3>
      <label className="block text-xs text-gray-400">اسم القطعة</label>
      <input className="w-full rounded-xl bg-[#121212] p-3 border border-gray-700" value={pieceName} onChange={(e) => setPieceName(e.target.value)} placeholder="اكتب اسم القطعة..." />
      <div className="flex gap-2">
        <button type="button" onClick={() => { setPieceName('خاتم'); setPieceType('ring'); }} className="px-3 py-1 rounded-full border border-gold-500/30">خاتم</button>
        <button type="button" onClick={() => { setPieceName('عقد'); setPieceType('necklace'); }} className="px-3 py-1 rounded-full border border-gold-500/30">عقد</button>
        <button type="button" onClick={() => { setPieceName('سوار'); setPieceType('bracelet'); }} className="px-3 py-1 rounded-full border border-gold-500/30">سوار</button>
      </div>

      <div className="rounded-2xl border border-white/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-300">صور الإلهام للتصميم</span>
          <button type="button" onClick={() => void fetchInspirations()} className="text-[11px] text-gold-400">تحديث</button>
        </div>
        {isLoadingInspirations ? <p className="text-xs text-gray-500">جاري تحميل صور الإلهام...</p> : (
          <div className="grid grid-cols-2 gap-2">
            {inspirations.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedInspirationId(item.id)} className={`rounded-xl overflow-hidden border ${selectedInspirationId === item.id ? 'border-gold-500' : 'border-white/10'}`}>
                <img src={item.image_url} alt={item.title} className="h-20 w-full object-cover" />
                <p className="text-[10px] p-1 truncate">{item.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="block text-xs text-gray-400">العيار لحساب التقدير</label>
      <select className="w-full rounded-xl bg-[#121212] p-3 border border-gray-700" value={selectedKarat} onChange={(e) => setSelectedKarat(Number(e.target.value) as 18 | 21 | 24)}>
        <option value={18}>18K</option><option value={21}>21K</option><option value={24}>24K</option>
      </select>
      <p className="text-sm text-gold-300">التقدير المبدئي للذهب (دولار): {rawGoldEstimateUsd ? rawGoldEstimateUsd.toFixed(2) : '--'}</p>
      <p className="text-[11px] text-orange-300">أجور المصنعية تُحدّد عبر واتساب</p>

      <button type="button" onClick={openCameraOrGallery} className="w-full rounded-2xl border border-dashed border-gray-700 p-4">
        {isProcessingImage ? <span>{processingMessage}</span> : formData.imageUrl ? <img src={formData.imageUrl} alt="preview" className="w-full h-40 object-contain" /> : <span className="flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> رفع صورة القطعة</span>}
      </button>

      <label className="text-xs text-gray-400 flex items-center gap-2"><Smartphone className="w-4 h-4 text-gold-500" />رقم الهاتف</label>
      <input className="w-full rounded-xl bg-[#121212] p-3 border border-gray-700" dir="ltr" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="77xxxxxxx" />
      <label className="text-xs text-gray-400 flex items-center gap-2"><Scale className="w-4 h-4 text-gold-500" />الوزن (جرام)</label>
      <input type="number" step="0.1" className="w-full rounded-xl bg-[#121212] p-3 border border-gray-700" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
      <label className="text-xs text-gray-400 flex items-center gap-2"><FileText className="w-4 h-4 text-gold-500" />ملاحظات</label>
      <textarea rows={3} className="w-full rounded-xl bg-[#121212] p-3 border border-gray-700" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

      <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl text-[11px] text-orange-200/80 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>بعد الإرسال يمكنك متابعة الحالة من تبويب "متابعة طلباتي".</span>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-gold-600 text-black font-bold flex items-center justify-center gap-2">
        <Send className="w-4 h-4" /> {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
      </button>
    </form>
  );

  const renderTrackView = (
    <div className="space-y-3">
      {isLoadingOrders ? (
        <div className="text-center py-10"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold-400" /></div>
      ) : myOrders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500">لا توجد طلبات حتى الآن</p>
        </div>
      ) : (
        myOrders.map((order) => (
          <div key={order.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
            <div className="flex gap-3">
              <img src={order.imageUrl} alt="order" className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-gold-200">طلب صياغة خاص</p>
                <p className="text-[11px] text-gray-500">#{order.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-400">الوزن: {order.weight} جرام</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-2 rounded-xl bg-white/5 text-sm" onClick={() => { setLastOrder(order); setPendingWhatsAppMessage(`*طلب صياغة جديد (#${order.id.slice(0, 8)})*`); setIsWorkerModalOpen(true); }}>
                <MessageCircle className="w-4 h-4 inline ml-1" />متابعة واتساب
              </button>
              {new Date(order.date).toDateString() === new Date().toDateString() ? (
                <button className="py-2 px-3 rounded-xl bg-red-500/10 text-red-400" onClick={() => void handleCancelOrder(order.id)}>
                  <Trash2 className="w-4 h-4 inline ml-1" />إلغاء
                </button>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-gray-800/40 text-gray-600"><XCircle className="w-4 h-4 inline ml-1" />إلغاء</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (isSuccess) {
    return (
      <div className="bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-gold-500/20 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-serif text-gold-100 mb-2">تم استلام طلبك بنجاح</h3>
        <button onClick={openWorkerPickerForOrder} className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold mb-3">
          <MessageCircle className="w-5 h-5 inline ml-2" />تأكيد عبر واتساب
        </button>
        <button onClick={() => { setIsSuccess(false); setActiveView('track'); void fetchMyOrders(); }} className="text-sm text-gray-400 hover:text-gold-300">العودة للطلبات</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex bg-[#0D0D0D] p-1.5 rounded-2xl mb-8 border border-white/[0.05]">
        <button onClick={() => setActiveView('create')} className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${activeView === 'create' ? 'bg-[#181818] text-gold-400 border border-gold-500/20' : 'text-gray-600'}`}>
          <Camera className="w-4 h-4" />طلب جديد
        </button>
        <button onClick={() => setActiveView('track')} className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${activeView === 'track' ? 'bg-[#181818] text-gold-400 border border-gold-500/20' : 'text-gray-600'}`}>
          <ClipboardList className="w-4 h-4" />متابعة طلباتي
        </button>
      </div>

      <div key={activeView}>
        {activeView === 'create' ? renderCreateView : renderTrackView}
      </div>

      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5">
            <h4 className="text-gold-300 font-bold mb-4 text-center">اختر الموظف للتواصل</h4>
            <div className="space-y-2">
              {contact.workers.map((worker) => (
                <button key={worker.id} onClick={() => { window.open(`https://wa.me/967${worker.phone}?text=${pendingWhatsAppMessage}`, '_blank'); setIsWorkerModalOpen(false); setPendingWhatsAppMessage(''); }} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold">
                  الموظف {worker.name} - {worker.phone}
                </button>
              ))}
            </div>
            <button onClick={() => { setIsWorkerModalOpen(false); setPendingWhatsAppMessage(''); }} className="w-full mt-3 py-2 rounded-xl text-gray-300 hover:text-white">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};
