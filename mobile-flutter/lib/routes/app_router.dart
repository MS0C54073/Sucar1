import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/user_model.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/client/booking_screen.dart';
import '../screens/client/my_bookings_screen.dart';
import '../screens/client/vehicle_list_screen.dart';
import '../screens/driver/driver_home_screen.dart';
import '../screens/driver/driver_bookings_screen.dart';
import '../screens/booking_detail_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isLoggedIn = authProvider.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login' || 
                          state.matchedLocation == '/register';

      if (!isLoggedIn && !isLoginRoute) {
        return '/login';
      }
      
      if (isLoggedIn && isLoginRoute) {
        final user = authProvider.user;
        if (user?.role == UserRole.client) {
          return '/client/home';
        } else if (user?.role == UserRole.driver) {
          return '/driver/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      // Client routes
      GoRoute(
        path: '/client/home',
        builder: (context, state) => const ClientHomeScreen(),
      ),
      GoRoute(
        path: '/client/booking',
        builder: (context, state) => const BookingScreen(),
      ),
      GoRoute(
        path: '/client/bookings',
        builder: (context, state) => const MyBookingsScreen(),
      ),
      GoRoute(
        path: '/client/vehicles',
        builder: (context, state) => const VehicleListScreen(),
      ),
      // Driver routes
      GoRoute(
        path: '/driver/home',
        builder: (context, state) => const DriverHomeScreen(),
      ),
      GoRoute(
        path: '/driver/bookings',
        builder: (context, state) => const DriverBookingsScreen(),
      ),
      // Shared routes
      GoRoute(
        path: '/booking/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return BookingDetailScreen(bookingId: id);
        },
      ),
    ],
  );
}
