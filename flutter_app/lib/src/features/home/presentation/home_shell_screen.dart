import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeShellScreen extends StatelessWidget {
  const HomeShellScreen({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  static const _destinations = [
    NavigationDestination(icon: Icon(Icons.home_outlined), label: 'الرئيسية'),
    NavigationDestination(
      icon: Icon(Icons.grid_view_outlined),
      label: 'المعرض',
    ),
    NavigationDestination(icon: Icon(Icons.favorite_border), label: 'المفضلة'),
    NavigationDestination(
      icon: Icon(Icons.assignment_outlined),
      label: 'الطلبات',
    ),
    NavigationDestination(
      icon: Icon(Icons.settings_outlined),
      label: 'الإعدادات',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        top: false,
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          destinations: _destinations,
          onDestinationSelected: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
        ),
      ),
    );
  }
}
