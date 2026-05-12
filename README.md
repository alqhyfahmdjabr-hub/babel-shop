# مجوهرات بابل

توثيق تقني وتشغيلي للمشروع كما هو موجود فعلياً في الكود بتاريخ `2026-05-11`.

الهدف من هذا الملف:

- تسليم صورة واضحة لأي مطور جديد عن التطبيق الحالي.
- توضيح بنية المشروع وملفات كل ميزة.
- توثيق قاعدة البيانات وآلية أسعار الذهب والصلاحيات.
- توثيق خطة التحويل من تطبيق ويب إلى تطبيق Flutter.
- توضيح أين وصلنا في الهجرة إلى Flutter وما الذي بقي.

## ملخص سريع

`مجوهرات بابل` هو تطبيق مجوهرات مبني حالياً على:

- `React 18 + Vite + TypeScript`
- `Supabase` للمصادقة والبيانات و`Storage`
- `Capacitor` لتغليف نسخة Android الحالية

ويحتوي المستودع أيضاً على:

- التطبيق الرئيسي داخل `src/`
- مشروع Android الحالي عبر Capacitor داخل `android/`
- إعدادات وقواعد Supabase داخل `supabase/`
- موقع تسويقي مستقل داخل `marketing-site/`
- بداية مشروع Flutter للهجرة التدريجية داخل `flutter_app/`
- اختبارات Android Smoke عبر Appium داخل `e2e/appium/`

## حالة المشروع الحالية

### التطبيق الحالي

- التطبيق المنتج حالياً هو تطبيق الويب/Capacitor.
- الواجهة الحالية تعمل كـ `Single Page App` بدون Router حقيقي، والتنقل الداخلي يتم عبر `activeTab`.
- أسعار الذهب لا تظهر للزائر، بل فقط للمستخدم المصادق ببريد إلكتروني.
- الطلبات مرتبطة بالمستخدم الحالي في Supabase.
- لوحة الإدارة متاحة فقط للمستخدم الذي دوره `admin`.

### حالة تحويل Flutter

- تم إنشاء Scaffold أولي داخل `flutter_app/`.
- تم تجهيز:
  - `GoRouter`
  - تبويبات أساسية
  - `Riverpod`
  - `supabase_flutter`
  - Theme أولي
  - شاشات Placeholder للهجرة
- نجح:
  - `flutter pub get`
  - `flutter analyze`
  - `flutter test`
- لم ينجح حتى الآن:
  - `flutter build apk --debug`

### سبب توقف Flutter حالياً

سبب التوقف الحالي ليس في كود Flutter نفسه، بل في بيئة Android المحلية:

- Flutter والاعتمادات التابعة له تستخدم `flutter.ndkVersion = 28.2.13676358`.
- نسخة NDK هذه على هذا الجهاز كانت ناقصة/معطوبة.
- تم تعديل `flutter_app/android/gradle/wrapper/gradle-wrapper.properties` لاستخدام `gradle-8.14.3-all`.
- تم تعديل `flutter_app/android/app/build.gradle.kts` مؤقتاً لتجربة `NDK 27.0.12077973`.
- لكن إحدى التبعيات (`jni`) لا تزال تعتمد على `flutter.ndkVersion` الافتراضية، لذلك فشل بناء APK.

الخلاصة:

- **المرحلة الأولى من الهجرة اكتملت من ناحية الكود والبنية.**
- **لكنها لم تكتمل من ناحية إخراج APK قابل للتثبيت حتى يتم إصلاح NDK المحلي.**

## بنية المستودع

```text
babel-jewelry/
├─ src/                         التطبيق الرئيسي الحالي
│  ├─ App.tsx                   نقطة التنسيق الرئيسية
│  ├─ LoginScreen.tsx           تسجيل الدخول / التسجيل / OTP
│  ├─ app/
│  │  ├─ AppChrome.tsx          الشريط السفلي + تحديث + العودة للأعلى
│  │  └─ AppModals.tsx          جميع النوافذ المنبثقة
│  ├─ components/
│  │  ├─ GoldTicker.tsx
│  │  ├─ ProductCard.tsx
│  │  ├─ ProductModal.tsx
│  │  ├─ RequestSection.tsx
│  │  ├─ SettingsModal.tsx
│  │  ├─ AdminPanel.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Toast.tsx
│  │  └─ ErrorBoundary.tsx
│  ├─ services/
│  │  ├─ api.ts
│  │  ├─ imageService.ts
│  │  └─ storage.ts
│  ├─ constants/
│  ├─ hooks/
│  ├─ utils/
│  └─ types/
├─ flutter_app/                 Scaffold Flutter للهجرة التدريجية
├─ android/                     مشروع Android الحالي عبر Capacitor
├─ supabase/                    الجداول، RLS، RPC، Edge Functions
├─ marketing-site/              موقع تسويقي مستقل
├─ e2e/appium/                  Smoke test للأندرويد
├─ scripts/                     أدوات فحص مساعدة
├─ capacitor.config.ts
├─ package.json
└─ README.md
```

## التقنية المستخدمة

### التطبيق الحالي

- `React 18`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Supabase`
- `Capacitor`
- `Lucide React`
- `browser-image-compression`
- `zxcvbn`

### Flutter Scaffold

- `Flutter`
- `supabase_flutter`
- `flutter_riverpod`
- `go_router`
- `shared_preferences`
- `image_picker`
- `cached_network_image`
- `url_launcher`
- `intl`

### الموقع التسويقي

- `Astro`
- `Tailwind CSS`

### الاختبارات

- `Vitest`
- `Appium + WebdriverIO`
- `flutter_test`

## ما الذي يفعله التطبيق فعلياً

### للزائر

- تصفح الصفحة الرئيسية.
- تصفح الكتالوج.
- فتح تفاصيل أي منتج.
- البحث داخل الكتالوج.
- الإضافة والإزالة من المفضلة محلياً.
- مشاهدة بيانات التواصل في الفوتر.
- لا يمكنه رؤية أسعار الذهب.
- لا يمكنه فتح الطلبات بدون تسجيل دخول.

### للمستخدم المسجل

- رؤية أسعار الذهب المباشرة.
- إنشاء طلب جديد من تبويب الطلبات.
- متابعة طلباته السابقة.
- إلغاء الطلب في نفس اليوم إذا كانت حالته `new` أو `pending`.
- بدء تواصل واتساب بخصوص منتج أو طلب.

### للمشرف `admin`

- دخول لوحة الإدارة من الإعدادات.
- تعديل إعدادات التسعير المركزية.
- عرض الأسعار الحالية القادمة من قاعدة البيانات.
- إدارة المنتجات.
- إدارة الطلبات وتعديل حالتها.
- حذف الطلبات.
- إدارة صور الإلهام الخاصة بالاستوديو.

## الأدوار والصلاحيات

الأدوار المعتمدة حالياً:

- `user`
- `admin`

يتم تحديد الدور من جدول `profiles.role`.

### مصفوفة الوصول

| الميزة | زائر | مستخدم | مشرف |
|---|---:|---:|---:|
| الصفحة الرئيسية | نعم | نعم | نعم |
| الكتالوج | نعم | نعم | نعم |
| المفضلة | نعم | نعم | نعم |
| أسعار الذهب | لا | نعم | نعم |
| إنشاء طلب | لا | نعم | نعم |
| متابعة الطلبات | لا | نعم | نعم |
| إلغاء الطلب الشخصي | لا | نعم | نعم |
| لوحة الإدارة | لا | لا | نعم |
| إدارة المنتجات | لا | لا | نعم |
| إدارة الأسعار | لا | لا | نعم |
| إدارة صور الإلهام | لا | لا | نعم |
| حذف الطلبات | لا | لا | نعم |

## الشاشات والتبويبات والمكونات

### 1) التطبيق الرئيسي `src/App.tsx`

هذا هو العقل الرئيسي للتطبيق الحالي، ومسؤول عن:

- تحميل `session` من Supabase.
- تحديد `userRole`.
- جلب المنتجات.
- جلب أسعار الذهب إذا كان المستخدم مخولاً.
- إدارة `favorites`.
- إدارة البحث.
- إدارة `pagination` و`infinite scroll`.
- فتح وإغلاق النوافذ المنبثقة.
- إدارة `toasts`.
- إدارة `ErrorBoundary`.
- إدارة الخلفية والنقوش والتفضيلات.

### 2) الشريط السفلي `src/app/AppChrome.tsx`

التبويبات الأساسية:

- `home`
- `catalog`
- `requests`
- `favorites`

ويحتوي أيضاً على:

- زر تحديث البيانات.
- شريط حالة للتبويب الحالي.
- زر العودة للأعلى عند التمرير.

### 3) الصفحة الرئيسية

تعرض:

- زر الإعدادات.
- شعار بابل.
- عبارة/آية الهوية البصرية.
- شارات الثقة:
  - `ضمان العيار`
  - `أصالة و جودة`
  - `دقة في الوزن`
- قسم أسعار الذهب `GoldTicker` للمستخدم المصادق.
- بطاقة تطلب تسجيل الدخول لعرض الأسعار للزائر.
- بطاقات مزايا:
  - `موديلات حصرية ومتجددة`
  - `سعر مضمون ومنافس`
  - `أمانة في البيع والشراء`
- عنوان `مختارات بابل`
- زر `تصفح المزيد`
- أول `6` منتجات كعناصر Featured.

### 4) تبويب المعرض `catalog`

الوظائف:

- عرض جميع المنتجات المحملة.
- البحث النصي في `name + description`.
- زر مسح البحث.
- التحميل التلقائي للمزيد عند النزول للأسفل.
- فتح المنتج عند الضغط على البطاقة.
- إضافة/إزالة المفضلة عبر زر القلب.

### 5) تبويب المفضلة `favorites`

الوظائف:

- يعرض فقط المنتجات المحفوظة محلياً.
- يستخدم نفس البحث الخاص بالمعرض.
- يعتمد على `Capacitor Preferences`.

### 6) نافذة المنتج `src/components/ProductModal.tsx`

تعرض:

- صورة كبيرة للمنتج.
- اسم المنتج.
- العيار.
- الوزن.
- الفئة.
- الوصف.
- زر `استفسار عن التفاصيل`.

سلوك زر الاستفسار:

- إذا كان المستخدم غير مسجل: يطلب تسجيل الدخول.
- إذا كان مسجلاً: يفتح نافذة اختيار رقم العامل.
- عند اختيار العامل: يتم فتح واتساب برسالة جاهزة تحتوي اسم القطعة والعيار والوزن.

### 7) شاشة الدخول `src/LoginScreen.tsx`

الأوضاع الحالية:

- `تسجيل الدخول`
- `إنشاء حساب`
- `إدخال OTP`

الميزات:

- `email/password` عبر Supabase Auth.
- إنشاء حساب جديد مع `full_name`.
- قياس قوة كلمة المرور عبر `zxcvbn`.
- منع كلمات المرور الضعيفة عند التسجيل.
- إظهار/إخفاء كلمة المرور.
- OTP بعد التسجيل إذا لم تُنشأ `session` مباشرة.
- إعادة إرسال OTP.
- إعادة إرسال OTP تلقائياً إذا كان الحساب غير مفعل.
- قفل مؤقت بعد `5` محاولات فاشلة لمدة `120` ثانية.
- لا توجد حالياً ميزة `Forgot Password`.
- يوجد صندوق مساعدة يحتوي:
  - زر `واتساب`
  - زر `اتصال`

### 8) الإعدادات `src/components/SettingsModal.tsx`

تحتوي على:

- اختيار نمط الخلفية.
- التحكم بدرجة وضوح النقش.
- Presets:
  - `هادئ`
  - `متوازن`
  - `أوضح`
- زر `بوابة الإدارة`.
- زر `تسجيل الخروج`.

### 9) الاستوديو والطلبات `src/components/RequestSection.tsx`

يوجد وضعان:

- `طلب جديد`
- `متابعة طلباتي`

في `طلب جديد`:

- اسم القطعة.
- نوع القطعة:
  - `ring`
  - `necklace`
  - `bracelet`
  - `custom`
- اختيار العيار `18/21/24`.
- عرض تقدير أولي للذهب اعتماداً على سعر الجرام من جدول `prices`.
- اختيار صورة إلهام من `design_inspirations`.
- أو رفع صورة من الكاميرا/المعرض عبر Capacitor Camera.
- ضغط الصورة قبل الرفع.
- إدخال الهاتف.
- إدخال الوزن.
- إدخال الملاحظات.
- إرسال الطلب.

بعد الإرسال:

- يتم حفظ الطلب في `orders`.
- يتم فتح شاشة نجاح.
- يظهر زر تأكيد عبر واتساب.

في `متابعة طلباتي`:

- عرض الطلبات الخاصة بالمستخدم.
- فلترة بالحالة:
  - `all`
  - `new`
  - `pending`
  - `processing`
  - `completed`
  - `delivered`
  - `cancelled`
- عرض Progress UI للحالة.
- زر متابعة عبر واتساب.
- زر إلغاء إذا توفرت شروط الإلغاء.

### 10) لوحة الإدارة `src/components/AdminPanel.tsx`

التبويبات:

- `prices`
- `products`
- `orders`
- `inspirations`

#### تبويب الأسعار

- تعديل:
  - `exchangeRate`
  - `buyMarginPercent`
  - `sellMarginPercent`
- حفظ الإعدادات في `app_settings`.
- إعادة جلب الأسعار بعد الحفظ.
- عرض أسعار `buy/sell` الحالية من جدول `prices`.

#### تبويب المنتجات

- إضافة منتج.
- تعديل منتج.
- حذف منتج.
- رفع صورة للمنتج.
- حقول المنتج:
  - `id`
  - `name`
  - `category`
  - `weight`
  - `priceEstimate`
  - `imageUrl`
  - `description`
  - `karat`

#### تبويب الطلبات

- عرض جميع الطلبات.
- عرض اسم العميل إذا وجد في `profiles.full_name`.
- تعديل حالة الطلب.
- حذف الطلب.

#### تبويب الإلهام

- رفع صور إلهام.
- اختيار `piece_type`.
- حفظها في `design_inspirations`.
- حذف صورة الإلهام.

### 11) مؤشر الذهب `src/components/GoldTicker.tsx`

يعرض:

- سعر الأونصة العالمي بالدولار.
- سعر الأونصة المحول إلى الريال.
- أسعار `buy/sell` لكل من:
  - `18K`
  - `21K`
  - `24K`

مهم:

- يوجد `visual jitter` بصري لإعطاء إحساس بالحركة.
- هذا التذبذب لا يغير السعر الحقيقي المخزن في القاعدة.
- عند وصول سعر حقيقي جديد، يتم قفل العرض على القيمة الفعلية مؤقتاً قبل استئناف التذبذب البصري.

## الأزرار والعمليات المهمة

أهم الأزرار والسلوكيات التي يجب أن يعرفها أي مطور:

- زر `الإعدادات`: يفتح `SettingsModal`.
- زر `بوابة الإدارة`: يفتح `AdminPanel` إذا كان الدور `admin`.
- زر `تسجيل الدخول` في بطاقة أسعار الذهب: يفتح شاشة المصادقة.
- زر `استفسار عن التفاصيل` في المنتج: يطلب المصادقة أولاً ثم يفتح أرقام العمال.
- زر `إرسال الطلب`: يرفع الصورة إن وجدت ثم ينشئ سجل في `orders`.
- زر `تأكيد عبر واتساب` بعد نجاح الطلب: يفتح رسالة جاهزة.
- زر `إلغاء` في الطلبات: يستدعي `cancel_own_order`.
- زر `تحديث البيانات`: يعيد جلب المنتجات والأسعار والإعدادات.

## التدفقات الرئيسية

### تدفق الدخول

1. المستخدم يفتح شاشة المصادقة.
2. يدخل `email/password` أو ينشئ حساباً.
3. إذا احتاج التفعيل، يُرسل OTP.
4. المستخدم يؤكد الرمز.
5. يتم إنشاء/استخدام `session`.
6. التطبيق يعيد جلب الأسعار إن كان المستخدم مخولاً.

### تدفق استفسار منتج

1. المستخدم يفتح منتجاً.
2. يضغط `استفسار عن التفاصيل`.
3. إذا لم يكن مسجلاً: تفتح شاشة المصادقة.
4. إذا كان مسجلاً: تفتح نافذة اختيار العامل.
5. عند اختيار العامل: يفتح واتساب مع رسالة جاهزة.

### تدفق طلب جديد

1. المستخدم يفتح تبويب الطلبات.
2. يملأ اسم القطعة ونوعها والعيار والوزن.
3. يختار صورة إلهام أو يرفع صورة.
4. التطبيق يحسب تقديراً أولياً للذهب.
5. يضغط `إرسال الطلب`.
6. ترفع الصورة إلى `Storage` إن كانت محلية.
7. ينشأ سجل جديد في `orders`.
8. تظهر شاشة النجاح مع خيار واتساب.

### تدفق الإدارة

1. المشرف يفتح الإعدادات.
2. يضغط `بوابة الإدارة`.
3. يختار أحد تبويبات:
   - الأسعار
   - المنتجات
   - الطلبات
   - الإلهام

## طبقة البيانات في Supabase

### الجداول الأساسية

#### `products`

تخزن:

- `id`
- `name`
- `category`
- `weight`
- `priceEstimate`
- `imageUrl`
- `description`
- `karat`

ملاحظة:

- `priceEstimate` موجود في البنية لكنه غير مستخدم فعلياً في واجهة العرض الحالية.

#### `orders`

تخزن:

- `id`
- `phone`
- `weight`
- `imageUrl`
- `notes`
- `date`
- `status`
- `user_id`

الحالات المسموحة:

- `new`
- `pending`
- `processing`
- `completed`
- `delivered`
- `cancelled`

#### `prices`

تخزن السعر النهائي المعروض لكل عيار:

- `karat`
- `buy`
- `sell`
- `updated_at`

#### `price_history`

تخزن السجل الخام والوسيط لكل Snapshot سعري:

- `karat`
- `source_price_per_oz`
- `price_per_gram`
- `buy`
- `sell`
- `currency`
- `source`
- `raw_payload`
- `created_at`

#### `app_settings`

تخزن إعدادات التسعير المركزية:

- `exchange_rate`
- `buy_margin_percent`
- `sell_margin_percent`
- `updated_at`

#### `profiles`

تخزن:

- `id`
- `email`
- `role`
- `full_name`

#### `design_inspirations`

تخزن صور إلهام الاستوديو:

- `id`
- `title`
- `piece_type`
- `image_url`
- `storage_path`
- `is_active`
- `sort_order`
- `created_by`
- `created_at`
- `updated_at`

### Storage

الـ bucket المستخدمة فعلياً:

- `products`

وتحتوي على مسارات فرعية متعددة:

- `products/...` صور المنتجات
- `requests/...` صور طلبات العملاء
- `studio-inspirations/...` صور الإلهام

## رموز ومعرّفات قاعدة البيانات

هذه أهم المعرفات التي يحتاجها المطور سريعاً:

### أسماء الجداول

- `products`
- `orders`
- `prices`
- `price_history`
- `app_settings`
- `profiles`
- `design_inspirations`

### الدوال / RPC

- `public.has_authenticated_email()`
- `public.recalculate_gold_prices()`
- `public.apply_gold_price_snapshot(...)`
- `public.cancel_own_order(uuid)`

### الأدوار

- `user`
- `admin`

### حالات الطلب

- `new`
- `pending`
- `processing`
- `completed`
- `delivered`
- `cancelled`

### المعرفات البيئية

#### للواجهة الحالية

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### لـ Edge Function الخاصة بالذهب

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOLD_PRICE_Z_KEY`
- `CRON_SECRET`

#### لفحص قاعدة البيانات والسكربتات

- `DATABASE_URL`
- `SUPABASE_DB_URL`

## كيف يعمل جلب أسعار الذهب

### المصدر الخارجي

المصدر الحالي هو:

- `goldpricez`

ويتم جلب سعر الأونصة بالدولار من:

- `https://goldpricez.com/api/rates/currency/usd/measure/all`

### Edge Function

الملف:

- `supabase/functions/update-gold-prices/index.ts`

ما الذي تفعله:

1. تتحقق من المتغيرات البيئية.
2. تتحقق من `CRON_SECRET`.
3. تجلب `ounce_price_usd` من `goldpricez`.
4. تستدعي RPC:
   - `apply_gold_price_snapshot`

### منطق قاعدة البيانات

الهجرة الأساسية:

- `supabase/migrations/20260320000000_centralize_gold_pricing_and_lock_price_access.sql`

داخلها:

- `has_authenticated_email()` لتقييد عرض الأسعار.
- `apply_gold_price_snapshot(...)` لحفظ الـ snapshot الخام.
- `recalculate_gold_prices()` لإعادة بناء جدول `prices`.

### طريقة الحساب

الحساب يعتمد على:

- سعر الأونصة العالمي بالدولار.
- تحويل الأونصة إلى سعر جرام.
- نسبة العيار `18/21/24`.
- `buy_margin_percent`
- `sell_margin_percent`

النتيجة:

- يسجل الـ snapshot في `price_history`.
- يعاد حساب `prices`.
- تظهر الأسعار في التطبيق للمستخدمين المصرح لهم.

### الجدولة

الجدولة موجودة في:

- `supabase/migrations/20260404000000_schedule_gold_price_updates.sql`

والتحديث الدوري مضبوط على:

- كل `5` دقائق عبر `pg_cron`

## الحماية والسياسات

### الأسعار

- جدول `prices` غير متاح لـ `anon`.
- جدول `price_history` غير متاح للعامة.
- جدول `app_settings` غير متاح للعامة.
- القراءة تتطلب مستخدماً `authenticated` لديه بريد إلكتروني فعلي عبر `has_authenticated_email()`.

### الطلبات

الهجرة الأساسية:

- `supabase/migrations/20260328000000_harden_orders_for_production.sql`

المنطق:

- المستخدم يرى طلباته فقط.
- المشرف يرى جميع الطلبات.
- الإدخال مسموح للمستخدم على طلبه فقط أو للمشرف.
- التحديث والحذف الإداري للمشرف فقط.
- المستخدم يمكنه إلغاء طلبه عبر `cancel_own_order` فقط.

### صور الإلهام

الهجرة الأساسية:

- `supabase/migrations/20260226103000_add_design_inspirations.sql`

المنطق:

- المستخدم المصادق يستطيع قراءة الصور النشطة.
- المشرف يستطيع القراءة والإضافة والتعديل والحذف.

## التخزين المحلي على الجهاز

الملف المسؤول:

- `src/services/storage.ts`

يعتمد على:

- `Capacitor Preferences`

المفاتيح الحالية:

- `favorites`
- `app_preferences`
- `app_cache`

ما يتم تخزينه محلياً:

- المفضلة
- إعدادات الخلفية
- Cache بسيط

## Flutter Migration

### الهدف من مجلد `flutter_app/`

- إنشاء تطبيق Flutter جديد فوق نفس `Supabase backend`.
- عدم تغيير الجداول أو السياسات أو الدوال حالياً.
- نقل التطبيق بالتدريج ميزة وراء ميزة.

### ما تم إنجازه في المرحلة الأولى

- إنشاء مشروع Flutter داخل `flutter_app/`.
- تجهيز `pubspec.yaml`.
- تجهيز `main.dart` وربط Supabase عبر `--dart-define`.
- تجهيز `GoRouter`.
- تجهيز تبويبات:
  - `overview`
  - `catalog`
  - `favorites`
  - `requests`
  - `settings`
- تجهيز `Theme`.
- تجهيز Placeholder screens توضّح خارطة الهجرة.
- ضبط `applicationId` إلى `com.babeljewelry.app`.
- إعداد أذونات Android الأساسية.
- ضبط اسم التطبيق.

### الملفات المهمة في Flutter

- `flutter_app/lib/main.dart`
- `flutter_app/lib/src/app/babel_app.dart`
- `flutter_app/lib/src/config/app_environment.dart`
- `flutter_app/lib/src/features/home/presentation/overview_screen.dart`
- `flutter_app/lib/src/features/home/presentation/home_shell_screen.dart`
- `flutter_app/test/widget_test.dart`

### ما الذي نجح في Flutter

- `flutter pub get`
- `flutter analyze`
- `flutter test`

### أين توقفنا بالضبط

التوقف الحالي في **بناء APK** فقط.

آخر عقدة تقنية مؤكدة:

- NDK المطلوبة من Flutter هي `28.2.13676358`.
- هذه النسخة كانت ناقصة محلياً.
- تبعية `jni` تعتمد على `flutter.ndkVersion` الافتراضية.
- لذلك فشل `flutter build apk --debug`.

### ما الذي لم نغيره عمداً في الهجرة

- جداول Supabase
- سياسات RLS
- `Storage bucket`
- `RPCs`
- `Edge Function`
- منطق التسعير في القاعدة

### الخطوات المتبقية بعد المرحلة الأولى

#### خطوة تقنية مباشرة

1. إصلاح أو إعادة تثبيت `Android NDK 28.2.13676358`.
2. إعادة تجربة `flutter build apk --debug`.
3. تجربة APK على هاتف أندرويد حقيقي.

#### مراحل الهجرة الوظيفية

1. نقل المصادقة من `src/LoginScreen.tsx`.
2. نقل Shell والتنقل من `src/App.tsx` و`src/app/AppChrome.tsx`.
3. نقل الكتالوج والمفضلة وتفاصيل المنتج.
4. نقل أسعار الذهب.
5. نقل الطلبات والاستوديو الذكي.
6. تقرير قرار منفصل بخصوص نقل لوحة الإدارة أو إبقائها Web.

### المخاطر المتوقعة في الهجرة

- اختلاف سلوك OTP إذا لم تتم مطابقته حرفياً.
- فقدان بيانات محلية مثل المفضلة إذا لم يتم ترحيلها.
- مشاكل صلاحيات الصور والكاميرا بين Android وiOS.
- كسر الوصول للأسعار إذا تم تغيير RLS أو الجداول.
- نقل الإدارة مبكراً سيزيد الوقت والتعقيد.

## الملفات التي تراجع أولاً

إذا كنت مطوراً جديداً وتريد أسرع فهم ممكن:

1. `src/App.tsx`
2. `src/components/RequestSection.tsx`
3. `src/components/AdminPanel.tsx`
4. `src/services/api.ts`
5. `supabase/functions/update-gold-prices/index.ts`
6. `supabase/migrations/20260320000000_centralize_gold_pricing_and_lock_price_access.sql`
7. `flutter_app/lib/src/app/babel_app.dart`

## أوامر العمل الأساسية

### تشغيل التطبيق الحالي

```bash
npm install
npm run dev
```

### الفحوصات الأساسية

```bash
npm run type-check
npm test -- --run
npm run build
```

### تحليل الحزمة

```bash
npm run analyze
```

### اختبارات Android الحالية

```bash
npm run appium:driver:install
npm run appium:server
npm run e2e:android:smoke
```

على ويندوز:

```bash
npm run e2e:android:smoke:win
```

### تشغيل Flutter scaffold

```bash
cd flutter_app
flutter pub get
flutter run --dart-define=SUPABASE_URL=YOUR_SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### فحص Flutter

```bash
cd flutter_app
flutter analyze
flutter test
```

## Android الحالي عبر Capacitor

الإعداد الحالي:

- `appId`: `com.babeljewelry.app`
- `appName`: `مجوهرات بابل`

الملف:

- `capacitor.config.ts`

مهم:

- الملف `Babel-Jewelry-debug.apk` الموجود في الجذر هو APK من التطبيق الحالي، وليس من Flutter.

## الموقع التسويقي `marketing-site`

هذا مشروع منفصل عن التطبيق الرئيسي.

مهم:

- لا يقرأ مباشرة من قاعدة بيانات التطبيق.
- قسم أسعار الذهب فيه محاكاة Frontend فقط.
- لا توجد مزامنة حقيقية مع `prices` أو `price_history`.

الأقسام الحالية:

- Hero
- مؤشر أسعار الذهب
- الكتالوج
- الاستوديو الذكي
- المميزات
- لقطات من التطبيق
- التواصل

الملفات المهمة:

- `marketing-site/src/pages/index.astro`
- `marketing-site/src/config/site.ts`

ملاحظات حالية:

- `site.url` ما زال placeholder.
- `site.contact.email` ما زال placeholder.
- روابط `android/ios` فارغة.

## السكربتات المساعدة

### `scripts/db_check.js`

يفحص:

- الجداول
- الأعمدة
- القيود
- RLS
- السياسات
- RPC

### `check-admin.js`

سكربت بسيط لفحص المستخدمين والأدوار داخل `profiles`.

## ملاحظات مهمة لأي نقل إلى GitHub أو Replit

- التطبيق الحالي هو المصدر الرسمي العامل، وليس `flutter_app/`.
- `flutter_app/` حالياً Scaffold فقط.
- لا ترفع الأسرار الحقيقية إلى GitHub.
- عند نقل المشروع إلى Replit، افصل بين:
  - تشغيل التطبيق الحالي `npm run dev`
  - تشغيل Flutter scaffold
- Replit قد يكون مناسباً أكثر لتشغيل نسخة الويب الحالية من Flutter build المحلي الكامل.

## ملاحظات أخيرة

- التطبيق الحالي متماسك من ناحية الصلاحيات والتسعير والطلبات.
- أسعار الذهب مخفية عمداً عن الزوار.
- `priceEstimate` موجود في البيانات لكنه غير ظاهر في الواجهة الحالية.
- لا توجد حالياً خدمة `forgot password`.
- التوقف الحالي في الهجرة إلى Flutter تقني محلي في NDK، وليس في منطق التطبيق أو قاعدة البيانات.

إذا كنت تريد استكمال التحويل بعد هذا README، فابدأ بإصلاح NDK المحلي، ثم تابع مرحلة نقل المصادقة إلى Flutter.
