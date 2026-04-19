'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Star, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, profiles: 0, pending: 0, reviews: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/admin/users?limit=1'),
      api.get('/admin/profiles?limit=1'),
      api.get('/admin/profiles/pending'),
      api.get('/admin/reviews?limit=1'),
    ]).then(([u, p, pending, r]) => {
      setStats({
        users: u.data.total,
        profiles: p.data.total,
        pending: pending.data.data.profiles.length,
        reviews: r.data.total,
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total users', value: stats.users, icon: Users, href: '/admin/users' },
    { label: 'Total profiles', value: stats.profiles, icon: BookOpen, href: '/admin/profiles' },
    { label: 'Pending approval', value: stats.pending, icon: Clock, href: '/admin/profiles?filter=pending' },
    { label: 'Total reviews', value: stats.reviews, icon: Star, href: '/admin/reviews' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <Icon size={20} className="text-slate-400 mb-3" />
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}