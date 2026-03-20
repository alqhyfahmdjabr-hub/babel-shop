# Babel Jewelry — Marketing Website

موقع تسويقي/تعريفي ثابت للتطبيق (Landing Page) منفصل تمامًا عن التطبيق ولا يتصل بقاعدة البيانات أو API الخاص به.

## المتطلبات
- Node.js + npm

## التشغيل محليًا
```bash
npm install
npm run dev
```

## البناء والنشر
```bash
npm run build
npm run preview
```

## التخصيص السريع
- عدّل بيانات الاسم/الوصف/روابط التطبيق/التواصل من: `src/config/site.ts`
- عدّل المنتجات المرئية (ثابتة) من: `src/config/products.ts`
- عدّل الأقسام والنصوص من: `src/pages/index.astro`

## سعر الأونصة
يتم عرضه عبر ويدجت خارجي (TradingView) داخل الصفحة، بدون أي اتصال بخدمات التطبيق.

