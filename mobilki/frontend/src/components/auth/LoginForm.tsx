"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await login({ username, password });
      console.log("Login response:", res);
      if (res.ok) {
        router.push("/");
      } else {
        console.error("Sesja nieaktywna mimo logowania");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Nazwa użytkownika"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={handleSubmit}>Zaloguj się</Button>

      <div className="text-sm text-center">
        Nie masz konta?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Zarejestruj się
        </Link>
      </div>
    </div>
  );
}
