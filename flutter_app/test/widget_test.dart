import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_app/src/app/babel_app.dart';
import 'package:flutter_app/src/config/app_environment.dart';

void main() {
  testWidgets('renders overview shell', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appEnvironmentProvider.overrideWithValue(
            const AppEnvironment(supabaseUrl: '', supabaseAnonKey: ''),
          ),
          appBootstrapStateProvider.overrideWithValue(
            AppBootstrapState.unconfigured(),
          ),
        ],
        child: const BabelApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('مجوهرات بابل'), findsOneWidget);
    expect(find.text('Flutter Migration Scaffold'), findsOneWidget);
  });
}
