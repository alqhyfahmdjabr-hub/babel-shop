import 'package:flutter/material.dart';

import '../../../core/widgets/status_card.dart';

class CatalogScreen extends StatelessWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المعرض')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          StatusCard(
            title: 'حالة المعرض',
            badge: 'Pending',
            description:
                'هذه الشاشة هي المكان الذي سينتقل إليه منطق عرض المنتجات، البحث، والتحميل التدريجي.',
            items: [
              'Source: src/App.tsx',
              'Source: src/components/ProductCard.tsx',
              'Source: src/components/ProductModal.tsx',
              'Source: src/services/api.ts#getProducts',
              'المطلوب لاحقاً: infinite scroll + search + product details',
            ],
          ),
          SizedBox(height: 16),
          StatusCard(
            title: 'المتطلبات المتوقعة',
            badge: 'Next',
            description:
                'سيبقى مصدر المنتجات هو جدول products في Supabase بدون أي تعديل في schema.',
            items: [
              'قراءة عامة من products',
              'عرض imageUrl و name و weight و category و karat',
              'فتح نافذة تفاصيل مع زر واتساب محمي بالمصادقة',
            ],
          ),
        ],
      ),
    );
  }
}
