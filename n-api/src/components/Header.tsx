// src/components/Header.tsx

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";

export default function Header() {
  return (
    <header className="w-full p-4 border-b border-border flex justify-between items-center">
      <h1 className="text-lg font-bold tracking-tight">nApi</h1>
      <NavigationMenu>
        <NavigationMenuList className="gap-4">
          <NavigationMenuItem>
            <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/dashboard/autofetcher" className="hover:underline text-sm">Auto Fetcher</Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}