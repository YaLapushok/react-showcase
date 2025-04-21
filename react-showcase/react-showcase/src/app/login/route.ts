export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        console.log("Отправка запроса на вход:", { email, password });

        const response = await fetch("http://localhost:8000/api/v0/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                email: email,
                password: password 
            }),
        });

        console.log("Ответ от API:", response.status);

        const data = await response.json();
        console.log("Данные ответа:", data);

        if (response.ok) {
            return new Response(JSON.stringify({
                status: "success",
                message: "Успешная авторизация"
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } else {
            return new Response(JSON.stringify({
                status: "error",
                message: data.detail || "Ошибка авторизации. Пожалуйста, проверьте введенные данные или зарегистрируйтесь."
            }), {
                status: response.status,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }
    } catch (error) {
        console.error("Ошибка при обработке запроса:", error);
        return new Response(JSON.stringify({
            status: "error",
            message: "Ошибка сервера. Пожалуйста, попробуйте позже."
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
