import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StateCreator } from 'zustand';

// Определяем интерфейс для данных пользователя (можно расширить)
interface User {
  id: string;
  email: string;
  // Добавить другие поля при необходимости
}

// Определяем интерфейс для состояния хранилища
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Создаем хранилище с использованием middleware persist для сохранения в localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user: User | null) => set({ user }),
      setToken: (token: string | null) => set({ token, isAuthenticated: !!token }),
      login: (user: User, token: string) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Ключ в localStorage
      storage: createJSONStorage(() => localStorage), // Используем localStorage
      // Можно выбрать, какие части состояния сохранять:
      // partialize: (state) => ({ token: state.token }), 
    }
  )
);

// Инициализация состояния при загрузке приложения
// Проверяем наличие токена в localStorage при инициализации
const initialToken = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : null;
if (initialToken) {
  // Здесь можно добавить логику для проверки валидности токена на бэкенде
  // или для получения данных пользователя по токену, если они не хранятся.
  // Пока просто устанавливаем isAuthenticated, если токен есть.
  useAuthStore.setState({ isAuthenticated: true });
} 