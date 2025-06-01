"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, User, UserRole } from "@/lib/auth-context";
import { Users, UserCheck, UserX, Crown } from "lucide-react";

interface AdminUser extends User {
  lastLogin?: Date;
  createdAt?: Date;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    bloggers: 0,
    painters: 0,
    sceners: 0
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
        
        // Calculate stats
        const total = userData.length;
        const active = userData.filter((u: AdminUser) => u.isActive).length;
        const admins = userData.filter((u: AdminUser) => u.role === 'admin').length;
        const bloggers = userData.filter((u: AdminUser) => u.role === 'blogger').length;
        const painters = userData.filter((u: AdminUser) => u.role === 'painter').length;
        const sceners = userData.filter((u: AdminUser) => u.role === 'scener').length;
        
        setStats({ total, active, admins, bloggers, painters, sceners });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'blogger': return 'default';
      case 'painter': return 'secondary';
      case 'scener': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <TabsContent value="users">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="users" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bloggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.bloggers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Painters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.painters}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sceners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.sceners}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userRow) => (
                <TableRow key={userRow.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userRow.role)}
                      <div>
                        <div className="font-medium">{userRow.username}</div>
                        {userRow.profile?.firstName && userRow.profile?.lastName && (
                          <div className="text-sm text-muted-foreground">
                            {userRow.profile.firstName} {userRow.profile.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{userRow.email}</TableCell>
                  <TableCell>
                    <Select
                      value={userRow.role}
                      onValueChange={(value: UserRole) => updateUserRole(userRow.id, value)}
                      disabled={userRow.id === user?.id} // Prevent self-role change
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="blogger">Blogger</SelectItem>
                        <SelectItem value="painter">Painter</SelectItem>
                        <SelectItem value="scener">Scener</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={userRow.isActive ? "default" : "secondary"}
                      className="flex items-center gap-1 w-fit"
                    >
                      {userRow.isActive ? (
                        <><UserCheck className="w-3 h-3" /> Active</>
                      ) : (
                        <><UserX className="w-3 h-3" /> Inactive</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(userRow.id, userRow.isActive)}
                      disabled={userRow.id === user?.id} // Prevent self-deactivation
                    >
                      {userRow.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
} 