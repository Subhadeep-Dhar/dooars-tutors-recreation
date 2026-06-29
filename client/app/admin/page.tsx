'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, BookOpen, Clock, Star, Loader2, ArrowRight, Activity, ShieldAlert, PhoneOff, ImageOff, MapPin, Award, MessageSquare } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis, LabelList
} from 'recharts';

const COLORS = ['#1a73e8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [chartType, setChartType] = useState('compound'); // 'daily' or 'compound'
  const [leaderboardTab, setLeaderboardTab] = useState('overall'); // 'overall', 'reviewed', 'rated'

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

  const { overview, profilesByType, profilesByDistrict, profilesBySubject, recentActivity, health, growth, ratingDistribution, mapData, performers } = data;

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
      type: p.type,
      town: p.address?.town || 'Unknown'
    }));

  // Calculate Town Centroids for Labels
  const townGroups: Record<string, { lngs: number[], lats: number[] }> = {};
  geoMapData.forEach((p: any) => {
    if (p.town && p.town !== 'Unknown') {
      if (!townGroups[p.town]) townGroups[p.town] = { lngs: [], lats: [] };
      townGroups[p.town].lngs.push(p.lng);
      townGroups[p.town].lats.push(p.lat);
    }
  });

  const townLabelsData = Object.entries(townGroups).map(([town, coords]) => ({
    town,
    lng: coords.lngs.reduce((a, b) => a + b, 0) / coords.lngs.length,
    lat: coords.lats.reduce((a, b) => a + b, 0) / coords.lats.length
  }));

  // Deep Insights Calculations
  const allRatings = scatterData.map((d: any) => d.rating).filter((r: number) => r > 0).sort((a: number, b: number) => a - b);
  const allReviews = scatterData.map((d: any) => d.reviews).sort((a: number, b: number) => a - b);
  
  const getMedian = (arr: number[]) => {
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };
  
  const insights = {
    rating: {
      avg: allRatings.length ? (allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length).toFixed(1) : '0',
      median: getMedian(allRatings),
      min: allRatings.length ? allRatings[0] : 0,
      max: allRatings.length ? allRatings[allRatings.length - 1] : 0
    },
    reviews: {
      avg: allReviews.length ? Math.round(allReviews.reduce((a: number, b: number) => a + b, 0) / allReviews.length) : 0,
      median: getMedian(allReviews),
      max: allReviews.length ? allReviews[allReviews.length - 1] : 0,
    },
    density: {
      topTown: profilesByDistrict.length ? [...profilesByDistrict].sort((a: any, b: any) => b.value - a.value)[0].name : 'N/A'
    }
  };

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
                <option value="compound">Cumulative</option>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Geographic Hotspots</h2>
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (!data.name && data.town) return null; // Don't show tooltip for just the labels if you only want tutor names, or return town
                      return (
                        <div className="p-2 rounded-lg shadow-xl text-xs font-bold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                          {data.name || data.town}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Regions" data={geoMapData} fill="#14b8a6" />
                <Scatter name="Labels" data={townLabelsData} fill="transparent">
                  <LabelList dataKey="town" position="top" style={{ fill: 'var(--text-primary)', fontSize: 10, fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }} />
                </Scatter>
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
                <Link href={`/profiles/${p.slug || p._id}`} target="_blank" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
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

      {/* Row 4: Deep Insights Dashboard */}
      <div className="grid grid-cols-1 mb-6">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Activity size={16} /> Deep Statistical Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Ratings (Active)</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{insights.rating.avg}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>avg</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Min: {insights.rating.min}</span>
                <span>Max: {insights.rating.max}</span>
                <span>Med: {insights.rating.median}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Reviews per Profile</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{insights.reviews.avg}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>avg</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Peak (Max): {insights.reviews.max}</span>
                <span>Median: {insights.reviews.median}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Geographic Density</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }} title={insights.density.topTown}>{insights.density.topTown}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Top District / Town</p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Data Health</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{scatterData.filter((d: any) => d.reviews > 0).length}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>profiles</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Profiles with at least 1 review</p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Row 5: Profiles Data Breakdowns */}
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
          <div className="h-[250px] w-full" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ height: Math.max(250, (profilesBySubject?.length || 0) * 35) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profilesBySubject} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={90} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
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

      {/* Row 6: Platform Leaderboard */}
      <div className="grid grid-cols-1 mb-6">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} className="p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Award size={16} className="text-amber-500" /> Platform Leaderboard & Top Performers
            </h2>
            <div className="flex gap-1" style={{ background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button onClick={() => setLeaderboardTab('overall')} className={`text-xs px-3 py-1 rounded-md transition-colors ${leaderboardTab === 'overall' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Tutor of the Year</button>
              <button onClick={() => setLeaderboardTab('reviewed')} className={`text-xs px-3 py-1 rounded-md transition-colors ${leaderboardTab === 'reviewed' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Most Reviewed</button>
              <button onClick={() => setLeaderboardTab('rated')} className={`text-xs px-3 py-1 rounded-md transition-colors ${leaderboardTab === 'rated' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Top Rated</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(leaderboardTab === 'overall' ? performers?.leaderboard : leaderboardTab === 'reviewed' ? performers?.mostReviewed : performers?.topRated)?.map((tutor: any, index: number) => (
              <Link href={`/profiles/${tutor.slug || tutor._id}`} key={tutor._id} className="p-4 rounded-xl flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-md relative" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                {index === 0 && <div className="absolute -top-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm shadow-amber-500/20 whitespace-nowrap">#1 {leaderboardTab === 'overall' ? 'OVERALL' : leaderboardTab === 'reviewed' ? 'REVIEWED' : 'RATED'}</div>}
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center font-bold text-xl" style={{ background: 'var(--bg-card)', color: 'var(--color-brand)', border: '1px solid var(--border)' }}>
                  {index + 1}
                </div>
                <h3 className="font-semibold text-sm line-clamp-1 mb-1" style={{ color: 'var(--text-primary)' }} title={tutor.displayName}>{tutor.displayName}</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{tutor.town || 'Dooars Area'}</p>
                
                <div className="w-full flex justify-between items-center text-xs px-2 py-1.5 rounded-lg mt-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {leaderboardTab === 'overall' ? (
                    <>
                      <span className="font-medium">Score</span>
                      <span className="font-bold text-emerald-500">{tutor.adminScore}</span>
                    </>
                  ) : leaderboardTab === 'reviewed' ? (
                    <>
                      <span className="font-medium flex items-center gap-1"><MessageSquare size={10} /> Reviews</span>
                      <span className="font-bold">{tutor.rating?.count || 0}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium flex items-center gap-1"><Star size={10} /> Rating</span>
                      <span className="font-bold">{tutor.rating?.average || 0}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}