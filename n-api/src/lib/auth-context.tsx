"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Define user roles
export type UserRole = 'user' | 'blogger' | 'painter' | 'scener' | 'admin';

// Define user interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
}

// Define the Authentication context
type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Define role permissions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  user: ['view_dashboard', 'view_flights', 'view_maps', 'download_content'],
  blogger: ['view_dashboard', 'view_flights', 'view_maps', 'download_content', 'create_blog_posts', 'edit_own_blog_posts'],
  painter: ['view_dashboard', 'view_flights', 'view_maps', 'download_content', 'upload_liveries', 'edit_own_liveries'],
  scener: ['view_dashboard', 'view_flights', 'view_maps', 'download_content', 'upload_sceneries', 'edit_own_sceneries'],
  admin: ['*'] // Admin has all permissions
};

// Protected paths that require authentication
const protectedPaths = ["/dashboard", "/dashboard/autofetcher", "/admin", "/user"];

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
  };

  // Check permission function
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // First, initialize auth state without redirects
  useEffect(() => {
    const checkLoginStatus = async () => {
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
      
      if (isAuthenticated) {
        const userDataFetched = await fetchUserData();
        if (userDataFetched) {
          setIsLoggedIn(true);
        } else {
          // If we can't fetch user data, consider user logged out
          localStorage.removeItem("napi-auth");
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      
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
    
    // Check for admin-only routes
    const isOnAdminPath = pathname?.startsWith('/admin');
    const hasAdminAccess = user?.role === 'admin';
    
    console.log("Path protection check:", { 
      path: pathname, 
      isLoggedIn, 
      isLoading,
      isOnProtectedPath,
      isOnAdminPath,
      hasAdminAccess,
      userRole: user?.role
    });
    
    // Redirect if on protected path and not authenticated
    if (isOnProtectedPath && !isLoggedIn) {
      console.log("Redirecting unauthenticated user from protected page to home");
      router.replace("/");
      return;
    }
    
    // Redirect if on admin path and not admin
    if (isOnAdminPath && isLoggedIn && !hasAdminAccess) {
      console.log("Redirecting non-admin user from admin area");
      router.replace("/user/dashboard");
      return;
    }
  }, [isLoggedIn, pathname, router, isLoading, user]);

  // Login function - store in localStorage and set state
  const login = async () => {
    localStorage.setItem("napi-auth", "logged-in");
    const userDataFetched = await fetchUserData();
    if (userDataFetched) {
      setIsLoggedIn(true);
    }
  };

  // Logout function - remove from localStorage and set state
  const logout = () => {
    localStorage.removeItem("napi-auth");
    setIsLoggedIn(false);
    setUser(null);
    
    // Call the logout API and redirect to home
    fetch("/api/auth/logout")
      .then(() => router.replace("/"))
      .catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, hasPermission }}>
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