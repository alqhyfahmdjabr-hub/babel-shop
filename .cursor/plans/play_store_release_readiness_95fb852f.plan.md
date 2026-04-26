---
name: Play Store Release Readiness
overview: "خطة تجهيز التطبيق للنشر على Google Play حسب وضعه الحالي: Supabase كقاعدة بيانات + Storage للصور + Edge Function لتحديث أسعار الذهب، مع فصل واضح بين بيانات الجهاز وبيانات السيرفر، ومتطلبات الإعداد والبناء والأداء بدون تعديل منطق التسجيل الحالي."
todos:
  - id: db-supabase-readiness
    content: "تجهيز Supabase للنشر: migrations + RLS + Storage bucket + Edge function secrets/cron"
    status: pending
  - id: android-release-signing
    content: إعداد توقيع Android Release وزيادة versionCode/versionName وإخراج AAB
    status: pending
  - id: data-split-doc
    content: توثيق فصل بيانات الجهاز vs قاعدة البيانات + سياسة retention بسيطة
    status: pending
  - id: perf-prepublish
    content: "تحسينات أداء آمنة قبل النشر: كاش TTL للقراءات، ضغط الصور، فحص أحجام الباندل"
    status: pending
  - id: play-store-checklist
    content: قائمة اختبار نهائي + خطوات رفع AAB على Google Play
    status: pending
isProject: false
---

# خطة تجهيز النشر على Google Play (حسب وضع التطبيق الحالي)

## 1) قاعدة البيانات (Supabase) — ما يجب التأكد منه قبل النشر

### الجداول التي يعتمد عليها التطبيق فعلياً
- **`public.products`**: كتالوج المنتجات (قراءة عامة، كتابة للـ admin). مستخدم في [`src/services/api.ts`](src/services/api.ts) `getProducts/saveProduct/deleteProduct`.
- **`public.prices`**: أسعار الجرام لكل عيار (18/21/24). قراءة **مقيدة** بالمستخدمين المسجلين الذين لديهم بريد (حسب migration). مستخدم في `api.getPrices()`.
- **`public.price_history`**: تاريخ سعر الأونصة (USD) للعرض وحسابات التحديث. قراءة **مقيدة** بمستخدمين لديهم بريد. مستخدم في `api.getLatestOuncePriceUsd()`.
- **`public.app_settings`**: إعدادات التحويل والهوامش (exchange_rate + buy/sell margin). قراءة **مقيدة** بمستخدمين لديهم بريد. مستخدم في `api.getPricingSettings/updatePricingSettings`.
- **`public.orders`**: طلبات العملاء. إدخال للمستخدم (مع `user_id`) وإدارة للـ admin. مستخدم في `api.submitOrder/getOrders/cancelOwnOrder/updateOrderStatus/adminDeleteOrder`.
- **`public.profiles`**: دور المستخدم (`admin/user`) + الاسم. مستخدم لفحص الصلاحيات وعرض اسم صاحب الطلب.
- **`public.design_inspirations`**: صور إلهام “الاستوديو” (قراءة للمستخدمين المسجلين، كتابة admin فقط). مستخدم مباشرة في [`src/components/RequestSection.tsx`](src/components/RequestSection.tsx).

### الدوال/الـ RPC المطلوبة
- **`public.set_user_role(...)`**: مستخدمة في `api.adminSetUserRole()`.
- **`public.cancel_own_order(uuid)`**: مستخدمة في `api.cancelOwnOrder()`.
- **`public.apply_gold_price_snapshot(...)`** + **`public.recalculate_gold_prices()`**: تُستدعى من Edge Function لتحديث الأسعار.

### سياسات الأمان (RLS) المطلوبة (مختصرة)
حسب migrations الموجودة:
- **Products**: `SELECT` متاح للكل (anon+authenticated)، و`INSERT/UPDATE/DELETE` للـ admin فقط.
- **Orders**: المستخدم يرى/ينشئ طلبه فقط، والـ admin يرى/يدير الكل.
- **Prices/AppSettings/PriceHistory**: القراءة للمستخدمين المسجلين الذين لديهم بريد (وظيفة `has_authenticated_email()`).
- **Design inspirations**: للمسجلين فقط؛ إظهار العناصر النشطة أو admin.

### متطلبات تنفيذ/مزامنة قاعدة البيانات
- **تشغيل migrations** في مشروع Supabase (أو التأكد أنها مطبقة).
- **تشغيل سكربت فحص التوافق**: [`scripts/db_check.js`](scripts/db_check.js) باستخدام `DATABASE_URL` أو `SUPABASE_DB_URL` للتأكد من وجود الجداول، القيود، الـ RLS policies، الدوال.

---

## 2) إعدادات التطبيق (Build/Release) — متطلبات Google Play

### متغيرات البيئة المطلوبة للبناء
- **Vite/Supabase (داخل التطبيق)**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  موجودة في [`src/supabase-client.ts`](src/supabase-client.ts) وسيكسر البناء لو ناقصة.

### توقيع نسخة Release (مطلوب للمتجر)
موجود شرط صارم في [`android/app/build.gradle`](android/app/build.gradle):
- إما ملف `android/keystore.properties`
- أو متغيرات النظام:
  - `ANDROID_KEYSTORE_PATH`
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS`
  - `ANDROID_KEY_PASSWORD`

### إعدادات Android الحالية التي يجب مراجعتها للمتجر
- **versionCode/versionName** في [`android/app/build.gradle`](android/app/build.gradle) (حالياً `1` و`1.0`) — تحتاج زيادة مع كل رفع للمتجر.
- **الصلاحيات** في [`android/app/src/main/AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml):
  - وجود `CAMERA` وقراءة الصور مناسب لميزة رفع الصور.
  - التخزين القديم محدد بـ `maxSdkVersion` وهو جيد.
- **تعطيل cleartext**: `android:usesCleartextTraffic="false"` جيد للنشر.

---

## 3) ميزات التطبيق — ما يلزم “اكتماله” للنشر بدون تداخل

### الوصول حسب حالة تسجيل الدخول (كما هو حالياً)
- **بدون تسجيل**: تصفح المنتجات (products) يعمل.
- **مع تسجيل وبريد**: أسعار الذهب/الأونصة + إعدادات التسعير + الطلبات + الاستوديو (design inspirations).

### نقاط يجب التأكد منها قبل النشر
- **تجربة “أول تشغيل”**: التطبيق يعرض منتجات حتى بدون تسجيل، ويعرض CTA واضح لتسجيل الدخول عند محاولة أسعار الذهب/الطلبات.
- **تجربة “إنشاء طلب”**: رفع صورة → الحصول على URL من Supabase Storage → حفظ الطلب في `orders`.
- **لوحة Admin**: تتأكد أن مستخدم admin فعلاً (من `profiles.role`) وإلا تُرفض عمليات التعديل.

---

## 4) التخزين: ما يُحفظ على الجهاز vs ما يُحفظ في قاعدة البيانات

### يُحفظ على الجهاز (Capacitor Preferences)
في [`src/services/storage.ts`](src/services/storage.ts):
- **`favorites`**: معرفات المنتجات المفضلة.
- **`app_preferences`**: إعدادات خلفية التطبيق (pattern + opacity).
- **`app_cache`**: كاش عام بميزة TTL (موجود كأدوات، قد لا يكون مستخدم لكل البيانات حالياً).

وأيضاً جلسة Supabase (`auth storage`) تُحفظ محلياً عبر Preferences في [`src/supabase-client.ts`](src/supabase-client.ts).

### يُحفظ في قاعدة البيانات / Supabase
- `products`, `prices`, `price_history`, `app_settings`, `orders`, `profiles`, `design_inspirations`.

### يُحفظ في Supabase Storage
- صور الطلبات/الإلهام في bucket **`products`** (مستخدم في `RequestSection` و`imageService`).

---

## 5) تسريع التطبيق (Performance) — المتبقي قبل النشر

### الموجود حالياً (جيد)
- Lazy loading لبعض الشاشات/المكونات في [`src/App.tsx`](src/App.tsx) (مثل `GoldTicker` و`RequestSection`).
- تقسيم chunks في [`vite.config.ts`](vite.config.ts) (`vendor-*`).
- Minify + drop console في production.

### تحسينات “آمنة قبل النشر” (بدون تغيير سلوك)
- **تفعيل الكاش فعلياً لطلبات القراءة** (products/prices/settings) باستخدام `setCache/getCachedItem` في [`src/services/storage.ts`](src/services/storage.ts) مع TTL مناسب لتقليل زمن فتح التطبيق وطلبات الشبكة.
- **تقليل حجم الصور** قبل الرفع (يوجد `browser-image-compression` ضمن deps) وتأكيد أن مسار الرفع يستخدمه دائماً لتقليل زمن الرفع واستهلاك البيانات.
- **تحقق من أحجام الـ bundle** عبر `npm run analyze` عند الحاجة.

---

## 6) خطوات “تجهيز للنشر” مرتبة (Checklist)

- **Supabase**
  - تطبيق migrations والتأكد من RLS والسياسات.
  - إعداد Storage bucket `products` (القواعد/الـ public URLs حسب التصميم الحالي).
  - إعداد Edge Function `update-gold-prices` وتشغيل الجدولة `pg_cron` (إن رغبت بالتحديث الآلي) مع الأسرار:
    - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOLD_PRICE_Z_KEY`, `CRON_SECRET`.

- **Build config**
  - ضبط `.env.production`/CI secrets لـ `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY`.
  - إعداد Keystore للتوقيع ورفع `versionCode`.

- **اختبار قبل الرفع**
  - فتح التطبيق كضيف (Products فقط) + تسجيل دخول + التأكد من أسعار الذهب/الطلبات.
  - اختبار رفع صورة طلب على شبكة ضعيفة.

- **Google Play**
  - بناء `bundleRelease` (AAB) ورفعها على Play Console.

