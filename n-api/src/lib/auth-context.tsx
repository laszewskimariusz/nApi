"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Define the Authentication context
type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Protected paths that require authentication
const protectedPaths = ["/dashboard", "/dashboard/autofetcher"];

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // First, initialize auth state without redirects
  useEffect(() => {
    const checkLoginStatus = () => {
      // Check both localStorage and cookies
      const storedAuthState = localStorage.getItem("napi-auth");
      const hasValidCookie = document.cookie.includes("logged_in=true");
      const isAuthenticated = storedAuthState === "logged-in" || hasValidCookie;
      
      console.log("Initial auth check:", { 
        storedAuthState, 
        hasValidCookie, 
        cookies: document.cookie,
        isAuthenticated
      });
      
      setIsLoggedIn(isAuthenticated);
      setIsLoading(false);
    };

    // Initial check on mount
    if (typeof window !== 'undefined') {
      checkLoginStatus();
    }

    // Setup event listeners
    window.addEventListener("focus", checkLoginStatus);
    document.addEventListener("visibilitychange", checkLoginStatus);

    return () => {
      window.removeEventListener("focus", checkLoginStatus);
      document.removeEventListener("visibilitychange", checkLoginStatus);
    };
  }, []);

  // Separate effect for route protection - only runs after auth state is determined
  useEffect(() => {
    // Skip if still loading
    if (isLoading) {
      return;
    }

    const isOnProtectedPath = protectedPaths.some(path => pathname?.startsWith(path));
    
    console.log("Path protection check:", { 
      path: pathname, 
      isLoggedIn, 
      isLoading,
      isOnProtectedPath,
      shouldRedirect: isOnProtectedPath && !isLoggedIn && !isLoading
    });
    
    // Only redirect if on a protected path and not authenticated
    if (isOnProtectedPath && !isLoggedIn) {
      console.log("Redirecting unauthenticated user from protected page to home");
      router.replace("/");
    }
  }, [isLoggedIn, pathname, router, isLoading]);

  // Login function - store in localStorage and set state
  const login = () => {
    localStorage.setItem("napi-auth", "logged-in");
    setIsLoggedIn(true);
  };

  // Logout function - remove from localStorage and set state
  const logout = () => {
    localStorage.removeItem("napi-auth");
    setIsLoggedIn(false);
    
    // Call the logout API and redirect to home
    fetch("/api/auth/logout")
      .then(() => router.replace("/"))
      .catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 