import Link from "next/link";
import { cookies } from "next/headers";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";

export default async function Header() {
  const cookieStore = cookies();
  const session = (await cookieStore).get("session");
  const loggedIn = Boolean(session?.value);

  return (
    <header className="w-full p-4 border-b border-border flex justify-between items-center">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight hover:underline">
        nApi
      </Link>
      
      <NavigationMenu>
        <NavigationMenuList className="gap-4">
          {/* Publiczny link dostępny dla wszystkich */}
          <NavigationMenuItem>
            <Link href="/flights" className="hover:underline text-sm">Flights</Link>
          </NavigationMenuItem>
          
          {/* Linki dostępne tylko dla zalogowanych */}
          {loggedIn && (
            <>
              <NavigationMenuItem>
                <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/dashboard/autofetcher" className="hover:underline text-sm">Auto Fetcher</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/api/auth/logout" className="hover:underline text-sm">Logout</Link>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
