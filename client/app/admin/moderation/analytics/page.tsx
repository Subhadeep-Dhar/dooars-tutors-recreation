'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setData(res.data.data || null);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading && !data) return <div className="p-20 text-center animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>;
  if (!data) return <div className="p-20 text-center" style={{ color: 'var(--text-muted)' }}>No analytics data available.</div>;

  const moderation = data.moderation || {};
  const enrichment = data.enrichment || {};
  const confidence = data.confidence || {};
  const topFailedSearches = data.topFailedSearches || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="btn-secondary h-8 w-8 p-0" onClick={() => router.back()}>
            <ArrowLeft size={14} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Moderation Insights</h1>
        </div>
        <Button variant="outline" size="sm" className="btn-secondary h-8 gap-2" onClick={load}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Pending Queue" 
          value={moderation.pending || 0} 
          icon={<TrendingUp className="text-amber-500" size={18} />}
          description="Awaiting review"
        />
        <MetricCard 
          title="Verified Profiles" 
          value={moderation.verified || 0} 
          icon={<CheckCircle className="text-green-500" size={18} />}
          description="Live on platform"
        />
        <MetricCard 
          title="Enrichment Failures" 
          value={enrichment.failed || 0} 
          icon={<AlertTriangle className="text-red-500" size={18} />}
          description="AI parsing errors"
        />
        <MetricCard 
          title="Rejected Profiles" 
          value={moderation.rejected || 0} 
          icon={<XCircle className="text-gray-400" size={18} />}
          description="Spam or duplicates"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confidence Distribution */}
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" /> Confidence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <DistributionBar label="High (>80%)" count={confidence.High || 0} total={Object.values(confidence).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number} color="bg-green-500" />
              <DistributionBar label="Medium (65-80%)" count={confidence.Medium || 0} total={Object.values(confidence).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number} color="bg-amber-500" />
              <DistributionBar label="Low (<65%)" count={confidence.Low || 0} total={Object.values(confidence).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Failed Searches */}
        <Card className="lg:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Search size={16} className="text-primary" /> Top Zero-Result Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFailedSearches.length > 0 ? (
              <div className="space-y-2">
                {topFailedSearches.map((s: any) => (
                  <div key={s.term} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
                    <span className="text-sm font-medium">{s.term}</span>
                    <Badge variant="secondary" className="text-[10px]">{s.count} failed attempts</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>No failed searches recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: any) {
  return (
    <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionBar({ label, count, total, color }: any) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span>{count} ({percentage}%)</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
