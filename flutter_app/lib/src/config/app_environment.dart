import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
  });

  factory AppEnvironment.fromEnvironment() {
    return const AppEnvironment(
      supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
      supabaseAnonKey: String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
  }

  final String supabaseUrl;
  final String supabaseAnonKey;

  bool get isSupabaseConfigured =>
      supabaseUrl.trim().isNotEmpty && supabaseAnonKey.trim().isNotEmpty;
}

class AppBootstrapState {
  const AppBootstrapState({
    required this.supabaseInitialized,
    required this.errorMessage,
  });

  factory AppBootstrapState.ready() {
    return const AppBootstrapState(
      supabaseInitialized: true,
      errorMessage: null,
    );
  }

  factory AppBootstrapState.failed(String message) {
    return AppBootstrapState(supabaseInitialized: false, errorMessage: message);
  }

  factory AppBootstrapState.unconfigured() {
    return const AppBootstrapState(
      supabaseInitialized: false,
      errorMessage: null,
    );
  }

  final bool supabaseInitialized;
  final String? errorMessage;
}

final appEnvironmentProvider = Provider<AppEnvironment>(
  (ref) => throw UnimplementedError('AppEnvironment override is missing.'),
);

final appBootstrapStateProvider = Provider<AppBootstrapState>(
  (ref) => throw UnimplementedError('AppBootstrapState override is missing.'),
);

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  final bootstrapState = ref.watch(appBootstrapStateProvider);
  if (!bootstrapState.supabaseInitialized) {
    return null;
  }
  return Supabase.instance.client;
});
