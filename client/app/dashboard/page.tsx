'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  let completeness = 0;
  if (profile) {
    completeness += 20; // Base creation
    if (profile.bio) completeness += 20;
    if (profile.tagline) completeness += 10;
    if (profile.teachingSlots && profile.teachingSlots.length > 0) completeness += 20;
    if (profile.experience) completeness += 10;
    if (profile.languages && profile.languages.length > 0) completeness += 10;
    if (profile.media && profile.media.length > 0) completeness += 10;
  }

  const slotData = profile?.teachingSlots?.map((s: any) => ({
    name: s.subject || s.activity,
    fee: s.feePerMonth || 0,
  })) || [];

 
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      )}

      {!loading && !profile && (
        <Card className="mb-6" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-500" />
              <div>
                <p className="font-medium text-amber-500">No profile yet</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create your profile to appear in search results</p>
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
          <Card className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.isApproved ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <Clock size={20} className="text-amber-500" />
                )}
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {profile.isApproved ? 'Profile approved & live' : 'Pending admin approval'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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

          {/* Profile Completeness */}
          <Card className="mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardContent className="p-5">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile Completeness</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>A complete profile attracts more students</p>
                </div>
                <div className="text-xl font-bold" style={{ color: 'var(--gradient-to)' }}>{completeness}%</div>
              </div>
              <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div 
                  className={`h-2.5 rounded-full ${completeness === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${completeness}%`, transition: 'width 0.5s ease-in-out' }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardContent className="p-5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-2">
                  <Star size={20} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.rating?.average ?? 0}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Average rating</div>
              </CardContent>
            </Card>
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardContent className="p-5 text-center flex flex-col items-center justify-center">
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{profile.rating?.count ?? 0}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total reviews</div>
              </CardContent>
            </Card>
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardContent className="p-5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen size={20} className="text-indigo-400" />
                </div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.teachingSlots?.length ?? 0}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Teaching slots</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Quick actions */}
            <Card className="col-span-1">
              <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Link href="/dashboard/profile" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-start">Edit Profile Details</Button>
                </Link>
                <Link href="/dashboard/slots" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-start">Manage Teaching Slots</Button>
                </Link>
                <Link href="/dashboard/media" className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-start">Upload Media Gallery</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Teaching Slots Chart */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader><CardTitle className="text-base">Fees per Subject/Activity (₹/mo)</CardTitle></CardHeader>
              <CardContent>
                {slotData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={slotData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'var(--bg-elevated)' }}
                          contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                          formatter={(value) => [`₹${value}`, 'Fee']}
                        />
                        <Bar dataKey="fee" radius={[4, 4, 0, 0]}>
                          {slotData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                    Add teaching slots to see your fee distribution
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}