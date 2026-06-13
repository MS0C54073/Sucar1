import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import FindCarWashPage from './pages/FindCarWashPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';

// Lazy load dashboard components for better initial load performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CarWashDashboard = lazy(() => import('./pages/CarWashDashboard'));
const ClientHome = lazy(() => import('./pages/ClientHome'));
const DriverHome = lazy(() => import('./pages/DriverHome'));
const BookService = lazy(() => import('./pages/BookService'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const Payment = lazy(() => import('./pages/Payment'));
const Profile = lazy(() => import('./pages/Profile'));
const MessagesInbox = lazy(() => import('./pages/MessagesInbox'));
const BookingChat = lazy(() => import('./pages/BookingChat'));


// Optimized React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Use cached data if available
      retry: 1, // Only retry once on failure
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/book" element={<FindCarWashPage />} />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute role="admin">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <AdminDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/carwash/messages"
                    element={
                      <ProtectedRoute role="carwash">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <MessagesInbox />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/carwash/chat/:bookingId"
                    element={
                      <ProtectedRoute role="carwash">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <BookingChat />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/carwash/*"
                    element={
                      <ProtectedRoute role="carwash">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <CarWashDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <ClientHome />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/book"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <BookService />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/vehicles/add"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <AddVehicle />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/payment/:bookingId"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <Payment />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/messages"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <MessagesInbox />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/chat/:bookingId"
                    element={
                      <ProtectedRoute role="client">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <BookingChat />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver/messages"
                    element={
                      <ProtectedRoute role="driver">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <MessagesInbox />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver/chat/:bookingId"
                    element={
                      <ProtectedRoute role="driver">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <BookingChat />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver"
                    element={
                      <ProtectedRoute role="driver">
                        <Suspense fallback={<DashboardSkeleton />}>
                          <DriverHome />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<DashboardSkeleton />}>
                          <Profile />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
