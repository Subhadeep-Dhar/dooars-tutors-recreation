'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/admin/reviews?limit=50');
      setReviews(res.data.reviews);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleVisibility(id: string) {
    try {
      await api.patch(`/admin/reviews/${id}/visibility`);
      toast.success('Review visibility updated');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reviews ({total})</h1>
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{review.reviewerId?.name ?? 'Student'}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {review.isVisible
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Visible</Badge>
                      : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Hidden</Badge>}
                  </div>
                  <p className="text-sm text-slate-600">{review.text}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    On: {(review.profileId as any)?.displayName ?? review.profileId}
                  </p>
                </div>
                <Button
                  size="sm" variant="outline"
                  className="h-8 gap-1 text-xs shrink-0"
                  onClick={() => toggleVisibility(review._id)}
                >
                  {review.isVisible ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}