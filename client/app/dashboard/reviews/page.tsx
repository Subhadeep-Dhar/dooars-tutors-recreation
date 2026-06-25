'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/me')
      .then((res) => {
        setReviews(res.data?.data?.reviews || []);
      })
      .catch((err) => {
        console.error('Failed to load reviews', err);
        toast.error('Failed to load reviews');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading your reviews...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your Reviews</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          See what students are saying about you. To protect student privacy, reviews are strictly anonymous.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any reviews yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review._id} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-md">
                    <span className="font-bold text-amber-600 dark:text-amber-500">{review.rating.toFixed(1)}</span>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: 'var(--text-primary)' }} className="italic">"{review.text}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
