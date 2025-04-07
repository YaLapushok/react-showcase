export async function POST(request: Request) {
    const formData = await request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    return await fetch("http://api:42424/api/v0/users", {
        method: "POST",
        headers: {
            "Content-Type": "text/json",
        },
        body: JSON.stringify({ username, email, password }),
    });
}
