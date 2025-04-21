import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api'; // Импорт Axios
import { AxiosError } from 'axios';

// Enum для статусов верификации
enum VerificationStatus {
  Verifying,
  Success,
  Error
}

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.Verifying);
  const [message, setMessage] = useState('Подтверждаем ваш email...');

  useEffect(() => {
    const verifyToken = async () => {
      setStatus(VerificationStatus.Verifying); // Сброс состояния при изменении токена
      setMessage('Подтверждаем ваш email...');
      
      if (!token) {
        setStatus(VerificationStatus.Error);
        setMessage('Ошибка: Токен верификации отсутствует.');
        return;
      }

      try {
        // Отправляем реальный запрос на бэкенд
        await api.get(`/auth/verify-email/${token}`);
        
        setStatus(VerificationStatus.Success);
        setMessage('Email успешно подтвержден! Теперь вы можете войти.');

      } catch (err) {
        console.error('Verification error:', err);
        const axiosError = err as AxiosError<{ message: string }>;
        setStatus(VerificationStatus.Error);
        setMessage(axiosError.response?.data?.message || 'Произошла ошибка при верификации email.');
      }
    };

    verifyToken();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case VerificationStatus.Verifying:
        return <p className="text-gray-600">{message}</p>; // Можно добавить спиннер
      case VerificationStatus.Success:
        return (
          <div className="text-center">
            <p className="text-green-600 mb-4">{message}</p>
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Перейти ко входу
            </Link>
          </div>
        );
      case VerificationStatus.Error:
        return <p className="text-red-600">{message}</p>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Верификация Email</h2>
        {renderContent()}
      </div>
    </div>
  );
} 