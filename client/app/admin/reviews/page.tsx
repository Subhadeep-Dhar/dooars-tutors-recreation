'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sort, setSort] = useState('latest');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reviews?page=${page}&limit=${limit}&sort=${sort}`);
      setReviews(res.data.data?.reviews || []);
      setTotal(res.data.data?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, sort]);

  async function toggleVisibility(id: string) {
    try {
      await api.patch(`/admin/reviews/${id}/visibility`);
      toast.success('Review visibility updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reviews ({total})</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sort by:</span>
          <select 
            className="border rounded-md px-3 py-1.5 text-sm"
            style={{ 
              borderColor: 'var(--border)', 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="best">Best Rating</option>
            <option value="worst">Worst Rating</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : reviews.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No reviews found.</div>
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{review.reviewerId?.name ?? 'Student'}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(5, Math.max(0, review.rating || 0)) }).map((_, i) => (
                            <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        {review.isVisible
                          ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Visible</Badge>
                          : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Hidden</Badge>}
                      </div>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{review.text}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        On: {(review.profileId as any)?.displayName ?? review.profileId}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1 text-xs shrink-0 btn-secondary"
                      onClick={() => toggleVisibility(review._id)}
                    >
                      {review.isVisible ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
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
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}