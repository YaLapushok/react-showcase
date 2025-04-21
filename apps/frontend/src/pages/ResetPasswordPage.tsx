import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Импорт Axios
import { AxiosError } from 'axios';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Убираем проверку токена при загрузке (isValidToken)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают!');
      return;
    }
    // Валидация длины пароля
    if (password.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        return;
    }
    
    setIsLoading(true);

    try {
      // Вызов API для сброса пароля
      const response = await api.post(`/auth/reset-password/${token}`, { password, confirmPassword });
      setMessage(response.data.message || 'Пароль успешно изменен! Вы будете перенаправлены на страницу входа.');
      // Очищаем поля
      setPassword('');
      setConfirmPassword('');
      // Редирект на логин через 3 секунды
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Ошибка сброса пароля. Возможно, ссылка устарела или недействительна.');
    } finally {
      setIsLoading(false);
    }
  };

  // Упрощаем рендеринг, убираем проверку isValidToken
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Установка Нового Пароля</h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}

        {/* Показываем форму, только если нет сообщения об успехе */} 
        {!message && (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Введите новый пароль для вашего аккаунта.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Новый Пароль
              </label>
              <input
                className={`shadow appearance-none border ${error?.includes('Пароль') ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline`}
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Подтвердите Новый Пароль
              </label>
              <input
                className={`shadow appearance-none border ${error?.includes('Пароли не совпадают') ? 'border-red-500' : ''} rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline`}
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <button
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={isLoading || !!message}
              >
                {isLoading ? 'Сохранение...' : 'Установить Новый Пароль'}
              </button>
            </div>
          </form>
        )}
        
        {/* Ссылка на логин (показываем всегда или только при ошибке/успехе) */} 
         <div className="text-center mt-4">
             <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
               Вернуться ко входу
             </Link>
         </div>

      </div>
    </div>
  );
} 