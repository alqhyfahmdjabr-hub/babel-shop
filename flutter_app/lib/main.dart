import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app/babel_app.dart';
import 'src/config/app_environment.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final environment = AppEnvironment.fromEnvironment();
  AppBootstrapState bootstrapState = AppBootstrapState.unconfigured();

  if (environment.isSupabaseConfigured) {
    try {
      await Supabase.initialize(
        url: environment.supabaseUrl,
        anonKey: environment.supabaseAnonKey,
      );
      bootstrapState = AppBootstrapState.ready();
    } catch (error) {
      bootstrapState = AppBootstrapState.failed(error.toString());
    }
  }

  runApp(
    ProviderScope(
      overrides: [
        appEnvironmentProvider.overrideWithValue(environment),
        appBootstrapStateProvider.overrideWithValue(bootstrapState),
      ],
      child: const BabelApp(),
    ),
  );
}
