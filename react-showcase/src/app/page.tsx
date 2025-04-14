"use client";

import type React from "react";

import { AuthForm } from "../components/AuthForm";


export default function Home() {
    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white"
        >
            <AuthForm />
        </main>
    );
}
