import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore'; // Импортируем наш store

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Базовый URL нашего бэкенда (изменить, если отличается)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем interceptor для добавления JWT токена к каждому запросу
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Получаем токен из Zustand store
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// (Опционально) Добавляем interceptor для обработки ошибок (например, 401 Unauthorized)
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            // Если получили 401 (не авторизован), например, из-за истекшего токена
            // Выполняем logout, чтобы очистить состояние
            useAuthStore.getState().logout();
            // Можно также перенаправить на страницу логина
            // window.location.href = '/login'; 
            console.error('Unauthorized access - logging out');
        }
        return Promise.reject(error);
    }
);


export default api; 