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
    return new Promise(async (resolve, reject) => {
        console.log(`[DeviceService] Попытка подключения к ${DEVICE_HOST}:${DEVICE_PORT}`);
        const clientA = new net.Socket();
            function doSmth(client: net.Socket) {
            let responseData = '';
            let connectionClosed = false;
            let timer: NodeJS.Timeout | null = null;

            // Функция для очистки и завершения
            const cleanup = (error?: Error) => {
                if (connectionClosed) return; // Избегаем двойного вызова
                connectionClosed = true;
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                client.destroy(); // Убедимся, что сокет закрыт
                console.log(`[DeviceService] Соединение закрыто.`);
                if (error) {
                    console.error(`[DeviceService] Ошибка: ${error.message}`);
                    reject(error); // Отклоняем промис с ошибкой
                } else if (responseData) {
                     console.log(`[DeviceService] Успешно получен ответ: ${responseData.trim()}`);
                    resolve(responseData.trim()); // Разрешаем промис с полученными данными
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
                // Добавляем перевод строки к команде перед отправкой
                const commandToSend = command + '\n';
                console.log(`[DeviceService] Отправка команды: '${commandToSend.trim()}'`);
                client.write(commandToSend);
            });

            // Обработчик получения данных от устройства
            client.on('data', (data) => {
                responseData += data.toString();
                // Считаем, что ответ получен полностью, когда пришли данные (можно улучшить, если ответы многострочные)
                // Для простоты, предполагаем, что устройство отвечает одним блоком и закрывает соединение или мы закрываем по таймауту.
                // Если бы устройство не закрывало соединение, нужна была бы логика определения конца сообщения (например, по '\n')
                console.log(`[DeviceService] Получены данные: '${data.toString().trim()}'`);
                // Мы не закрываем соединение здесь, ждем таймаута или события 'close'/'end'
                // cleanup(); // Пока не вызываем cleanup, накопливаем данные
            });

            // Обработчик закрытия соединения со стороны устройства
            client.on('close', () => {
                console.log('[DeviceService] Соединение закрыто устройством.');
                cleanup(); // Завершаем операцию
            });
            client.on('end', () => {
                console.log('[DeviceService] Устройство завершило передачу (end).');
                 cleanup(); // Завершаем операцию
            });

            // Обработчик ошибок сокета (например, "connection refused")
            client.on('error', (err: any) => {
                cleanup(err); // Завершаем с ошибкой
            });
        }

        for (const client of [new net.Socket(), new net.Socket(), clientA]) doSmth(client);
        await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        });

        doSmth(clientA);
    });
}; 
