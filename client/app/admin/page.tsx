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
import { Users, BookOpen, Clock, Star } from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, profiles: 0, pending: 0, reviews: 0 });

  useEffect(() => {
    // ✅ Restored: original 4 separate API calls that are known to work
    Promise.all([
      api.get('/admin/users?limit=1'),
      api.get('/admin/profiles?limit=1'),
      api.get('/admin/profiles/pending'),
      api.get('/admin/reviews?limit=1'),
    ])
      .then(([u, p, pending, r]) => {
        setStats({
          users:    u.data.total,
          profiles: p.data.total,
          pending:  pending.data.data.profiles.length,
          reviews:  r.data.total,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total users',      value: stats.users,    icon: Users,    href: '/admin/users' },
    { label: 'Total profiles',   value: stats.profiles, icon: BookOpen, href: '/admin/profiles' },
    { label: 'Pending approval', value: stats.pending,  icon: Clock,    href: '/admin/profiles?filter=pending' },
    { label: 'Total reviews',    value: stats.reviews,  icon: Star,     href: '/admin/reviews' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
        Admin Overview
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {cards.map(({ label, value, icon: Icon, href }) => (
          // ✅ Restored: each card is a clickable Link (was lost in new design)
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
    </div>
  );
}