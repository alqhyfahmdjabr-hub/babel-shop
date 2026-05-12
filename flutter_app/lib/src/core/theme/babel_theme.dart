import 'package:flutter/material.dart';

class BabelTheme {
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldSoft = Color(0xFFF6D574);
  static const Color ink = Color(0xFF050505);
  static const Color card = Color(0xFF111111);
  static const Color muted = Color(0xFFB6B6B6);

  static ThemeData get dark {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ink,
      colorScheme: const ColorScheme.dark(
        primary: gold,
        secondary: goldSoft,
        surface: card,
        onPrimary: Colors.black,
        onSurface: Colors.white,
      ),
    );

    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: ink,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color(0x22D4AF37)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF0D0D0D),
        indicatorColor: const Color(0x22D4AF37),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            color: states.contains(WidgetState.selected) ? goldSoft : muted,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: const Color(0x22111111),
        side: const BorderSide(color: Color(0x22D4AF37)),
        labelStyle: const TextStyle(color: Colors.white),
      ),
    );
  }

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFF7F4EC),
      colorScheme: const ColorScheme.light(
        primary: gold,
        secondary: goldSoft,
        surface: Colors.white,
        onPrimary: Colors.black,
        onSurface: Colors.black,
      ),
    );

    return base.copyWith(appBarTheme: const AppBarTheme(centerTitle: true));
  }
}
