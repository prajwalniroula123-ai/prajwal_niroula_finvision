import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';

export const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">FinVision</h1>
            <p className="text-muted-foreground mt-2">
              AI-Powered Personal Finance Management
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

