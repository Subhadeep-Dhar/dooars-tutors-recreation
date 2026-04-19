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
      setProfiles(res.data.profiles);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string, approved: boolean) {
    try {
      await api.patch(`/admin/profiles/${id}/approve`, { approved });
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

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Profiles ({total})</h1>
      <div className="space-y-3">
        {profiles.map((profile) => (
          <Card key={profile._id}>
            <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold">
                  {profile.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{profile.displayName}</span>
                    <Badge variant="outline" className="text-xs">{profile.type}</Badge>
                    {profile.isApproved
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Approved</Badge>
                      : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Pending</Badge>}
                    {profile.isFeatured && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Featured</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{profile.address?.town}, {profile.address?.district}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profiles/${profile.slug}`} target="_blank">
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                    <ExternalLink size={12} /> View
                  </Button>
                </Link>
                <Button
                  size="sm" variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={() => toggleFeatured(profile._id)}
                >
                  <Star size={12} /> {profile.isFeatured ? 'Unfeature' : 'Feature'}
                </Button>
                {!profile.isApproved ? (
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
                    className="h-8 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
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