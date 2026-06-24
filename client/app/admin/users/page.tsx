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
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 50;

  // Delete State
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);

  // Edit State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: ''
  });
  const [savingUser, setSavingUser] = useState(false);

  async function load(currentPage = page) {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users?page=${currentPage}&limit=${limit}`);
      setUsers(res.data.data?.users || []);
      setTotal(res.data.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/admin/users/${id}/status`);
      toast.success('User status updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  async function handleDeleteUser(id: string) {
    if (deleteConfirmText !== 'Confirm') {
      toast.error('Please type "Confirm" to proceed');
      return;
    }
    setDeletingUser(true);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted successfully');
      setUserToDelete(null);
      setDeleteConfirmText('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  }

  function handleEditClick(user: any) {
    setUserToDelete(null);
    setEditingUserId(user._id);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'student',
      password: '' // empty means no change
    });
  }

  async function handleSaveUser(id: string) {
    setSavingUser(true);
    try {
      // Only send password if it's filled
      const payload: any = { ...editFormData };
      if (!payload.password) {
        delete payload.password;
      }

      await api.patch(`/admin/users/${id}/update`, payload);
      toast.success('User updated successfully');
      setEditingUserId(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    tutor: 'bg-blue-100 text-blue-700',
    org: 'bg-green-100 text-green-700',
    student: 'bg-slate-100 text-slate-700',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Users ({total})</h1>
      
      {loading && users.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user.name || 'No Name'}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                          {user.role}
                        </span>
                        {!user.isActive && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {user.email} {user.phone ? `| ${user.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="outline"
                      className="h-8 text-xs text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                      onClick={() => handleEditClick(user)}
                    >
                      Edit
                    </Button>
                    
                    {user.role !== 'admin' && (
                      <>
                        <Button
                          size="sm" variant="outline"
                          className={`h-8 text-xs ${!user.isActive ? 'text-green-500 border-green-500/30 hover:bg-green-500/10' : 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10'}`}
                          onClick={() => toggleStatus(user._id)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-8 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => {
                            setEditingUserId(null);
                            setUserToDelete(user._id);
                            setDeleteConfirmText('');
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Delete Confirmation Block */}
                {userToDelete === user._id && (
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg mt-2">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Are you absolutely sure?</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      This will permanently delete this user's account and profile. Type <strong>Confirm</strong> below.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type Confirm"
                      className="w-full sm:w-64 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md mb-3 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-red-500 hover:bg-red-600 text-white border-none disabled:opacity-50"
                        disabled={deleteConfirmText !== 'Confirm' || deletingUser}
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        {deletingUser ? 'Deleting...' : 'Delete Permanently'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-8"
                        onClick={() => setUserToDelete(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Edit Form Block */}
                {editingUserId === user._id && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg mt-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Edit User Details</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                        <select
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="student">Student</option>
                          <option value="tutor">Tutor</option>
                          <option value="org">Organisation</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Password (leave blank to keep current)</label>
                        <input
                          type="text"
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white border-none disabled:opacity-50"
                        disabled={savingUser}
                        onClick={() => handleSaveUser(user._id)}
                      >
                        {savingUser ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-8"
                        onClick={() => setEditingUserId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}