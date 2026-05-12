import 'package:flutter/material.dart';

import '../../../core/widgets/status_card.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المفضلة')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          StatusCard(
            title: 'المفضلة المحلية',
            badge: 'Pending',
            description:
                'المفضلة في التطبيق الحالي محفوظة محلياً عبر Capacitor Preferences. في Flutter سننقلها إلى shared_preferences أو طبقة local storage مماثلة.',
            items: [
              'Source: src/services/storage.ts#getFavorites',
              'Source: src/services/storage.ts#toggleFavorite',
              'المخاطرة الوحيدة هنا محلية: المستخدم قد لا يرث المفضلة القديمة تلقائياً',
              'لا يوجد أي خطر على قاعدة البيانات لأن المفضلة ليست مخزنة في Supabase حالياً',
            ],
          ),
        ],
      ),
    );
  }
}
