import { useState, useEffect } from 'react';
import { ClientRequest, ContactInfo } from '../types/types';
import { api } from '../services/api';
import { getRequests, saveRequest, deleteRequest } from '../services/storage';
import { Send, Camera, Smartphone, Scale, FileText, CheckCircle2, MessageCircle, AlertCircle, ClipboardList, Clock, RefreshCw, Trash2, XCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../supabase-client';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface RequestSectionProps {
  contact: ContactInfo;
}

export const RequestSection: React.FC<RequestSectionProps> = ({ contact }) => {
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<ClientRequest | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [pendingWhatsAppMessage, setPendingWhatsAppMessage] = useState('');
  const [processingMessage, setProcessingMessage] = useState('جاري معالجة الصورة...');

  const [myOrders, setMyOrders] = useState<ClientRequest[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    weight: '',
    notes: '',
    imageFile: null as File | null,
    imageUrl: ''
  });

  useEffect(() => {
    if (activeView === 'track') {
      fetchMyOrders();
    }
  }, [activeView]);

  useEffect(() => {
    return () => {
      if (formData.imageUrl && formData.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imageUrl);
      }
    };
  }, [formData.imageUrl]);

  const fetchMyOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const sessionRequests = await getRequests();
      setMyOrders(sessionRequests);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // ✅ فتح الكاميرا أو المعرض - نسخة نهائية مستقرة
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

      if (!image.webPath) {
        return;
      }

      setProcessingMessage('جاري قراءة الصورة...');

      // ✅ قراءة الصورة كـ Blob
      const response = await fetch(image.webPath);
      if (!response.ok) {
        throw new Error('فشل في قراءة الصورة');
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('صورة فارغة');
      }

      // ✅ إنشاء ملف مؤقت
      const tempFile = new File([blob], `temp_${Date.now()}.jpg`, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setProcessingMessage('جاري تحسين الصورة...');

      // ✅ ضغط ذكي تلقائي
      const optimizedFile = await smartCompressImage(tempFile);
      
      // ✅ إنشاء URL للمعاينة
      const imageUrl = URL.createObjectURL(optimizedFile);
      setFormData(prev => ({ ...prev, imageFile: optimizedFile, imageUrl }));

    } catch (error: any) {
      console.error('Camera error:', error);
      
      const errorMessage = error.message || '';
      
      // تجاهل إلغاء المستخدم
      if (errorMessage.includes('cancel') || 
          errorMessage.includes('dismiss') ||
          errorMessage.includes('User cancelled')) {
        return;
      }
      
      // خطأ في الصلاحيات
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        alert('⚠️ يجب السماح بالوصول للكاميرا من إعدادات التطبيق');
        return;
      }
      
      alert('❌ حدث خطأ: ' + errorMessage);
      
    } finally {
      setIsProcessingImage(false);
      setProcessingMessage('جاري معالجة الصورة...');
    }
  };

  // ✅ ضغط ذكي تلقائي - يضغط حتى يصل لأقل من 1MB
  const smartCompressImage = async (file: File): Promise<File> => {
    const MAX_SIZE = 1024 * 1024; // 1MB
    const MAX_DIMENSION = 1600; // أقصى بعد
    
    // إذا كان الحجم مناسباً والأبعاد مناسبة، ارجع كما هو
    if (file.size <= MAX_SIZE && file.type === 'image/jpeg') {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          let { width, height } = img;
          
          // تقليل الأبعاد إذا لزم الأمر
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(file);
            return;
          }

          canvas.width = width;
          canvas.height = height;
          
          // رسم بجودة عالية
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // ✅ ضغط تدريجي حتى نصل للحجم المطلوب
          let quality = 0.9;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }
                
                // إذا كان الحجم لا يزال كبيراً ويمكن تقليل الجودة أكثر
                if (blob.size > MAX_SIZE && quality > 0.5) {
                  quality -= 0.1;
                  tryCompress();
                  return;
                }
                
                const finalFile = new File(
                  [blob], 
                  `request_${Date.now()}.jpg`, 
                  { type: 'image/jpeg', lastModified: Date.now() }
                );
                
                console.log(`✅ صورة محسّنة: ${(file.size/1024).toFixed(1)}KB → ${(finalFile.size/1024).toFixed(1)}KB`);
                resolve(finalFile);
              },
              'image/jpeg',
              quality
            );
          };
          
          tryCompress();
        };
        
        img.onerror = () => resolve(file);
      };
      
      reader.onerror = () => resolve(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.weight || !formData.imageFile) {
      alert("⚠️ يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    // ✅ التحقق النهائي من الحجم (أقصى 2MB احتياطي)
    if (formData.imageFile.size > 2 * 1024 * 1024) {
      alert('❌ الصورة كبيرة جداً! جرب صورة أصغر.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = '';

      const fileName = `requests/${Date.now()}_${formData.imageFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, formData.imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw new Error('فشل رفع الصورة: ' + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(uploadData.path);

      finalImageUrl = publicUrl;

      const newOrderPayload: ClientRequest = {
        phone: formData.phone,
        weight: parseFloat(formData.weight),
        imageUrl: finalImageUrl,
        notes: formData.notes,
        date: new Date().toISOString(),
        status: 'new',
        id: ''
      };

      const savedOrder = await api.submitOrder(newOrderPayload);
      await saveRequest(savedOrder);
      setLastOrder(savedOrder);

      setIsSuccess(true);
      setFormData({ phone: '', weight: '', notes: '', imageFile: null, imageUrl: '' });

    } catch (error: any) {
      console.error(error);
      alert("❌ حدث خطأ: " + (error.message || "يرجى المحاولة مرة أخرى"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm("هل أنت متأكد من إلغاء هذا الطلب؟")) {
      try {
        await api.deleteOrder(orderId);
        await deleteRequest(orderId);
        setMyOrders(prev => prev.filter(o => o.id !== orderId));
        alert("✅ تم إلغاء الطلب بنجاح.");
      } catch (e) {
        alert("❌ فشل في إلغاء الطلب.");
      }
    }
  };

  const isOrderCancelable = (dateString: string) => {
     const orderDate = new Date(dateString);
     const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  };

  const openWorkerPickerForOrder = () => {
    if (!lastOrder) return;

    const message = `*طلب صياغة جديد (رقم #${lastOrder.id.slice(0, 8)})*%0A%0A` +
      `📱 *الهاتف:* ${lastOrder.phone}%0A` +
      `⚖️ *الوزن المطلوب:* ${lastOrder.weight} جرام%0A` +
      `📝 *ملاحظات:* ${lastOrder.notes || 'لا يوجد'}%0A%0A` +
      `*ملاحظة:* تم إرفاق صورة التصميم في التطبيق.`;

     setPendingWhatsAppMessage(message);
     setIsWorkerModalOpen(true);
   };

  const handleWorkerSelect = (workerPhone: string) => {
    const url = `https://wa.me/967${workerPhone}?text=${pendingWhatsAppMessage}`;
    window.open(url, '_blank');
    setIsWorkerModalOpen(false);
    setPendingWhatsAppMessage('');
  };
  const resetForm = () => {
    setIsSuccess(false);
    setLastOrder(null);
    setFormData({ phone: '', weight: '', notes: '', imageFile: null, imageUrl: '' });
    setActiveView('track');
  };

  if (isSuccess) {
    return (
      <div className="bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-gold-500/20 text-center animate-scale-up shadow-luxury">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-serif text-gold-100 mb-2">تم استلام طلبك بنجاح</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed font-sans">
          تم حفظ طلبك في سجلاتنا. يمكنك متابعة حالته من قائمة "متابعة طلباتي".
        </p>

        <button
          onClick={openWorkerPickerForOrder}
          className="w-full py-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 transition-all duration-300 mb-4"
        >
          <MessageCircle className="w-6 h-6" />
          <span>تأكيد عبر واتساب</span>
        </button>

        <button
          onClick={resetForm}
          className="text-gray-500 text-sm hover:text-gold-400 underline decoration-gold-500/30 underline-offset-4 transition-colors"
        >
          العودة للطلبات
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex bg-[#0D0D0D] p-1.5 rounded-2xl mb-8 border border-white/[0.05]">
        <button
          onClick={() => setActiveView('create')}
          className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-500 ${activeView === 'create' ? 'bg-[#181818] text-gold-400 border border-gold-500/20 shadow-md' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <Camera className="w-4 h-4" />
          طلب جديد
        </button>
        <button
          onClick={() => setActiveView('track')}
          className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-500 ${activeView === 'track' ? 'bg-[#181818] text-gold-400 border border-gold-500/20 shadow-md' : 'text-gray-600 hover:text-gray-400'}`}
        >
          <ClipboardList className="w-4 h-4" />
          متابعة طلباتي
        </button>
      </div>

      {activeView === 'create' ? (
        <div className="animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-serif text-gold-100 mb-2">تصميم خاص</h2>
            <p className="text-[10px] text-gray-500 tracking-wider">أرفق صورة القطعة وسنقوم بصياغتها لك</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#0A0A0A] p-6 md:p-8 rounded-[2.5rem] border border-white/[0.05] shadow-luxury relative overflow-hidden">
            <div className="mb-8">
              <label className="text-xs font-bold text-gray-400 mb-3 tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold-500" />
                صورة القطعة (إجباري)
              </label>
              
              <button
                type="button"
                onClick={openCameraOrGallery}
                disabled={isProcessingImage}
                className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group overflow-hidden relative ${formData.imageUrl ? 'border-gold-500/50 bg-black' : 'border-gray-800 bg-[#121212] hover:bg-[#151515] hover:border-gray-600'}`}
              >
                {isProcessingImage ? (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <RefreshCw className="w-6 h-6 text-gold-400 animate-spin" />
                    </div>
                    <p className="text-gold-400 font-bold text-sm">{processingMessage}</p>
                  </div>
                ) : formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <span className="text-white text-sm font-bold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> تغيير الصورة
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                      <Camera className="w-6 h-6 text-gray-600 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <p className="text-gray-500 font-bold text-sm">اضغط لالتقاط أو اختيار صورة</p>
                    <p className="text-gray-600 text-xs mt-2">كاميرا أو معرض الصور</p>
                    <p className="text-gold-600/50 text-[10px] mt-3">✨ يقبل أي صيغة - ضغط تلقائي</p>
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gold-500" />
                  رقم الهاتف (إجباري)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="77xxxxxxx"
                  className="w-full bg-[#121212] border border-gray-800 rounded-2xl p-5 text-gold-100 placeholder-gray-700 focus:border-gold-500/50 focus:bg-[#050505] outline-none transition-all duration-300 font-mono text-lg text-left shadow-inner"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gold-500" />
                  الوزن التقريبي (جرام)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="مثال: 25.5"
                  className="w-full bg-[#121212] border border-gray-800 rounded-2xl p-5 text-gold-100 placeholder-gray-700 focus:border-gold-500/50 focus:bg-[#050505] outline-none transition-all duration-300 font-mono text-lg shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold-500" />
                  ملاحظات (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="تفاصيل إضافية..."
                  className="w-full bg-[#121212] border border-gray-800 rounded-2xl p-4 text-gray-300 placeholder-gray-700 focus:border-gold-500/50 focus:bg-[#050505] outline-none resize-none transition-all duration-300 shadow-inner"
                ></textarea>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-200/70 leading-relaxed font-sans">
                  بعد الإرسال، يمكنك متابعة حالة طلبك من تبويب "متابعة طلباتي" خلال هذه الجلسة فقط.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.imageFile}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-extrabold text-lg py-5 rounded-2xl shadow-lg shadow-gold-600/20 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <span>جاري الإرسال...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>إرسال الطلب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="animate-slide-up space-y-4">
          <h3 className="text-xl font-serif text-gold-100 mb-6 px-2 border-r-4 border-gold-500 pr-4">سجل طلباتي (الجلسة الحالية)</h3>

          {isLoadingOrders ? (
            <div className="text-center py-20">
              <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-xs">جاري تحديث الحالة...</p>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="text-center py-24 bg-[#0A0A0A] rounded-[2.5rem] border border-dashed border-gray-800">
              <ClipboardList className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-serif">لم تقم بأي طلبات في هذه الجلسة</p>
              <button onClick={() => setActiveView('create')} className="mt-4 text-gold-500 text-sm hover:underline">ابدأ طلب جديد</button>
            </div>
          ) : (
            myOrders.map((order) => {
              const cancelable = isOrderCancelable(order.date);
              return (
                <div key={order.id} className="bg-[#0A0A0A] p-5 rounded-[2rem] border border-white/[0.05] hover:border-gold-500/20 transition-all duration-300 group shadow-lg">
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden border border-gray-800 shrink-0">
                      <img src={order.imageUrl} className="w-full h-full object-cover" alt="Request" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-gray-200 font-bold text-sm mb-1">طلب صياغة خاص</h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${order.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                          {order.status === 'completed' ? 'جاهز للاستلام' : 'قيد المراجعة/التنفيذ'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono mb-2">Ref: #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.date}</span>
                        <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {order.weight}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-white/[0.03]">
                    <button
                      onClick={() => {
                        setLastOrder(order);
                        const message = `*طلب صياغة جديد (رقم #${order.id.slice(0, 8)})*%0A%0A` +
                          `📱 *الهاتف:* ${order.phone}%0A` +
                          `⚖️ *الوزن المطلوب:* ${order.weight} جرام%0A` +
                          `📝 *ملاحظات:* ${order.notes || 'لا يوجد'}%0A%0A` +
                          `*ملاحظة:* تم إرفاق صورة التصميم في التطبيق.`;
                        setPendingWhatsAppMessage(message);
                        setIsWorkerModalOpen(true);
                      }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      متابعة بالواتساب
                    </button>

                    {cancelable ? (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 transition-colors"
                        title="إلغاء الطلب متاح في نفس اليوم فقط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        إلغاء
                      </button>
                    ) : (
                      <div className="py-3 px-4 bg-gray-800/50 rounded-xl text-gray-600 text-xs flex items-center gap-1 cursor-not-allowed opacity-50" title="لا يمكن الإلغاء بعد مرور 24 ساعة">
                        <XCircle className="w-3.5 h-3.5" />
                        إلغاء
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
   
  
   {isWorkerModalOpen && (
     <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5">
        <h4 className="text-gold-300 font-bold mb-4 text-center">اختر العامل للتواصل</h4>

        <div className="space-y-2">
          {contact.workers.map((workerPhone, idx) => (
            <button
              key={idx}
              onClick={() => handleWorkerSelect(workerPhone)}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition"
            >
              العامل {idx + 1} - {workerPhone}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setIsWorkerModalOpen(false);
            setPendingWhatsAppMessage('');
          }}
          className="w-full mt-3 py-2 rounded-xl text-gray-300 hover:text-white"
        >
          إلغاء
        </button>
      </div>
    </div>
   )}
 </div>
  );
};