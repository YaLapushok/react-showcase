"use client";

import type React from "react";
import { useState } from "react";

const inputCls = "w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white";

export default function Home() {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const toggleForm = () => {
        setIsLogin((value) => !value);
    };
    const toggleForgotPassword = () => {
        setIsForgotPassword((value) => !value);
    };

    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        >
            <h1 className="text-3xl font-bold mb-6 text-gray-200">
                {isLogin ? (isForgotPassword ? "Restore password" : "Login") : "Register"}
            </h1>
            <form className="space-y-4 w-full max-w-md">
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Username"
                        className={inputCls}
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    className={inputCls}
                />
                {!isForgotPassword &&
                    <input
                        type="password"
                        placeholder="Password"
                        className={inputCls}
                    />
                }
                <button
                    type="submit"
                    className={`w-full p-3 text-white rounded ${isLogin ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
                        }`}
                >
                    {isLogin ? (isForgotPassword ? "Reset password" : "Login") : "Register"}
                </button>
            </form>

            <p className="mt-4 text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                    onClick={toggleForm}
                    className="text-blue-400 hover:underline cursor-pointer"
                >
                    {isLogin ? "Register here" : "Login here"}
                </button>
            </p>
            {isLogin &&
                <p className="mt-4 text-sm text-gray-400">
                    {isForgotPassword ? "Remember" : "Forgot"}{" your password? "}
                    <button
                        onClick={toggleForgotPassword}
                        className="text-blue-400 hover:underline cursor-pointer"
                    >
                        {isForgotPassword ? "Get back to login" : "Restore password"}
                    </button>
                </p>
            }
        </main>
    );
}
