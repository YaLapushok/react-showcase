import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Импортируем useNavigate для редиректа
import { useAuthStore, AuthState } from '../store/authStore'; // Импорт Zustand store и типа AuthState
import api from '../services/api'; // Импорт настроенного Axios
import { AxiosError } from 'axios'; // Импорт типа ошибки Axios

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Состояние для ошибки
  const navigate = useNavigate(); // Hook для навигации
  const login = useAuthStore((state: AuthState) => state.login); // Получаем action login из store и добавлен тип AuthState

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Сброс ошибки перед новым запросом

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data; 

      // Сохраняем данные в Zustand store
      login(user, token);

      // Перенаправляем на главную страницу
      navigate('/');

    } catch (err) {
      console.error('Login error:', err);
      const axiosError = err as AxiosError<{ message: string }>; // Уточняем тип ошибки
      // Устанавливаем сообщение об ошибке для пользователя
      setError(axiosError.response?.data?.message || 'Ошибка входа. Проверьте email и пароль.');
    }
  };

  return (
    // Используем классы Tailwind, аналогичные react-showcase
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-10 pb-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход</h2>
        
        {/* Отображение ошибки */} 
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className={`shadow appearance-none border ${error ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              className={`shadow appearance-none border ${error ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Ссылка на сброс пароля (добавим позже) */}
             <div className="text-right">
               <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                 Забыли пароль?
               </Link>
             </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Войти
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Нет аккаунта? {' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800">
              Зарегистрируйтесь
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 