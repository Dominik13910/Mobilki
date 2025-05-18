"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await register({ username, password });
      router.push("/login");
    } catch (err) {
      console.error("Register error:", err);
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
      <Button onClick={handleSubmit}>Zarejestruj się</Button>

      <p className="text-sm text-center text-gray-500">
        Masz już konto?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
