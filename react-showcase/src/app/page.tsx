"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white";

export default function Home() {
    const [isLogin, setIsLogin] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = {
            username: formData.get("username"),
            email: formData.get("email"),
            password: formData.get("password"),
        };

        const response = await fetch("http://localhost:42424/v0/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert("Confirmation email sent!");
        } else {
            alert("Registration failed.");
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6 text-gray-200">
                {isLogin ? "Login" : "Register"}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
                {!isLogin && (
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        className={inputCls}
                        required
                    />
                )}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className={inputCls}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className={inputCls}
                    required
                />
                <button
                    type="submit"
                    className={`w-full p-3 text-white rounded ${isLogin ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"}`}
                >
                    {isLogin ? "Login" : "Register"}
                </button>
            </form>

            <p className="mt-4 text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                    onClick={() => setIsLogin((prev) => !prev)}
                    className="text-blue-400 hover:underline cursor-pointer"
                >
                    {isLogin ? "Register here" : "Login here"}
                </button>
            </p>
        </main>
    );
}