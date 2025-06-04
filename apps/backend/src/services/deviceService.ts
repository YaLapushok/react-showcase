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
 * Отправляет команду на одно устройство и возвращает его ответ
 */
const sendCommandToSingleDevice = (host: string, port: number, command: string): Promise<DeviceResponse> => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';
        let timer: NodeJS.Timeout | null = null;

        const cleanup = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            client.destroy();
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Таймаут при ожидании ответа от ${host}:${port}`));
        }, CONNECTION_TIMEOUT);

        client.connect(port, host, () => {
            console.log(`[DeviceService] Подключено к ${host}:${port}`);
            client.write(command + '\n');
        });

        client.on('data', (data: Buffer) => {
            responseData += data.toString();
            if (responseData.trim()) {
                cleanup();
                resolve({
                    address: host,
                    port: port,
                    response: responseData.trim()
                });
            }
        });

        client.on('error', (err: Error) => {
            cleanup();
            reject(err);
        });

        client.on('close', () => {
            cleanup();
            if (responseData.trim()) {
                resolve({
                    address: host,
                    port: port,
                    response: responseData.trim()
                });
            }
        });
    });
};

/**
 * Отправляет команду на все устройства и возвращает их ответы
 */
export const sendCommandToDevice = async (command: string): Promise<DeviceResponse[]> => {
    console.log(`[DeviceService] Отправка команды на все устройства: '${command}'`);
    
    const devices = [
        { host: DEVICE_HOST, port: DEVICE_PORT },
        { host: DEVICE_HOST, port: DEVICE_PORT + 1 },
        { host: DEVICE_HOST, port: DEVICE_PORT + 2 },
        { host: DEVICE_HOST, port: DEVICE_PORT + 3 },
        { host: DEVICE_HOST, port: DEVICE_PORT + 4 }
    ];

    const responses: DeviceResponse[] = [];
    const promises = devices.map(device => 
        sendCommandToSingleDevice(device.host, device.port, command)
            .then(response => {
                console.log(`[DeviceService] Получен ответ от ${device.host}:${device.port}: ${response.response}`);
                responses.push(response);
            })
            .catch(error => {
                console.error(`[DeviceService] Ошибка при работе с ${device.host}:${device.port}: ${error.message}`);
            })
    );

    await Promise.all(promises);
    return responses;
}; 
