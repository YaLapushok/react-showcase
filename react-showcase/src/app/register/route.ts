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

    if (response.ok) {
        redirect("/");
    }

    return response.json();
}
