"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import ThemeToggle from "@/components/ThemeToggle";
import { Crown } from "lucide-react";

export default function Header() {
  // Use our authentication context
  const { isLoggedIn, isLoading, logout, user } = useAuth();

  // Handle manual logout
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="w-full p-4 border-b border-border flex justify-between items-center">
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <Image 
          src="/logo-pax.png" 
          alt="Topsky.app" 
          width={120} 
          height={36} 
          className="object-contain"
        />
      </Link>
      
      <div className="flex items-center gap-4">
        <NavigationMenu>
          <NavigationMenuList className="gap-4">
            {/* Public link available to everyone */}
            <NavigationMenuItem>
              <Link href="/flights" className="hover:underline text-sm">Flights</Link>
            </NavigationMenuItem>
            
            {/* Debug info */}
            <NavigationMenuItem>
              <span className="text-xs text-gray-500">
                {isLoading ? "Loading..." : isLoggedIn ? `${user?.role || 'user'}` : "Not logged in"}
              </span>
            </NavigationMenuItem>
            
            {/* Don't show any authenticated links while loading to prevent flashing */}
            {!isLoading && isLoggedIn && (
              <>
                {/* Public links available to all authenticated users */}
                <NavigationMenuItem>
                  <Link href="/dashboard" className="hover:underline text-sm">
                    Dashboard
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/dashboard/autofetcher" className="hover:underline text-sm">
                    Auto Fetcher
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/blog" className="hover:underline text-sm">
                    Blog
                  </Link>
                </NavigationMenuItem>

                {/* Blog Management for bloggers and admins */}
                {user && (user.role === 'blogger' || user.role === 'admin') && (
                  <NavigationMenuItem>
                    <Link
                      href="/blog/manage"
                      className="hover:underline text-sm"
                    >
                      Manage Blog
                    </Link>
                  </NavigationMenuItem>
                )}
                
                {/* Admin Panel Link */}
                {user && user.role === 'admin' && (
                  <NavigationMenuItem>
                    <Link
                      href="/admin"
                      className="hover:underline text-sm"
                    >
                      Admin
                    </Link>
                  </NavigationMenuItem>
                )}
                
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
        
        <ThemeToggle />
      </div>
    </header>
  );
}
