import net from 'net';

// Получаем хост и порт из переменных окружения
const DEVICE_HOST = process.env.DEVICE_HOST || 'localhost'; // Дефолт для локального запуска без Docker
const DEVICE_PORT = parseInt(process.env.DEVICE_PORT || '6000', 10); // Преобразуем в число
const CONNECTION_TIMEOUT = 5000; // Таймаут на соединение и ответ (5 секунд)

/**
 * Отправляет команду на TCP-устройство и возвращает его ответ.
 * @param command Команда для отправки (без \n)
 * @returns Промис, который разрешается ответом устройства (строка) или отклоняется с ошибкой.
 */
export const sendCommandToDevice = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        console.log(`[DeviceService] Попытка подключения к ${DEVICE_HOST}:${DEVICE_PORT}`);
        const client = new net.Socket();
        let responseData = '';
        let connectionClosed = false;
        let timer: NodeJS.Timeout | null = null;

        // Функция для очистки и завершения
        const cleanup = (error?: Error) => {
            if (connectionClosed) return;
            connectionClosed = true;
            
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            
            client.destroy();
            console.log(`[DeviceService] Соединение закрыто.`);
            
            if (error) {
                console.error(`[DeviceService] Ошибка: ${error.message}`);
                reject(error);
            } else if (responseData) {
                console.log(`[DeviceService] Успешно получен ответ: ${responseData.trim()}`);
                resolve(responseData.trim());
            } else {
                console.warn('[DeviceService] Соединение закрыто без ответа.');
                reject(new Error('Устройство не ответило'));
            }
        };

        // Устанавливаем таймаут на всю операцию
        timer = setTimeout(() => {
            cleanup(new Error(`Таймаут (${CONNECTION_TIMEOUT}мс) при ожидании ответа от устройства`));
        }, CONNECTION_TIMEOUT);

        // Обработчик успешного подключения
        client.connect(DEVICE_PORT, DEVICE_HOST, () => {
            console.log(`[DeviceService] Успешно подключено к ${DEVICE_HOST}:${DEVICE_PORT}`);
            const commandToSend = command + '\n';
            console.log(`[DeviceService] Отправка команды: '${commandToSend.trim()}'`);
            client.write(commandToSend);
        });

        // Обработчик получения данных от устройства
        client.on('data', (data: Buffer) => {
            const receivedData = data.toString();
            responseData += receivedData;
            console.log(`[DeviceService] Получены данные: '${receivedData.trim()}'`);
            
            // Если получили ответ, закрываем соединение
            if (responseData.trim()) {
                cleanup();
            }
        });

        // Обработчик закрытия соединения со стороны устройства
        client.on('close', () => {
            console.log('[DeviceService] Соединение закрыто устройством.');
            cleanup();
        });

        client.on('end', () => {
            console.log('[DeviceService] Устройство завершило передачу (end).');
            cleanup();
        });

        // Обработчик ошибок сокета
        client.on('error', (err: Error) => {
            cleanup(err);
        });
    });
}; 
