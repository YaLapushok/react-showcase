import React, { useState, FormEvent } from 'react';

export default function RegisterForm() {
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage(null);
        setIsError(false);
        setIsActive(false);

        const formData = new FormData(event.currentTarget);
        const response = await fetch("/register", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.status === "success") {
            setMessage(data.message);
            setIsError(false);
            setIsActive(data.is_active);
        } else {
            setMessage(data.message);
            setIsError(true);
            setIsActive(data.is_active);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
                <div className={`p-4 rounded-md ${isError ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                    {message}
                    {!isError && !isActive && (
                        <p className="mt-2">Пожалуйста, проверьте вашу почту для подтверждения регистрации.</p>
                    )}
                    {isError && isActive && (
                        <p className="mt-2">Ваш аккаунт уже активирован. Вы можете войти в систему.</p>
                    )}
                    {isError && !isActive && (
                        <p className="mt-2">Ваш аккаунт ожидает подтверждения. Проверьте вашу почту.</p>
                    )}
                </div>
            )}
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Имя пользователя
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Пароль
                </label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Зарегистрироваться
            </button>
        </form>
    );
} 