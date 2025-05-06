const net = require('net');

const HOST = '0.0.0.0'; // Слушаем на всех интерфейсах внутри контейнера
const PORT = 6000; // Порт, на котором будет "висеть" наше устройство

// Создаем TCP-сервер
const server = net.createServer((socket) => {
    // Событие 'connection' - срабатывает, когда кто-то подключается
    console.log(`[Mock Device] Клиент подключился: ${socket.remoteAddress}:${socket.remotePort}`);

    let ledStatus = 0; // Просто для примера храним состояние "светодиода"

    // Событие 'data' - срабатывает, когда получаем данные от клиента (нашего бэкенда)
    socket.on('data', (data) => {
        const command = data.toString().trim(); // Преобразуем буфер в строку и убираем лишние пробелы/переводы строк
        console.log(`[Mock Device] Получена команда от ${socket.remoteAddress}:${socket.remotePort}: '${command}'`);

        let response = '';

        // Простая логика обработки команд
        if (command === 'GET_STATUS') {
            response = 'STATUS:OK\n'; // Используем \n для экранирования в строке JS
        } else if (command === 'SET_LED=1') {
            ledStatus = 1;
            response = `LED:${ledStatus}\n`;
        } else if (command === 'SET_LED=0') {
            ledStatus = 0;
            response = `LED:${ledStatus}\n`;
        } else {
            response = 'ERROR:UNKNOWN_COMMAND\n';
        }

        // Отправляем ответ обратно клиенту (бэкенду)
        socket.write(response);
        console.log(`[Mock Device] Отправлен ответ от ${socket.remoteAddress}:${socket.remotePort}: '${response.trim()}'`);
    });

    // Событие 'close' - срабатывает, когда клиент отключается
    socket.on('close', () => {
        console.log(`[Mock Device] Клиент отключился: ${socket.remoteAddress}:${socket.remotePort}`);
    });

    // Событие 'error' - обработка ошибок сокета
    socket.on('error', (err) => {
        console.error(`[Mock Device] Ошибка сокета клиента ${socket.remoteAddress}:${socket.remotePort}:`, err.message);
    });
});

// Начинаем слушать указанный порт
server.listen(PORT, HOST, () => {
    console.log(`[Mock Device] Сервер-симулятор запущен и слушает на ${HOST}:${PORT}`);
});

// Обработка ошибок самого сервера (например, если порт уже занят)
server.on('error', (err) => {
    console.error('[Mock Device] Ошибка сервера:', err.message);
    process.exit(1); // Выходим, если сервер не может запуститься
}); 
