"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
    // Состояние для проверки авторизации пользователя
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");

    // Проверка токена авторизации (например, из localStorage)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
            // Здесь можно добавить запрос на сервер для получения имени пользователя
            setUsername("User"); // Пример имени пользователя
        }
    }, []);

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <header className="w-full bg-gray-800 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">My App</h1>
                    <nav>
                        {isAuthenticated ? (
                            <span>Welcome, {username}!</span>
                        ) : (
                            <div>
                                <Link href="/login" className="mr-2 text-blue-400 hover:underline">
                                    Login
                                </Link>
                                <Link href="/register" className="text-blue-400 hover:underline">
                                    Register
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <section className="text-center mt-8">
                <h2 className="text-3xl font-bold mb-4">Welcome to My App!</h2>
                <p className="text-gray-400">
                    This is the home page of your application. You can customize it as needed.
                </p>
            </section>
        </main>
    );
}