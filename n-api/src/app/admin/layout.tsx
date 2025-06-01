"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Download, 
  BarChart3,
  Shield
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Link href="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.profile?.firstName || user.username}
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="users" asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </Link>
          </TabsTrigger>
          <TabsTrigger value="content" asChild>
            <Link href="/admin/content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content
            </Link>
          </TabsTrigger>
          <TabsTrigger value="downloads" asChild>
            <Link href="/admin/downloads" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Downloads
            </Link>
          </TabsTrigger>
          <TabsTrigger value="analytics" asChild>
            <Link href="/admin/analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </TabsTrigger>
        </TabsList>
        
        {children}
      </Tabs>
    </div>
  );
} 