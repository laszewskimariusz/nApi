// src/app/dashboard/autofetcher/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AutoFetcher from "@/components/AutoFetcher";
import RecentFlights from "@/components/RecentFlights";

export default function AutoFetcherPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  // Ensure authentication
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      console.log("AutoFetcher page: User not logged in, redirecting to home");
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading auth status...</div>;
  }

  // Don't render anything if not logged in
  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Auto Fetcher</h1>
      <p className="mb-6 text-gray-600">
        This tool automatically fetches flight data from the airline API every 10 seconds. 
        Enter your API key below to start the automatic fetching process.
      </p>
      <AutoFetcher />
      
      <RecentFlights />
    </div>
  );
}