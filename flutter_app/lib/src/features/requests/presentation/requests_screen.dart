import 'package:flutter/material.dart';

import '../../../core/widgets/status_card.dart';

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الطلبات')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          StatusCard(
            title: 'الاستوديو الذكي',
            badge: 'Pending',
            description:
                'هذه الشاشة ستستضيف لاحقاً تدفق طلب الصياغة الخاص كاملاً مع الصورة، العيار، الوزن، صور الإلهام، والمتابعة.',
            items: [
              'Source: src/components/RequestSection.tsx',
              'Source: src/services/api.ts#submitOrder',
              'Source: src/services/api.ts#getOrders',
              'Source: src/services/api.ts#cancelOwnOrder',
              'Source: src/services/imageService.ts',
            ],
          ),
          SizedBox(height: 16),
          StatusCard(
            title: 'قواعد يجب الحفاظ عليها',
            badge: 'Important',
            description:
                'منطق الإلغاء والحالات موجود حالياً في القاعدة وواجهة React. النقل الصحيح يعني استدعاء نفس الـ RPCs والالتزام بنفس الحالات.',
            items: [
              'الحالات: new / pending / processing / completed / delivered / cancelled',
              'إلغاء الطلب يجب أن يبقى عبر cancel_own_order',
              'الصور يجب أن تبقى ضمن bucket products مع المسارات requests/... و studio-inspirations/...',
              'تبويب الطلبات يبقى محمياً بالمصادقة',
            ],
          ),
        ],
      ),
    );
  }
}
