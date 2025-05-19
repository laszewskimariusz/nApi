import Link from "next/link";
import { cookies } from "next/headers";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";

export default async function Header() {
  const cookieStore = cookies();
  const session = cookieStore.get("session");
  const loggedIn = Boolean(session?.value);

  return (
    <header className="w-full p-4 border-b border-border flex justify-between items-center">
      <h1 className="text-lg font-bold tracking-tight">nApi</h1>
      {loggedIn && (
        <NavigationMenu>
          <NavigationMenuList className="gap-4">
            <NavigationMenuItem>
              <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/dashboard/autofetcher" className="hover:underline text-sm">Auto Fetcher</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/dashboard/fullSync" className="hover:underline text-sm">Full Sync</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/api/auth/logout" className="hover:underline text-sm">Logout</Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )}
    </header>
  );
}
