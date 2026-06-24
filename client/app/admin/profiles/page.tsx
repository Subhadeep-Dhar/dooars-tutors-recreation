'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Star, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 50;

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Edit State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    slug: '',
    type: '',
    bio: '',
    phone: '',
    email: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  async function load(currentPage = page, currentSearch = search, currentType = typeFilter) {
    try {
      setLoading(true);
      const res = await api.get(`/admin/profiles?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&type=${currentType}`);
      setProfiles(res.data.data?.profiles || []);
      setTotal(res.data.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page, search, typeFilter); }, [page]);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      load(1, search, typeFilter);
    }, 400);
    return () => clearTimeout(handler);
  }, [search, typeFilter]);

  async function approve(id: string, approved: boolean) {
    try {
      const type = approved ? 'approve' : 'reject';
      await api.post(`/admin/profiles/${id}/${type}`);
      toast.success(approved ? 'Profile approved' : 'Profile rejected');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  async function toggleFeatured(id: string) {
    try {
      await api.patch(`/admin/profiles/${id}/feature`);
      toast.success('Featured status updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/admin/profiles/${id}/status`);
      toast.success('Profile status updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  function handleEditClick(profile: any) {
    setEditingProfileId(profile._id);
    setEditFormData({
      displayName: profile.displayName || '',
      slug: profile.slug || '',
      type: profile.type || 'tutor',
      bio: profile.bio || '',
      phone: profile.contact?.phone || '',
      email: profile.contact?.email || ''
    });
  }

  async function handleSaveProfile(id: string) {
    setSavingProfile(true);
    try {
      await api.patch(`/admin/profiles/${id}/update`, editFormData);
      toast.success('Profile updated successfully');
      setEditingProfileId(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profiles ({total})</h1>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Types</option>
            <option value="tutor">Tutor</option>
            <option value="coaching_center">Coaching Center</option>
            <option value="sports_trainer">Sports Trainer</option>
          </select>
        </div>
      </div>

      {loading && profiles.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card key={profile._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary text-white flex items-center justify-center font-semibold">
                      {profile.displayName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{profile.displayName || 'Unknown Profile'}</span>
                        <Badge variant="outline" className="text-xs">{profile.type}</Badge>
                        {profile.verificationStatus === 'verified'
                          ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Verified</Badge>
                          : profile.verificationStatus === 'rejected'
                            ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Rejected</Badge>
                            : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Pending</Badge>}
                        {profile.isFeatured && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Featured</Badge>}
                        {!profile.isActive && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{profile.address?.town || 'No Town'}, {profile.address?.district || 'No District'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm" variant="outline"
                      className="h-8 text-xs text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                      onClick={() => handleEditClick(profile)}
                    >
                      Edit
                    </Button>
                    <Link href={`/profiles/${profile.slug}`} target="_blank">
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs btn-secondary">
                        <ExternalLink size={12} /> View
                      </Button>
                    </Link>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1 text-xs btn-secondary"
                      onClick={() => toggleFeatured(profile._id)}
                    >
                      <Star size={12} /> {profile.isFeatured ? 'Unfeature' : 'Feature'}
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className={`h-8 text-xs ${!profile.isActive ? 'text-green-500 border-green-500/30 hover:bg-green-500/10' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}`}
                      onClick={() => toggleStatus(profile._id)}
                    >
                      {profile.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {profile.verificationStatus !== 'verified' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => approve(profile._id, true)}
                        >
                          <CheckCircle size={12} /> Approve
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-8 gap-1 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => approve(profile._id, false)}
                        >
                          <XCircle size={12} /> Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Edit Form Block */}
                {editingProfileId === profile._id && (
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg mt-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Edit Profile Details</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={editFormData.displayName}
                          onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Slug (URL)</label>
                        <input
                          type="text"
                          value={editFormData.slug}
                          onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Bio / Description</label>
                        <textarea
                          value={editFormData.bio}
                          onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Contact Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white border-none disabled:opacity-50"
                        disabled={savingProfile}
                        onClick={() => handleSaveProfile(profile._id)}
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-8"
                        onClick={() => setEditingProfileId(null)}
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