"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function HomePage() {
  const [tab, setTab] = useState("login");
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
        <CardContent className="p-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Logowanie</TabsTrigger>
              <TabsTrigger value="register">Rejestracja</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
