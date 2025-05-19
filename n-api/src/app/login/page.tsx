"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Błąd logowania: " + json.error);
      }
    } catch (err) {
      alert("Wystąpił błąd podczas logowania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
        <Input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>
    </div>
  );
}
