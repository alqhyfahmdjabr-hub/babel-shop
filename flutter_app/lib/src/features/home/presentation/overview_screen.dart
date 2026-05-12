import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/app_environment.dart';
import '../../../core/theme/babel_theme.dart';
import '../../../core/widgets/status_card.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final environment = ref.watch(appEnvironmentProvider);
    final bootstrapState = ref.watch(appBootstrapStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('مجوهرات بابل')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(
                colors: [Color(0x33D4AF37), Color(0x11000000)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              border: Border.all(color: const Color(0x22D4AF37)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Flutter Migration Scaffold',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: BabelTheme.goldSoft,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'هذه النسخة لا تستبدل التطبيق الحالي بعد. الهدف منها بدء النقل الآمن مع الحفاظ على Supabase كما هو.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(height: 1.6),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Chip(
                      label: Text(
                        environment.isSupabaseConfigured
                            ? 'Supabase Configured'
                            : 'Supabase Missing',
                      ),
                    ),
                    Chip(
                      label: Text(
                        bootstrapState.supabaseInitialized
                            ? 'Bootstrap Ready'
                            : bootstrapState.errorMessage != null
                            ? 'Bootstrap Failed'
                            : 'Waiting For Config',
                      ),
                    ),
                    const Chip(label: Text('Admin stays on Web')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          StatusCard(
            title: 'حالة الربط',
            badge: bootstrapState.supabaseInitialized ? 'جاهز' : 'بحاجة ضبط',
            description:
                'الربط الحالي يعتمد على dart-define. لم ننسخ أي أسرار داخل المشروع، ولم نمس جداول أو سياسات Supabase.',
            items: [
              'SUPABASE_URL مضبوط: ${environment.isSupabaseConfigured ? 'نعم' : 'لا'}',
              'Supabase initialized: ${bootstrapState.supabaseInitialized ? 'نعم' : 'لا'}',
              if (bootstrapState.errorMessage != null)
                'آخر خطأ bootstrap: ${bootstrapState.errorMessage}',
            ],
          ),
          const SizedBox(height: 16),
          const StatusCard(
            title: 'الوحدات المنقولة لاحقاً',
            badge: 'Roadmap',
            description:
                'المسار المتفق عليه يبدأ بالمصادقة ثم الكتالوج والمفضلة ثم الأسعار ثم الطلبات. الإدارة مؤجلة عمداً.',
            items: [
              'Auth migration from src/LoginScreen.tsx',
              'App shell migration from src/App.tsx and src/app/AppChrome.tsx',
              'Catalog and product details from ProductCard.tsx and ProductModal.tsx',
              'Gold pricing from GoldTicker.tsx and services/api.ts',
              'Orders and studio flow from RequestSection.tsx',
            ],
          ),
          const SizedBox(height: 16),
          const StatusCard(
            title: 'مبدأ السلامة',
            badge: 'No DB Changes',
            description:
                'هذه الخطوة لا تنفذ أي migration ولا تغيّر أي application logic في قاعدة البيانات. كل العمل الحالي يقتصر على Flutter scaffold.',
            items: [
              'لا تغيير في products / orders / prices / profiles / app_settings',
              'لا تغيير في Storage bucket products',
              'لا تغيير في RPCs مثل cancel_own_order أو apply_gold_price_snapshot',
              'لا استخدام لـ service_role داخل Flutter',
            ],
          ),
        ],
      ),
    );
  }
}
