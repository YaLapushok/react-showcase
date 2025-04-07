import type React from "react";


const inputCls = "w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white";


export function AuthForm({
    state,
    setState,
}: {
    state: "login" | "register" | "password",
    setState: (newState: typeof state) => void,
}) {
    const heading = {
        "login": "Login",
        "register": "Register",
        "password": "Reset password",
    }[state];

    const actionLabel = heading;
    const formAction = {
        "login": "/login",
        "register": "/register",
        "password": "/reset-password",
    }[state];

    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        >
            <h1 className="text-3xl font-bold mb-6 text-gray-200">
                {heading}
            </h1>
            <form className="space-y-4 w-full max-w-md" method="POST" action={formAction}>
                {state === "register" && (
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
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
                        placeholder="Password"
                        className={inputCls}
                    />
                }
                <button
                    type="submit"
                    className={`w-full p-3 text-white rounded ${state === "login" ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
                        }`}
                >
                    {actionLabel}
                </button>
            </form>

            {["login", "register"].includes(state) &&
                <p className="mt-4 text-sm text-gray-400">
                    {state === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        onClick={state === "login" ? () => setState("register") : () => setState("login")}
                        className="text-blue-400 hover:underline cursor-pointer"
                    >
                        {state === "login" ? "Register here" : "Login here"}
                    </button>
                </p>
            }
            {["login", "password"].includes(state) &&
                <p className="mt-4 text-sm text-gray-400">
                    {state === "password" ? "Remember" : "Forgot"}{" your password?"}{" "}
                    <button
                        onClick={state === "password" ? () => setState("login") : () => setState("password")}
                        className="text-blue-400 hover:underline cursor-pointer"
                    >
                        {state === "password" ? "Get back to login" : "Restore password"}
                    </button>
                </p>
            }
        </main>
    );
}
