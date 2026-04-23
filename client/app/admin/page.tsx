// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { Card, CardContent } from '@/components/ui/card';
// import { Users, BookOpen, Star, Clock } from 'lucide-react';
// import api from '@/lib/api';

// export default function AdminPage() {
//   const [stats, setStats] = useState({ users: 0, profiles: 0, pending: 0, reviews: 0 });

//   useEffect(() => {
//     Promise.all([
//       api.get('/admin/users?limit=1'),
//       api.get('/admin/profiles?limit=1'),
//       api.get('/admin/profiles/pending'),
//       api.get('/admin/reviews?limit=1'),
//     ]).then(([u, p, pending, r]) => {
//       setStats({
//         users: u.data.total,
//         profiles: p.data.total,
//         pending: pending.data.data.profiles.length,
//         reviews: r.data.total,
//       });
//     }).catch(() => {});
//   }, []);

//   const cards = [
//     { label: 'Total users', value: stats.users, icon: Users, href: '/admin/users' },
//     { label: 'Total profiles', value: stats.profiles, icon: BookOpen, href: '/admin/profiles' },
//     { label: 'Pending approval', value: stats.pending, icon: Clock, href: '/admin/profiles?filter=pending' },
//     { label: 'Total reviews', value: stats.reviews, icon: Star, href: '/admin/reviews' },
//   ];

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Overview</h1>
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {cards.map(({ label, value, icon: Icon, href }) => (
//           <Link key={label} href={href}>
//             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//               <CardContent className="p-5">
//                 <Icon size={20} className="text-slate-400 mb-3" />
//                 <div className="text-2xl font-bold text-slate-900">{value}</div>
//                 <div className="text-sm text-slate-500 mt-1">{label}</div>
//               </CardContent>
//             </Card>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }




'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, BookOpen, Clock, Star, Loader2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setData(res.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!data) return null;

  const { overview, profilesByType, profilesByDistrict, profilesBySubject } = data;

  const cards = [
    { label: 'Total users', value: overview.users, icon: Users, href: '/admin/users' },
    { label: 'Total profiles', value: overview.profiles, icon: BookOpen, href: '/admin/profiles' },
    { label: 'Pending approval', value: overview.pending, icon: Clock, href: '/admin/profiles?filter=pending' },
    { label: 'Total reviews', value: overview.reviews, icon: Star, href: '/admin/reviews' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
        Admin Overview
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children mb-8">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="admin-stat-card block hover:opacity-90 transition-opacity">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Icon size={17} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children mb-6">
        {/* Profiles by District Pie Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profiles by Place (District)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profilesByDistrict}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {profilesByDistrict.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profiles by Type Bar Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profiles by Type</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profilesByType} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-elevated)' }}
                  contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {profilesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 stagger-children">
        {/* Profiles by Subject Bar Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Top Teaching Subjects & Activities</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profilesBySubject} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-elevated)' }}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {profilesBySubject.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}