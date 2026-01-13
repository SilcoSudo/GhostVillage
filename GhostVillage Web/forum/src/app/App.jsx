import { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../shared/components/layout/AuthLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import RegistrationSuccessPage from '../features/auth/pages/RegistrationSuccessPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import HomePage from '../pages/HomePage';
import '../shared/assets/styles/theme.css';

function AppContent() {
  return (
    <Routes>
      {/* Auth pages - no header/sidebar */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        }
      />
      <Route
        path="/registration-success"
        element={
          <AuthLayout>
            <RegistrationSuccessPage />
          </AuthLayout>
        }
      />
      <Route
        path="/verify-email"
        element={
          <AuthLayout>
            <VerifyEmailPage />
          </AuthLayout>
        }
      />

      {/* Main pages - with header/sidebar */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
