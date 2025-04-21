# Используем базовый образ Node.js
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Компилируем TypeScript в JavaScript
RUN npm run build

# Используем меньший образ для production
FROM node:18-alpine

WORKDIR /app

# Копируем только необходимые артефакты из builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
COPY .env ./

# Открываем порт, который использует приложение
EXPOSE 5000

# Команда для запуска приложения
CMD [ "node", "dist/server.js" ] 