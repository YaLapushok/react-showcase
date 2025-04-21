import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuthStore, AuthState } from './store/authStore';
// import './App.css'; // Больше не используем

// Импортируем созданные страницы
import LoginPage from './pages/LoginPage'; // Изменен импорт
import RegisterPage from './pages/RegisterPage'; // Изменен импорт
import HomePage from './pages/HomePage'; // Изменен импорт
import VerifyEmailPage from './pages/VerifyEmailPage'; // Изменен импорт
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Изменен импорт
import ResetPasswordPage from './pages/ResetPasswordPage'; // Изменен импорт

// Placeholder Pages
// const HomePage = () => <div className="p-4">Home Page (Protected)</div>; // Убрали старый плейсхолдер
// const LoginPage = () => <div className="p-4">Login Page</div>; // Убрали старый плейсхолдер
// const RegisterPage = () => <div className="p-4">Register Page</div>; // Убрали старый плейсхолдер

// Компонент для защищенных роутов
const ProtectedRoute = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  // Берем состояние и функцию logout из store
  const { isAuthenticated, logout } = useAuthStore((state: AuthState) => ({ 
      isAuthenticated: state.isAuthenticated, 
      logout: state.logout 
  }));

  const handleLogout = () => {
    logout();
    // Дополнительно можно перенаправить на /login после выхода
    // navigate('/login'); // Потребуется импорт useNavigate
  };

  return (
    // Применяем стили Tailwind к корневому элементу
    <div className="min-h-screen bg-gray-100 antialiased text-gray-800">
      <nav className="bg-white shadow-md p-4 mb-8">
        <ul className="flex space-x-4 justify-center items-center">
          {/* Показываем Home всегда, но он будет защищен */} 
          <li><Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link></li>
          
          {/* Показываем Login/Register только если не аутентифицирован */} 
          {!isAuthenticated && (
            <> 
              <li><Link to="/login" className="text-blue-600 hover:text-blue-800">Login</Link></li>
              <li><Link to="/register" className="text-blue-600 hover:text-blue-800">Register</Link></li>
            </>
          )}

          {/* Показываем Logout только если аутентифицирован */} 
          {isAuthenticated && (
            <li>
              <button 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>

      <main className="container mx-auto px-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div className="text-center text-red-500 font-bold">404 Not Found</div>} />
        </Routes>
      </main>

    </div>
  );
}

export default App; 