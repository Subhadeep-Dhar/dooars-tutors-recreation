'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ModerationPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    lowConfidence: false,
    missingPhone: false,
    enrichmentFailed: false
  });
  
  const [page, setPage] = useState(1);
  const limit = 10;

  async function load() {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: filters.status,
        lowConfidence: filters.lowConfidence.toString(),
        missingPhone: filters.missingPhone.toString(),
        enrichmentFailed: filters.enrichmentFailed.toString()
      });
      const res = await api.get(`/admin/moderation-queue?${query}`);
      setProfiles(res.data.data?.profiles || []);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters, page]);

  async function action(id: string, type: 'approve' | 'reject') {
    try {
      await api.post(`/admin/profiles/${id}/${type}`);
      toast.success(`Profile ${type}d`);
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Moderation Queue</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Review and verify imported listings ({total} pending)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="btn-secondary h-8 gap-2" onClick={load}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select 
              className="w-full h-9 bg-transparent rounded-lg border px-3 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            >
              <option value="pending" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Pending</option>
              <option value="verified" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Verified</option>
              <option value="rejected" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Rejected</option>
            </select>
          </div>
          <div className="flex gap-4 mb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={filters.lowConfidence} 
                onChange={(e) => { setFilters(f => ({ ...f, lowConfidence: e.target.checked })); setPage(1); }}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Low Confidence</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={filters.enrichmentFailed} 
                onChange={(e) => { setFilters(f => ({ ...f, enrichmentFailed: e.target.checked })); setPage(1); }}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Enrichment Failed</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <div className="space-y-3">
        {loading && profiles.length === 0 ? (
          <div className="py-20 text-center animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-dashed flex flex-col items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-gray-400" />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Queue empty</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No profiles match the current filters.</p>
          </div>
        ) : profiles.map((profile) => (
          <Card key={profile._id} className="group overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {profile.displayName?.charAt(0) || 'P'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{profile.displayName}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 h-4 uppercase">{profile.type.replace('_', ' ')}</Badge>
                      {profile.enrichmentJob?.status === 'failed' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] h-4 gap-1">
                          <AlertTriangle size={10} /> AI FAILED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>{profile.address?.town}, {profile.address?.district}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>Batch: <span className="font-mono">{profile.importBatchId || 'manual'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stats / Confidence */}
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Confidence</p>
                      <p className={`font-mono text-sm font-bold ${
                        (profile.extractionConfidence?.subjects || 0) < 0.65 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {profile.extractionConfidence?.subjects 
                          ? `${Math.round(profile.extractionConfidence.subjects * 100)}%`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Enriched</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {profile.autoExtracted ? 'YES' : 'NO'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/moderation/${profile._id}`}>
                      <Button size="sm" variant="outline" className="h-9 gap-2 btn-secondary px-4">
                        Review
                      </Button>
                    </Link>
                    <div className="flex items-center gap-1 border-l pl-2 ml-1" style={{ borderColor: 'var(--border)' }}>
                      <Button 
                        size="sm" 
                        className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 shadow-md"
                        onClick={() => action(profile._id, 'approve')}
                      >
                        <CheckCircle size={18} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-9 w-9 p-0 text-red-500 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => action(profile._id, 'reject')}
                      >
                        <XCircle size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {Math.ceil(total / limit) > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="text-sm font-medium px-2" style={{ color: 'var(--text-primary)' }}>
              Page {page} of {Math.ceil(total / limit)}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="btn-secondary"
              disabled={page === Math.ceil(total / limit)}
              onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
