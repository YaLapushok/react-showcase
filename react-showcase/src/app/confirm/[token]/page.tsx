"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Определяем тип для параметров
interface ConfirmPageProps {
    params: {
        token: string; // Явно указываем, что token — это строка
    };
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
    const router = useRouter();

    useEffect(() => {
        const confirmUser = async () => {
            try {
                const response = await fetch(`http://localhost:42424/v0/confirm?token=${params.token}`);
                if (response.ok) {
                    alert("Account confirmed successfully!");
                    router.push("/"); // Переход на главную страницу
                } else {
                    alert("Invalid or expired token.");
                }
            } catch (error) {
                console.error("Error confirming account:", error);
                alert("An error occurred while confirming your account.");
            }
        };

        confirmUser();
    }, [params.token, router]);

    return <div>Confirming your account...</div>;
}