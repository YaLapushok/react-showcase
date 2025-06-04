import React, { useState } from 'react';
import api from '../services/api'; // Наш настроенный Axios

interface DeviceResponse {
    address: string;
    port: number;
    response: string;
}

function DeviceControlPage() {
    const [command, setCommand] = useState<string>(''); // Состояние для команды ввода
    const [response, setResponse] = useState<DeviceResponse[] | null>(null); // Состояние для ответа
    const [error, setError] = useState<string | null>(null); // Состояние для ошибки
    const [loading, setLoading] = useState<boolean>(false); // Состояние загрузки

    const handleSendCommand = async () => {
        if (!command) {
            setError('Введите команду для отправки.');
            setResponse(null);
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Отправляем POST-запрос на наш новый эндпоинт
            const result = await api.post<{ success: boolean; response?: DeviceResponse[]; message?: string }>('/device/command', {
                command: command, // Передаем команду в теле запроса
            });

            if (result.data.success) {
                setResponse(result.data.response || []);
            } else {
                setError(result.data.message || 'Произошла неизвестная ошибка на бэкенде.');
            }
        } catch (err: any) {
            console.error('Ошибка при отправке команды устройству:', err);
            // Обрабатываем ошибки Axios или сетевые ошибки
            setError(err.response?.data?.message || err.message || 'Не удалось отправить команду.');
        } finally {
            setLoading(false);
        }
    };

    const formatResponse = (responses: DeviceResponse[]) => {
        return responses.map((resp, index) => (
            <div key={index} className="mb-2">
                <div className="font-semibold text-gray-700">
                    Устройство {resp.address}:{resp.port}
                </div>
                <div className="text-gray-600">
                    Ответ: {resp.response}
                </div>
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Управление TCP Устройством (Симулятор)</h2>

                <div className="mb-4">
                    <label htmlFor="commandInput" className="block text-sm font-medium text-gray-700 mb-1">
                        Команда для устройства:
                    </label>
                    <input
                        type="text"
                        id="commandInput"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Например: GET_STATUS или SET_LED=1"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleSendCommand}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Отправка...' : 'Отправить команду'}
                </button>

                <div className="mt-6 p-4 rounded-md bg-gray-50 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ответ:</h3>
                    {response && response.length > 0 ? (
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                            {formatResponse(response)}
                        </div>
                    ) : response && response.length === 0 ? (
                        <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                            Команда выполнена, но ответы от устройств не получены
                        </div>
                    ) : null}
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 p-3 rounded mt-2">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DeviceControlPage; 