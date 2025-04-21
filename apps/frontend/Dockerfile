# Этап 1: Сборка React приложения
FROM node:18-alpine AS build

WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock)
COPY package*.json ./
# COPY yarn.lock ./

# Устанавливаем зависимости
RUN npm install
# RUN yarn install

# Копируем остальной код приложения
COPY . .

# Собираем production build
RUN npm run build
# RUN yarn build

# Этап 2: Настройка Nginx для раздачи статики
FROM nginx:1.25-alpine

# Копируем собранные статические файлы из этапа сборки
COPY --from=build /app/build /usr/share/nginx/html

# (Опционально) Копируем кастомную конфигурацию Nginx, если нужна
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"] 