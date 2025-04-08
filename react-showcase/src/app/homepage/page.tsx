"use client";

import type React from "react";


function Post({ title, content, date, author, image }: { title: string, content: string, date: string, author: string, image: string }) {
    return (
        <div className="border border-gray-200 rounded-lg shadow-md mb-6 overflow-hidden">
            {image && <img src={image} alt={title} className="w-full h-48 object-cover" />}
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <div className="text-gray-600 text-sm mb-2">
                    <span>{date}</span> &bull; <span>{author}</span>
                </div>
                <p className="text-gray-800">{content}</p>
            </div>
        </div>
    );
}


export default function Home() {
    return (
        <main
            className="flex flex-col items-center min-h-screen bg-gray-900 text-white"
        >
            <Post title="Example Post" date="4 апреля 2025" author="Timur-Is" image="https://placehold.co/600x400" content="Lorem ipsum, text, text, text, different text, letters, numbers: 12454863" />
        </main>
    );
}
