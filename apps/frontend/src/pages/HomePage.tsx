import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker'; // Импортируем DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Импортируем стили для DatePicker
import api from '../services/api'; // Импорт Axios
import { AxiosError } from 'axios';

// Интерфейс для элемента истории
interface HistoryItem {
    id: string;
    messageText: string;
    cronFrequency: string;
    sentAt: string; // или Date
    isSuccess: boolean;
    errorMessage?: string | null;
}

export default function HomePage() {
  const [messageText, setMessageText] = useState('');
  // Убираем старое состояние cronFrequency
  // const [cronFrequency, setCronFrequency] = useState('0 9 * * *'); 
  // Добавляем состояние для выбранной даты и времени
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(new Date()); // Инициализируем текущей датой/временем
  const [history, setHistory] = useState<HistoryItem[]>([]); // Инициализируем пустой массив
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Функция для загрузки истории
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await api.get('/messages/history');
      setHistory(response.data); 
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryError('Не удалось загрузить историю отправлений.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Загружаем историю при монтировании компонента и устанавливаем интервал
  useEffect(() => {
    fetchHistory(); // Загружаем историю при первом рендере

    const intervalId = setInterval(() => {
      fetchHistory(); // Обновляем историю каждые 60 секунд
    }, 60000); // 60000 мс = 1 минута

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, []); // Пустой массив зависимостей гарантирует, что эффект запустится один раз

  // Обработчик отправки формы планирования
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSchedule(true);
    setScheduleError(null);
    setScheduleSuccess(null);

    if (!selectedDateTime) {
      setScheduleError('Пожалуйста, выберите дату и время отправки.');
      setIsLoadingSchedule(false);
      return;
    }

    // Конвертируем дату в строку ISO 8601 для отправки на бэкенд
    const scheduleDateTimeISO = selectedDateTime.toISOString();
    
    // Генерируем cron-строку ТОЛЬКО для отображения и истории
    const date = selectedDateTime;
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; 
    const displayCronFrequency = `${minutes} ${hours} ${dayOfMonth} ${month} *`;

    try {
      // Отправляем ТЕКСТ, СТРОКУ CRON (для истории) и ДАТУ ISO
      await api.post('/messages/schedule', { 
          messageText, 
          cronFrequency: displayCronFrequency, 
          scheduleDateTime: scheduleDateTimeISO 
      });
      // Используем displayCronFrequency в сообщении об успехе
      setScheduleSuccess(`Сообщение успешно запланировано на ${selectedDateTime.toLocaleString()} (Cron для истории: ${displayCronFrequency})`);
      setMessageText(''); 
      // Обновляем историю после успешного планирования
      fetchHistory(); 
    } catch (err) {
      console.error('Error scheduling message:', err);
      const axiosError = err as AxiosError<{ message: string }>;
      const backendError = axiosError.response?.data?.message;
      // Используем displayCronFrequency в сообщении об ошибке
      if (backendError && backendError.toLowerCase().includes('cron')) {
           setScheduleError(`Ошибка формата времени: ${backendError}. Сгенерированный Cron: ${displayCronFrequency}`);
      } else {
           setScheduleError(backendError || 'Ошибка при планировании сообщения.');
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Отправка сообщений по расписанию</h1>

      {/* Форма планирования */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Запланировать новое сообщение</h2>
        
        {/* Сообщения об успехе/ошибке планирования */}
        {scheduleSuccess && <p className="text-green-600 mb-4">{scheduleSuccess}</p>}
        {scheduleError && <p className="text-red-600 mb-4">{scheduleError}</p>}

        <form onSubmit={handleScheduleSubmit}>
          <div className="mb-4">
            <label htmlFor="messageText" className="block text-sm font-medium text-gray-700 mb-1">Текст сообщения:</label>
            <textarea
              id="messageText"
              rows={4}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border ${scheduleError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
              placeholder="Введите текст вашего сообщения..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              disabled={isLoadingSchedule}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="scheduleDateTime" className="block text-sm font-medium text-gray-700 mb-1">Дата и время отправки:</label>
            <DatePicker 
              id="scheduleDateTime"
              selected={selectedDateTime}
              onChange={(date: Date | null) => setSelectedDateTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd.MM.yyyy HH:mm"
              minDate={new Date()}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border ${scheduleError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
              placeholderText="Выберите дату и время"
              required
              disabled={isLoadingSchedule}
              popperPlacement="bottom-start"
            />
          </div>
          <button
            type="submit"
            className={`mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoadingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoadingSchedule}
          >
            {isLoadingSchedule ? 'Планирование...' : 'Запланировать отправку'}
          </button>
        </form>
      </div>

      {/* История отправленных сообщений */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">История отправлений</h2>
        {isLoadingHistory && <p className="text-gray-500 text-center">Загрузка истории...</p>}
        {historyError && <p className="text-red-600 text-center">{historyError}</p>}
        {!isLoadingHistory && !historyError && history.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="py-4">
                <p className="text-sm font-medium text-gray-900 truncate">Текст: <span className="font-normal text-gray-700">{item.messageText}</span></p>
                <p className="text-sm text-gray-500">Расписание (Cron): <code className="bg-gray-100 px-1 rounded">{item.cronFrequency}</code></p>
                <p className="text-sm text-gray-500">Отправлено: {new Date(item.sentAt).toLocaleString()}</p>
                <p className={`text-sm font-medium ${item.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  Статус: {item.isSuccess ? 'Успешно' : 'Ошибка'}
                </p>
                {!item.isSuccess && item.errorMessage && (
                  <p className="text-xs text-red-500 mt-1">Ошибка: {item.errorMessage}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !isLoadingHistory && !historyError && <p className="text-center text-gray-500">История отправлений пуста.</p>
        )}
      </div>
    </div>
  );
} 