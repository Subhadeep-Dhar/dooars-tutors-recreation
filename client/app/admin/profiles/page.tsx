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

  async function load() {
    try {
      const res = await api.get('/admin/profiles?limit=50');
      setProfiles(res.data.data?.profiles || []);
      setTotal(res.data.data?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string, approved: boolean) {
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

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Profiles ({total})</h1>
      <div className="space-y-3">
        {profiles.map((profile) => (
          <Card key={profile._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
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
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{profile.address?.town || 'No Town'}, {profile.address?.district || 'No District'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
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
                {profile.verificationStatus !== 'verified' ? (
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => approve(profile._id, true)}
                  >
                    <CheckCircle size={12} /> Approve
                  </Button>
                ) : (
                  <Button
                    size="sm" variant="outline"
                    className="h-8 gap-1 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => approve(profile._id, false)}
                  >
                    <XCircle size={12} /> Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}