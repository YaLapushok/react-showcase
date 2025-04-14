export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const email = formData.get("email");
        const password = formData.get("password");

        const response = await fetch("http://api:42424/api/v0/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

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
