'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/admin/users?limit=50');
      setUsers(res.data.users);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/admin/users/${id}/status`);
      toast.success('User status updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    tutor: 'bg-blue-100 text-blue-700',
    org: 'bg-green-100 text-green-700',
    student: 'bg-slate-100 text-slate-700',
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Users ({total})</h1>
      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
              </div>
              {user.role !== 'admin' && (
                <Button
                  size="sm" variant="outline"
                  className={`h-8 text-xs ${!user.isActive ? 'text-green-500 border-green-500/30 hover:bg-green-500/10' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}`}
                  onClick={() => toggleStatus(user._id)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}