import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "react-showcase",
    description: "Демонстрация возможностей Next.js, tailwindcss и Docker",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body
                className="antialiased bg-gray-100"
            >
                {children}
            </body>
        </html>
    );
}
