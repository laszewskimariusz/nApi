"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";

export default function Header() {
  // Use our authentication context
  const { isLoggedIn, isLoading, logout } = useAuth();

  // Handle manual logout
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="w-full p-4 border-b border-border flex justify-between items-center">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight hover:underline">
        nApi
      </Link>
      
      <NavigationMenu>
        <NavigationMenuList className="gap-4">
          {/* Public link available to everyone */}
          <NavigationMenuItem>
            <Link href="/flights" className="hover:underline text-sm">Flights</Link>
          </NavigationMenuItem>
          
          {/* Debug info */}
          <NavigationMenuItem>
            <span className="text-xs text-gray-500">
              {isLoading ? "Loading..." : isLoggedIn ? "Logged in" : "Not logged in"}
            </span>
          </NavigationMenuItem>
          
          {/* Don't show any authenticated links while loading to prevent flashing */}
          {!isLoading && isLoggedIn && (
            <>
              <NavigationMenuItem>
                <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/dashboard/autofetcher" className="hover:underline text-sm">Auto Fetcher</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <span 
                  onClick={handleLogout} 
                  className="hover:underline text-sm cursor-pointer"
                >
                  Logout
                </span>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
