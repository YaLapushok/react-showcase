export async function POST(request: Request) {
    const formData = await request.formData();
    const email = formData.get("email");

    return await fetch("http://api:42424/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });
}
