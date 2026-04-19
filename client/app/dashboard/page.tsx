'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => setProfile(res.data.data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {!loading && !profile && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">No profile yet</p>
                <p className="text-sm text-amber-600">Create your profile to appear in search results</p>
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button size="sm">Create Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {profile && (
        <>
          {/* Status */}
          <Card className="mb-6">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.isApproved ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <Clock size={20} className="text-amber-500" />
                )}
                <div>
                  <p className="font-medium">
                    {profile.isApproved ? 'Profile approved & live' : 'Pending admin approval'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {profile.isApproved
                      ? 'Your profile is visible in search results'
                      : 'You will be notified once approved'}
                  </p>
                </div>
              </div>
              <Link href={`/profiles/${profile.slug}`} target="_blank">
                <Button variant="outline" size="sm">View Public Profile</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star size={20} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="text-2xl font-bold">{profile.rating?.average ?? 0}</div>
                <div className="text-sm text-slate-500">Average rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold">{profile.rating?.count ?? 0}</div>
                <div className="text-sm text-slate-500">Total reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen size={20} className="text-slate-400" />
                </div>
                <div className="text-2xl font-bold">{profile.teachingSlots?.length ?? 0}</div>
                <div className="text-sm text-slate-500">Teaching slots</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
              <Link href="/dashboard/slots">
                <Button variant="outline" size="sm">Manage Slots</Button>
              </Link>
              <Link href="/dashboard/media">
                <Button variant="outline" size="sm">Upload Media</Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}