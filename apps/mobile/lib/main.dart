import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'workspace.dart';
import 'config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final configuration = await loadAuthConfiguration();
    await Supabase.initialize(url: configuration.url, publishableKey: configuration.key);
    runApp(const PowwowApp(authenticationReady: true));
  } catch (error) {
    runApp(PowwowApp(startupError: 'Sign-in setup could not be loaded. Check that the shared API is running.\n\n$error', onRetry: main));
  }
}
class PowwowApp extends StatelessWidget {
  const PowwowApp({super.key, this.authenticationReady = false, this.startupError, this.onRetry});
  final bool authenticationReady;
  final String? startupError;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Powwow', debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE5A18B), brightness: Brightness.dark),
      scaffoldBackgroundColor: const Color(0xFF171918)),
    home: authenticationReady ? const Workspace() : Scaffold(body: SafeArea(child: Center(child: Padding(
      padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(startupError ?? 'Powwow requires Supabase sign-in. Configure the shared API before opening your workspace.'),
        if (onRetry != null) Padding(padding: const EdgeInsets.only(top: 20), child: FilledButton(onPressed: onRetry, child: const Text('Retry'))),
      ]))))),
  );
}
