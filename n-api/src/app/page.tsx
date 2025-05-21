"use client";

import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  // Only redirect to dashboard if actually logged in and not in loading state
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      console.log("Home page: User is logged in, redirecting to dashboard");
      router.replace("/dashboard");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If not logged in, show login form
  if (!isLoggedIn) {
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

  // This shouldn't be rendered, but just in case
  return <div className="flex items-center justify-center min-h-screen">Redirecting to dashboard...</div>;
}
