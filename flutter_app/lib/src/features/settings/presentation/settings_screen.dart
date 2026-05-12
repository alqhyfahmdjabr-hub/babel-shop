import 'package:flutter/material.dart';

import '../../../core/widgets/status_card.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          StatusCard(
            title: 'نطاق النقل في النسخة الأولى',
            badge: 'Intentional',
            description:
                'الإدارة الحالية ستبقى خارج Flutter مؤقتاً. شاشة الإعدادات هنا تمهد فقط لما سينتقل لاحقاً من تفضيلات العرض والحساب.',
            items: [
              'Source: src/components/SettingsModal.tsx',
              'Source: src/constants/patterns.ts',
              'Source: src/services/storage.ts#getAppPreferences',
              'AdminPanel.tsx غير منقول في هذه المرحلة',
            ],
          ),
          SizedBox(height: 16),
          StatusCard(
            title: 'بيانات التواصل الحالية',
            badge: 'Reference',
            description:
                'سنحافظ على نفس بيانات التواصل الحالية عند نقل الفوتر، الاستفسار عن المنتج، ودعم تسجيل الدخول.',
            items: [
              'الإدارة: 777772879',
              'العامل قعطبة: 774198414',
              'العامل سناح: 774386432',
              'الهاتف الثابت: 02451445 / 02451944',
              'المصمم: احمد جابر - 783447222',
            ],
          ),
        ],
      ),
    );
  }
}
