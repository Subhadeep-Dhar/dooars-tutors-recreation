'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, BookOpen, Clock, Star, Loader2, ArrowRight, Activity, ShieldAlert, PhoneOff, ImageOff, MapPin } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const COLORS = ['#1a73e8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [chartType, setChartType] = useState('compound'); // 'daily' or 'compound'

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/stats?timeframe=${timeframe}`)
      .then((res) => setData(res.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [timeframe]);

  if (!data && loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!data) return null;

  const { overview, profilesByType, profilesByDistrict, profilesBySubject, recentActivity, health, growth, ratingDistribution, mapData } = data;

  // Calculate Compound Growth
  const compoundGrowthUsers: any[] = [];
  let userSum = 0;
  growth.users.forEach((u: any) => {
    userSum += u.count;
    compoundGrowthUsers.push({ date: u.date, count: userSum });
  });

  // Calculate Scatter Data (Rating vs Reviews) - Includes profiles with 0 reviews
  const scatterData = (mapData || []).map((p: any) => ({
    name: p.displayName,
    rating: p.rating?.average || 0,
    reviews: p.rating?.count || 0,
    type: p.type
  }));

  // Calculate Geographic Silhouette Data (Lng vs Lat)
  const geoMapData = (mapData || [])
    .filter((p: any) => p.location?.coordinates && p.location.coordinates.length === 2)
    .map((p: any) => ({
      name: p.displayName,
      lng: p.location.coordinates[0],
      lat: p.location.coordinates[1],
      type: p.type
    }));

  const cards = [
    { label: 'Total users', value: overview.users, icon: Users, href: '/admin/users' },
    { label: 'Total profiles', value: overview.profiles, icon: BookOpen, href: '/admin/profiles' },
    { label: 'Pending approval', value: overview.pending, icon: Clock, href: '/admin/moderation' },
    { label: 'Total reviews', value: overview.reviews, icon: Star, href: '/admin/reviews' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Admin Overview
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/moderation" className="btn-primary text-sm px-4 py-2">
            Review Pending ({overview.pending})
          </Link>
          <Link href="/admin/profiles" className="btn-secondary text-sm px-4 py-2" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            Manage Profiles
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children mb-8">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="admin-stat-card block hover:opacity-90 transition-opacity p-5 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Icon size={18} style={{ color: 'var(--color-brand)' }} />
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
          </Link>
        ))}
      </div>

      {/* Advanced Analytics Grids - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Growth Area Chart (2/3 width) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm lg:col-span-2 relative">
          {loading && (
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 z-10 flex items-center justify-center rounded-[var(--radius-lg)]">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Growth Tracker</h2>
              <select 
                value={chartType} 
                onChange={(e) => setChartType(e.target.value)}
                className="text-xs bg-transparent border-none outline-none font-semibold cursor-pointer"
                style={{ color: 'var(--color-brand)' }}
              >
                <option value="daily">New vs Time</option>
                <option value="compound">Compound (Cumulative)</option>
              </select>
            </div>
            
            <div className="flex gap-1" style={{ background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button onClick={() => setTimeframe('30d')} className={`text-xs px-3 py-1 rounded-md transition-colors ${timeframe === '30d' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>30 Days</button>
              <button onClick={() => setTimeframe('6m')} className={`text-xs px-3 py-1 rounded-md transition-colors ${timeframe === '6m' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>6 Months</button>
              <button onClick={() => setTimeframe('1y')} className={`text-xs px-3 py-1 rounded-md transition-colors ${timeframe === '1y' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>1 Year</button>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartType === 'daily' ? growth.users : compoundGrowthUsers} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="count" stroke="#1a73e8" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profile Health Metrics (1/3 width) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profile Health</h2>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10">
                <PhoneOff size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{health.missingPhone}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Missing Phone No.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10">
                <ImageOff size={20} className="text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{health.missingImage}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Missing Profile Pic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Silhouette Map & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Silhouette Geographic Map */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Geographic Hotspots (Silhouette)</h2>
            <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -20 }}>
                {/* Lng is X, Lat is Y. Hidden axes to create a pure silhouette map effect */}
                <XAxis type="number" dataKey="lng" name="Longitude" hide domain={[(dataMin: number) => isFinite(dataMin) ? dataMin - 0.02 : 0, (dataMax: number) => isFinite(dataMax) ? dataMax + 0.02 : 100]} />
                <YAxis type="number" dataKey="lat" name="Latitude" hide domain={[(dataMin: number) => isFinite(dataMin) ? dataMin - 0.02 : 0, (dataMax: number) => isFinite(dataMax) ? dataMax + 0.02 : 100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} 
                  formatter={(value, name, props) => props.payload.name}
                />
                <Scatter name="Regions" data={geoMapData} fill="#14b8a6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Abstract map representation based on tutor coordinates.</p>
        </div>

        {/* Recent Profiles Feed */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recently Added</h2>
            <Link href="/admin/profiles" className="text-sm hover:underline" style={{ color: 'var(--color-brand)' }}>View All</Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentActivity.profiles.map((p: any) => (
              <div key={p._id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.displayName}</p>
                  <p className="text-xs mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>{p.type?.replace('_', ' ')} • {p.verificationStatus}</p>
                </div>
                <Link href={`/admin/profiles/${p._id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Performance Clusters & Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Scatter Plot (Clusters) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Performance Clusters (Reviews vs Rating)</h2>
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" dataKey="reviews" name="Total Reviews" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.max(isFinite(dataMax) ? dataMax : 0, 5)]} />
                <YAxis type="number" dataKey="rating" name="Avg Rating" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Scatter name="Profiles" data={scatterData} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Top right cluster indicates best performing profiles.</p>
        </div>

        {/* Rating Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Platform Rating Distribution</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Profiles Data Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children mb-6">
        {/* Profiles by District Pie Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profiles by Place (District)</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={profilesByDistrict} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" nameKey="name" label={false}>
                  {profilesByDistrict.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profiles by Type Bar Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profiles by Type</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profilesByType} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#1a73e8" radius={[0, 4, 4, 0]}>
                  {profilesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profiles by Subject Bar Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Top Subjects</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profilesBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
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