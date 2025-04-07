"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ConfirmClientProps {
  token: string;
}

export default function ConfirmClient({ token }: ConfirmClientProps) {
  const router = useRouter();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        const response = await fetch(
          `http://localhost:42424/v0/confirm?token=${token}`
        );
        if (response.ok) {
          alert("Account confirmed successfully!");
          router.push("/");
        } else {
          alert("Invalid or expired token.");
        }
      } catch (error) {
        console.error("Error confirming account:", error);
        alert("An error occurred while confirming your account.");
      }
    };

    confirmUser();
  }, [token, router]);

  return <div>Confirming your account...</div>;
}
