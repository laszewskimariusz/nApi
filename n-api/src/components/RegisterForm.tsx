// src/components/RegisterForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleRegister = async () => {
    if (password !== confirm) {
      alert("Hasła się nie zgadzają");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();

      if (res.ok) {
        alert("Sprawdź swoją skrzynkę pocztową i aktywuj konto.");
      } else {
        alert("Błąd: " + json.error);
      }
    } catch (err) {
      alert("Wystąpił błąd podczas rejestracji.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Input type="password" placeholder="Powtórz hasło" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      <Button type="submit" className="w-full">Zarejestruj</Button>
    </form>
  );
}
