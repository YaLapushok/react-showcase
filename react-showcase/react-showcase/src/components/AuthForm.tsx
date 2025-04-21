import React, { useState } from "react";

const inputCls = "w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white";

interface AuthFormProps {
    state: "login" | "register" | "password";
    setState: (newState: "login" | "register" | "password") => void;
}

export function AuthForm({ state, setState }: AuthFormProps) {
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    const heading = {
        "login": "Вход",
        "register": "Регистрация",
        "password": "Сброс пароля",
    }[state];

    const actionLabel = heading;
    const formAction = {
        "login": "/login",
        "register": "/register",
        "password": "/reset-password",
    }[state];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setIsError(false);

        const formData = new FormData(e.currentTarget);
        const response = await fetch(formAction, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.status === "success") {
            setMessage(data.message);
            setIsError(false);
        } else {
            setMessage(data.message);
            setIsError(true);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6 text-gray-200">
                {heading}
            </h1>

            {message && (
                <div className={`w-full max-w-md mb-4 p-4 rounded-md ${isError ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                {state === "register" && (
                    <input
                        type="text"
                        name="username"
                        placeholder="Имя пользователя"
                        className={inputCls}
                    />
                )}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className={inputCls}
                />
                {["login", "register"].includes(state) &&
                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        className={inputCls}
                    />
                }
                <button
                    type="submit"
                    className={`w-full p-3 text-white rounded ${state === "login" ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"}`}
                >
                    {actionLabel}
                </button>
            </form>

            {["login", "register"].includes(state) &&
                <p className="mt-4 text-sm text-gray-400">
                    {state === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                    <button
                        onClick={state === "login" ? () => setState("register") : () => setState("login")}
                        className="text-blue-400 hover:underline cursor-pointer"
                    >
                        {state === "login" ? "Зарегистрироваться" : "Войти"}
                    </button>
                </p>
            }

            {state === "login" &&
                <p className="mt-4 text-sm text-gray-400">
                    Забыли пароль?{" "}
                    <button
                        onClick={() => setState("password")}
                        className="text-blue-400 hover:underline cursor-pointer"
                    >
                        Восстановить пароль
                    </button>
                </p>
            }
        </main>
    );
}
