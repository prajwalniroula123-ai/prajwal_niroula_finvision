import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { WalletsPage } from '@/features/wallet/pages/WalletsPage';
import { TransactionsPage } from '@/features/transaction/pages/TransactionsPage';
import { EmotionsPage } from '@/features/emotion/pages/EmotionsPage';
import { InsightsPage } from '@/features/ai-insight/pages/InsightsPage';
import { GamificationPage } from '@/features/gamification/pages/GamificationPage';
import { PaymentsPage } from '@/features/payment/pages/PaymentsPage';
import { ChatPage } from '@/features/chat/pages/ChatPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/auth"
          element={!isAuthenticated ? <AuthLayout /> : <Navigate to="/dashboard" />}
        >
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="emotions" element={<EmotionsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="gamification" element={<GamificationPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

