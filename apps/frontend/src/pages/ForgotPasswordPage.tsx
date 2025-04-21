import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Импорт Axios
import { AxiosError } from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // Для сообщений пользователю
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Состояние загрузки

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      // Вызов API бэкенда
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message); // Отображаем сообщение с бэкенда
      setEmail(''); // Очищаем поле email
    } catch (err) {
      console.error('Forgot password error:', err);
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Сброс Пароля</h2>
        
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Введите ваш email, и мы отправим вам ссылку для сброса пароля.
            </p>
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
                disabled={isLoading} // Блокируем поле во время загрузки
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <button
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={isLoading} // Блокируем кнопку во время загрузки
              >
                {isLoading ? 'Отправка...' : 'Отправить ссылку'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
} 