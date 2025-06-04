import net from 'net';

// Получаем хост и порт из переменных окружения
const DEVICE_HOST = process.env.DEVICE_HOST || 'localhost'; // Дефолт для локального запуска без Docker
const DEVICE_PORT = parseInt(process.env.DEVICE_PORT || '6000', 10); // Преобразуем в число
const CONNECTION_TIMEOUT = 5000; // Таймаут на соединение и ответ (5 секунд)

interface DeviceResponse {
    address: string;
    port: number;
    response: string;
}

/**
 * Отправляет команду на TCP-устройство и возвращает его ответ.
 * @param command Команда для отправки (без \n)
 * @returns Промис, который разрешается массивом ответов от устройств
 */
export const sendCommandToDevice = (command: string): Promise<DeviceResponse[]> => {
    return new Promise((resolve, reject) => {
        console.log(`[DeviceService] Попытка подключения к устройствам`);
        
        // Список устройств для симуляции
        const devices = [
            { host: DEVICE_HOST, port: DEVICE_PORT },      // Основное устройство
            { host: DEVICE_HOST, port: DEVICE_PORT + 1 },  // Дополнительное устройство 1
            { host: DEVICE_HOST, port: DEVICE_PORT + 2 },  // Дополнительное устройство 2
            { host: DEVICE_HOST, port: DEVICE_PORT + 3 },  // Дополнительное устройство 3
            { host: DEVICE_HOST, port: DEVICE_PORT + 4 }   // Дополнительное устройство 4
        ];

        const responses: DeviceResponse[] = [];
        let completedConnections = 0;

        devices.forEach(device => {
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
                console.log(`[DeviceService] Соединение закрыто для ${device.host}:${device.port}`);
                
                if (error) {
                    console.error(`[DeviceService] Ошибка для ${device.host}:${device.port}: ${error.message}`);
                    // Не отклоняем промис при ошибке подключения, просто пропускаем устройство
                } else if (responseData) {
                    console.log(`[DeviceService] Успешно получен ответ от ${device.host}:${device.port}: ${responseData.trim()}`);
                    responses.push({
                        address: device.host,
                        port: device.port,
                        response: responseData.trim()
                    });
                } else {
                    console.warn(`[DeviceService] Соединение закрыто без ответа для ${device.host}:${device.port}`);
                }

                completedConnections++;
                if (completedConnections === devices.length) {
                    // Разрешаем промис с ответами от доступных устройств
                    resolve(responses);
                }
            };

            // Устанавливаем таймаут на всю операцию
            timer = setTimeout(() => {
                cleanup(new Error(`Таймаут (${CONNECTION_TIMEOUT}мс) при ожидании ответа от устройства ${device.host}:${device.port}`));
            }, CONNECTION_TIMEOUT);

            // Обработчик успешного подключения
            client.connect(device.port, device.host, () => {
                console.log(`[DeviceService] Успешно подключено к ${device.host}:${device.port}`);
                const commandToSend = command + '\n';
                console.log(`[DeviceService] Отправка команды на ${device.host}:${device.port}: '${commandToSend.trim()}'`);
                client.write(commandToSend);
            });

            // Обработчик получения данных от устройства
            client.on('data', (data: Buffer) => {
                const receivedData = data.toString();
                responseData += receivedData;
                console.log(`[DeviceService] Получены данные от ${device.host}:${device.port}: '${receivedData.trim()}'`);
                
                // Если получили ответ, закрываем соединение
                if (responseData.trim()) {
                    cleanup();
                }
            });

            // Обработчик закрытия соединения со стороны устройства
            client.on('close', () => {
                console.log(`[DeviceService] Соединение закрыто устройством ${device.host}:${device.port}`);
                cleanup();
            });

            client.on('end', () => {
                console.log(`[DeviceService] Устройство ${device.host}:${device.port} завершило передачу (end).`);
                cleanup();
            });

            // Обработчик ошибок сокета
            client.on('error', (err: Error) => {
                cleanup(err);
            });
        });
    });
}; 
