import { redirect } from "next/navigation";

export async function POST(request: Request) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch("http://api:42424/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        redirect("/homepage");
    }

    return response.json();
}
