"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";


export default function HomePage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Sprawdź, czy jest cookie 'session' - proste sprawdzenie klienta
    const isLoggedIn = document.cookie.includes("session=");
    if (isLoggedIn) {
      router.replace("/dashboard");
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  if (checkingSession) {
    // Opcjonalnie: loading lub puste
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
          <Image src="/napi.png" alt="nApi logo" width={72} height={72} className="mb-2 rounded-full" />
          <h2 className="text-2xl font-semibold mb-2">Login</h2>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
