import { redirect } from "next/navigation";

export async function POST(request: Request) {
    const formData = await request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch("http://api:42424/api/v0/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (data.status === "success") {
        return new Response(JSON.stringify({
            status: "success",
            message: "Пользователь успешно зарегистрирован"
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    if (data.user_exists) {
        return new Response(JSON.stringify({
            status: "error",
            message: "Пользователь с таким email уже зарегистрирован",
            is_active: data.is_active
        }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
