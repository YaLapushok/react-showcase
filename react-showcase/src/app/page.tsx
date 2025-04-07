"use client";

import type React from "react";
import { useState } from "react";

import { AuthForm } from "../components/AuthForm";


export default function Home() {
    const [state, setState] = useState<"login" | "register" | "password">("login");

    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        >
            <AuthForm state={state} setState={setState} />
        </main>
    );
}
