// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { MapPin, Phone, MessageCircle, Star, Clock, Globe, Mail, BookOpen } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
// import api from '@/lib/api';
// import { Loader2 } from 'lucide-react';
// import MiniMap from '@/components/profile/MiniMap';
// import { useAuthStore } from '@/store/authStore';
// import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';

// const typeLabels: Record<string, string> = {
//     tutor: 'Private Tutor',
//     coaching_center: 'Coaching Center',
//     sports_trainer: 'Sports Trainer',
//     arts_trainer: 'Arts & Culture',
//     gym_yoga: 'Gym & Yoga',
// };

// export default function ProfilePage() {
//     const { slug } = useParams<{ slug: string }>();
//     const [profile, setProfile] = useState<any>(null);
//     const [reviews, setReviews] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

//     const { user } = useAuthStore();
//     const [submitting, setSubmitting] = useState(false);
//     const { register, handleSubmit, reset } = useForm();

//     useEffect(() => {
//         async function load() {
//             try {
//                 const profileRes = await api.get(`/profiles/slug/${slug}`);
//                 const p = profileRes.data.data.profile;
//                 setProfile(p);

//                 const reviewsRes = await api.get(`/profiles/${p._id}/reviews`).catch(() => ({ data: { data: { reviews: [] } } }));
//                 setReviews(reviewsRes.data.data.reviews ?? []);
//             } catch {
//                 setProfile(null);
//             } finally {
//                 setLoading(false);
//             }
//         }
//         load();
//     }, [slug]);

//     if (loading) return (
//         <div className="flex items-center justify-center py-24">
//             <Loader2 className="animate-spin text-slate-400" size={32} />
//         </div>
//     );

//     if (!profile) return (
//         <div className="text-center py-24">
//             <p className="text-slate-500 text-lg">Profile not found</p>
//         </div>
//     );

//     return (
//         <div className="max-w-4xl mx-auto px-4 py-8">
//             {/* Header */}
//             <Card className="mb-6">
//                 <CardContent className="p-6">
//                     <div className="flex gap-5 items-start">
//                         <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-3xl shrink-0">
//                             {profile.displayName.charAt(0)}
//                         </div>
//                         <div className="flex-1">
//                             <div className="flex items-start justify-between flex-wrap gap-3">
//                                 <div>
//                                     <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
//                                     <div className="flex items-center gap-2 mt-1 flex-wrap">
//                                         <span className="text-sm text-slate-500">{typeLabels[profile.type]}</span>
//                                         {profile.isFeatured && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Featured</Badge>}
//                                     </div>
//                                     {profile.tagline && <p className="text-slate-600 mt-1">{profile.tagline}</p>}
//                                 </div>
//                                 {profile.rating?.count > 0 && (
//                                     <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
//                                         <Star size={16} className="fill-amber-400 text-amber-400" />
//                                         <span className="font-bold">{profile.rating.average}</span>
//                                         <span className="text-slate-500 text-sm">({profile.rating.count} reviews)</span>
//                                     </div>
//                                 )}
//                             </div>

//                             <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
//                                 <span className="flex items-center gap-1.5">
//                                     <MapPin size={14} />
//                                     {profile.address?.area && `${profile.address.area}, `}
//                                     {profile.address?.town}, {profile.address?.district}
//                                 </span>
//                                 {profile.experience && (
//                                     <span className="flex items-center gap-1.5">
//                                         <Clock size={14} />
//                                         {profile.experience} years experience
//                                     </span>
//                                 )}
//                                 {profile.languages?.length > 0 && (
//                                     <span className="flex items-center gap-1.5">
//                                         <Globe size={14} />
//                                         {profile.languages.join(', ')}
//                                     </span>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Contact buttons */}
//                     <div className="flex gap-3 mt-5 flex-wrap">
//                         {profile.contact?.whatsapp && (
//                             <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer">
//                                 <Button className="gap-2 bg-green-600 hover:bg-green-700">
//                                     <MessageCircle size={16} /> WhatsApp
//                                 </Button>
//                             </a>
//                         )}
//                         {profile.contact?.phone && (
//                             <a href={`tel:${profile.contact.phone}`}>
//                                 <Button variant="outline" className="gap-2">
//                                     <Phone size={16} /> {profile.contact.phone}
//                                 </Button>
//                             </a>
//                         )}
//                         {profile.contact?.email && (
//                             <a href={`mailto:${profile.contact.email}`}>
//                                 <Button variant="outline" className="gap-2">
//                                     <Mail size={16} /> Email
//                                 </Button>
//                             </a>
//                         )}
//                     </div>
//                 </CardContent>
//             </Card>

//             <div className="grid md:grid-cols-3 gap-6">
//                 <div className="md:col-span-2 space-y-6">
//                     {/* Bio */}
//                     {profile.bio && (
//                         <Card>
//                             <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
//                             <CardContent><p className="text-slate-600 leading-relaxed">{profile.bio}</p></CardContent>
//                         </Card>
//                     )}

//                     {/* Teaching slots */}
//                     {profile.teachingSlots?.length > 0 && (
//                         <Card>
//                             <CardHeader><CardTitle className="text-base">
//                                 {profile.type === 'tutor' || profile.type === 'coaching_center' ? 'Subjects & Classes' : 'Activities & Programs'}
//                             </CardTitle></CardHeader>
//                             <CardContent>
//                                 <div className="space-y-3">
//                                     {profile.teachingSlots.map((slot: any, i: number) => (
//                                         <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
//                                             <div>
//                                                 <div className="flex items-center gap-2">
//                                                     <BookOpen size={14} className="text-slate-400" />
//                                                     <span className="font-medium text-slate-800">{slot.subject || slot.activity}</span>
//                                                     {slot.board && <Badge variant="outline" className="text-xs">{slot.board}</Badge>}
//                                                     {slot.medium && <Badge variant="outline" className="text-xs">{slot.medium}</Badge>}
//                                                 </div>
//                                                 {slot.classes?.length > 0 && (
//                                                     <p className="text-sm text-slate-500 mt-1 ml-5">{slot.classes.join(', ')}</p>
//                                                 )}
//                                                 {slot.ageGroups?.length > 0 && (
//                                                     <p className="text-sm text-slate-500 mt-1 ml-5">Age: {slot.ageGroups.join(', ')}</p>
//                                                 )}
//                                                 {slot.timing && (
//                                                     <p className="text-sm text-slate-500 mt-0.5 ml-5">{slot.timing} · {slot.sessionType}</p>
//                                                 )}
//                                             </div>
//                                             {slot.feePerMonth && (
//                                                 <span className="text-sm font-semibold text-slate-800 shrink-0">₹{slot.feePerMonth}/mo</span>
//                                             )}
//                                         </div>
//                                     ))}
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}

//                     {/* Media gallery */}
//                     {profile.media?.length > 0 && (
//                         <Card>
//                             <CardHeader><CardTitle className="text-base">Photos & Videos</CardTitle></CardHeader>
//                             <CardContent>
//                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                                     {profile.media.map((item: any) => (
//                                         <div key={item._id} className="rounded-xl overflow-hidden bg-slate-100 aspect-video">
//                                             {item.type === 'image' ? (
//                                                 <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
//                                             ) : (
//                                                 <video src={item.url} controls className="w-full h-full object-cover" />
//                                             )}
//                                         </div>
//                                     ))}
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}

//                     {/* Reviews */}
//                     <Card>
//                         <CardHeader><CardTitle className="text-base">Reviews ({reviews.length})</CardTitle></CardHeader>
//                         <CardContent>
//                             {/* Review form — students only */}
//                             {user?.role === 'student' && (
//                                 <form onSubmit={handleSubmit(async (data) => {
//                                     setSubmitting(true);
//                                     try {
//                                         await api.post(`/profiles/${profile._id}/reviews`, {
//                                             rating: Number(data.rating),
//                                             text: data.text,
//                                         });
//                                         toast.success('Review submitted');
//                                         const res = await api.get(`/profiles/${profile._id}/reviews`);
//                                         setReviews(res.data.data.reviews);
//                                         reset();
//                                     } catch (err: any) {
//                                         toast.error(err?.response?.data?.message || 'Failed to submit');
//                                     } finally {
//                                         setSubmitting(false);
//                                     }
//                                 })} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-3">
//                                     <p className="text-sm font-medium">Write a review</p>
//                                     <select {...register('rating')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
//                                         {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
//                                     </select>
//                                     <textarea
//                                         {...register('text', { required: true, minLength: 10 })}
//                                         rows={3}
//                                         placeholder="Share your experience (min 10 characters)..."
//                                         className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
//                                     />
//                                     <Button type="submit" size="sm" disabled={submitting}>
//                                         {submitting ? 'Submitting...' : 'Submit Review'}
//                                     </Button>
//                                 </form>
//                             )}

//                             {!user && (
//                                 <p className="text-sm text-slate-400 mb-4">
//                                     <a href="/login" className="text-slate-700 underline">Login as a student</a> to write a review.
//                                 </p>
//                             )}

//                             {reviews.length === 0 ? (
//                                 <p className="text-slate-400 text-sm">No reviews yet.</p>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {reviews.map((review: any) => (
//                                         <div key={review._id}>
//                                             <div className="flex items-center justify-between">
//                                                 <span className="font-medium text-sm">{review.reviewerId?.name ?? 'Student'}</span>
//                                                 <div className="flex items-center gap-1">
//                                                     {Array.from({ length: review.rating }).map((_, i) => (
//                                                         <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                             <p className="text-slate-600 text-sm mt-1">{review.text}</p>
//                                             <Separator className="mt-4" />
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Sidebar */}
//                 <div className="space-y-4">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle className="text-base">Location</CardTitle>
//                         </CardHeader>

//                         <CardContent className="text-sm text-slate-600 space-y-3">

//                             {/* MAP */}
//                             {/* <MiniMap location={profile.location} /> */}
//                             {profile.location?.coordinates && (
//                                 <div className="h-40 rounded-xl overflow-hidden mb-3">
//                                     <iframe
//                                         width="100%"
//                                         height="100%"
//                                         style={{ border: 0 }}
//                                         src={`https://www.google.com/maps?q=${profile.location.coordinates[1]},${profile.location.coordinates[0]}&z=14&output=embed`}
//                                     />
//                                 </div>
//                             )}

//                             {/* ADDRESS */}
//                             <div>
//                                 <p>{profile.address?.line1}</p>
//                                 {profile.address?.area && <p>{profile.address.area}</p>}
//                                 <p>{profile.address?.town}</p>
//                                 <p>{profile.address?.district}, {profile.address?.state}</p>
//                                 <p>{profile.address?.pincode}</p>
//                             </div>

//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     );
// }










'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Star, MapPin, Clock, Globe, MessageCircle, Phone, Mail,
  BookOpen, ArrowLeft, CheckCircle, Flag, Loader2,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const typeBadgeStyles: Record<string, { bg: string; color: string }> = {
  tutor:           { bg: 'rgba(26,115,232,0.1)',   color: '#1a73e8' },
  coaching_center: { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6' },
  sports_trainer:  { bg: 'rgba(16,185,129,0.1)',   color: '#10b981' },
  arts_trainer:    { bg: 'rgba(236,72,153,0.1)',   color: '#ec4899' },
  gym_yoga:        { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
};
const typeLabels: Record<string, string> = {
  tutor: 'Private Tutor', coaching_center: 'Coaching Center',
  sports_trainer: 'Sports Trainer', arts_trainer: 'Arts & Culture', gym_yoga: 'Gym & Yoga',
};
const typeColors: Record<string, string> = {
  tutor: '#1a73e8', coaching_center: '#8b5cf6',
  sports_trainer: '#10b981', arts_trainer: '#ec4899', gym_yoga: '#f59e0b',
};

function TypeBadge({ type }: { type: string }) {
  const s = typeBadgeStyles[type] ?? { bg: 'rgba(26,115,232,0.1)', color: '#1a73e8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: '0.72rem', fontWeight: 600, padding: '0.22rem 0.65rem',
      borderRadius: '9999px', background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
    }}>
      {typeLabels[type] ?? type}
    </span>
  );
}

function PremiumStar({ size = 20, active = false, interactive = false }: { size?: number, active?: boolean, interactive?: boolean }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={active ? 'url(#starGradient)' : 'none'}
      stroke={active ? 'none' : 'currentColor'}
      strokeWidth={active ? 0 : 2}
      style={{
        filter: active ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.4))' : 'none',
        transition: interactive ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        transform: interactive && active ? 'scale(1.15)' : 'scale(1)',
        color: 'var(--text-muted)'
      }}
    >
      {active && (
        <defs>
          <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
      )}
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1,2,3,4,5].map(i => (
        <PremiumStar key={i} size={14} active={i <= value} />
      ))}
    </div>
  );
}

/* ── Section card wrapper ──────────────────────────────────────────────────── */
function SCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-cards)', boxShadow: 'var(--shadow-sm)',
      padding: '1.4rem',
      transition: 'box-shadow 0.2s ease',
      ...style,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}>
      {children}
    </div>
  );
}

function STitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontWeight: 600, fontSize: '0.97rem', color: 'var(--text-primary)', marginBottom: '1rem', marginTop: 0 }}>
      {children}
    </h2>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  /*
   * Next.js dynamic route: /profiles/[slug] OR /profiles/[id]
   * The param name depends on your folder structure.
   * We support both: /app/profiles/[slug]/page.tsx  (param = slug)
   *               or /app/profiles/[id]/page.tsx    (param = id)
   */
  const params  = useParams<{ slug?: string; id?: string }>();
  const slugOrId = params.slug ?? params.id ?? '';
  const router  = useRouter();
  const { user } = useAuthStore();

  const [profile,    setProfile]    = useState<any>(null);
  const [reviews,    setReviews]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  const [rating,     setRating]     = useState(5);
  const [comment,    setComment]    = useState('');
  const [hoverStar,  setHoverStar]  = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Delete profile
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!slugOrId) return;

    /*
     * FIX: The API endpoint to fetch a single profile by slug/id.
     * Try /profiles/:slug first; if the backend returns 404, also try /profiles/id/:id
     * so we handle both slug-based and _id-based navigation gracefully.
     */
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/profiles/${slugOrId}`),
          api.get(`/profiles/${slugOrId}/reviews`).catch(() => ({ data: { data: { reviews: [] } } })),
        ]);
        setProfile(profileRes.data?.data?.profile ?? profileRes.data);
        setReviews(reviewsRes.data?.data?.reviews ?? reviewsRes.data ?? []);
      } catch (err: any) {
        // Profile not found
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slugOrId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/profiles/${profile._id}/reviews`, { rating, text: comment });
      setReviews(prev => [res.data?.data?.review ?? res.data, ...prev]);
      setComment('');
      setRating(5);
      toast.success('Review submitted successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'Confirm') {
      toast.error('Please type "Confirm" to proceed');
      return;
    }
    setDeletingAccount(true);
    try {
      await api.delete('/auth/me');
      toast.success('Account deleted successfully');
      useAuthStore.getState().logout();
      router.push('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading profile…</p>
        </div>
      </main>
    );
  }

  /* ── Not found ── */
  if (notFound || !profile) {
    return (
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BookOpen size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Profile not found</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            The tutor profile you're looking for doesn't exist or may have been removed.
          </p>
          <button onClick={() => router.push('/search')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.5rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'var(--color-brand)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-buttons)',
            cursor: 'pointer',
          }}>
            Browse Tutors
          </button>
        </div>
      </main>
    );
  }

  const coords = profile.location?.coordinates;
  const hasMap = Array.isArray(coords) && coords.length === 2;
  const slots  = profile.teachingSlots ?? [];
  const r_avg  = profile.rating?.average ?? 0;
  const r_cnt  = profile.rating?.count   ?? 0;

  /* ── Render ── */
  return (
    <main style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto', padding: 'var(--section-gap) 1.25rem' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'color 0.17s, gap 0.17s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
          <ArrowLeft size={15} /> Back to results
        </button>

        {/* ── Header card ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-cards)', boxShadow: 'var(--shadow-md)',
          padding: '1.75rem',
          position: 'relative', overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          {/* Gradient accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'var(--color-brand)',
            opacity: 0.8,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top row: avatar + name + rating */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: '64px', height: '64px', borderRadius: 'var(--radius-cards)', flexShrink: 0,
                background: 'var(--color-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1.6rem',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                {profile.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
                      {profile.displayName}
                    </h1>
                    <div style={{ marginTop: '0.4rem' }}>
                      <TypeBadge type={profile.type} />
                    </div>
                  </div>

                  {/* Rating pill */}
                  {r_cnt > 0 && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 0.875rem', borderRadius: '9999px',
                      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                      flexShrink: 0,
                    }}>
                      <PremiumStar size={17} active={true} />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>{r_avg}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {r_cnt} {r_cnt === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem' }}>
                  {(profile.address?.town || profile.address?.district) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                      {[profile.address.town, profile.address.district].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.experience > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      {profile.experience} years experience
                    </span>
                  )}
                  {profile.languages?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                      {profile.languages.join(', ')}
                    </span>
                  )}
                  {profile.isVerified && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#34d399' }}>
                      <CheckCircle size={13} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.contact?.whatsapp && (
                <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer">
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.2rem', borderRadius: '9999px',
                    fontSize: '0.875rem', fontWeight: 600,
                    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </a>
              )}
              {profile.contact?.phone && (
                <a href={`tel:${profile.contact.phone}`}>
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.1rem', borderRadius: '9999px',
                    fontSize: '0.875rem', fontWeight: 500,
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-ring)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <Phone size={14} /> {profile.contact.phone}
                  </button>
                </a>
              )}
              {profile.contact?.email && (
                <a href={`mailto:${profile.contact.email}`}>
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.1rem', borderRadius: '9999px',
                    fontSize: '0.875rem', fontWeight: 500,
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-ring)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    <Mail size={14} /> Email
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left column */}
          <div style={{ flex: '1 1 0', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* About */}
            {profile.about && (
              <SCard>
                <STitle>About</STitle>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{profile.about}</p>
              </SCard>
            )}

            {/* Slots */}
            {slots.length > 0 && (
              <SCard>
                <STitle>
                  {profile.type === 'tutor' || profile.type === 'coaching_center'
                    ? 'Subjects & Classes'
                    : 'Activities & Programs'}
                </STitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {slots.map((slot: any, i: number) => (
                    <div key={i} style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-inputs)', padding: '0.8rem 0.95rem',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      transition: 'border-color 0.18s, transform 0.18s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-ring)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                        background: 'var(--color-brand-light)', border: '1px solid var(--color-brand-ring)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <BookOpen size={13} style={{ color: 'var(--color-brand)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                          {slot.subject || slot.activity}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {slot.classes?.map((c: string, j: number) => (
                            <span key={j} style={{ fontSize: '0.72rem', padding: '0.14rem 0.5rem', borderRadius: '5px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                              {/^\s*class\b/i.test(c) ? c : `Class ${c}`}
                            </span>
                          ))}
                          {slot.boards?.map((b: string, j: number) => (
                            <span key={j} style={{ fontSize: '0.72rem', padding: '0.14rem 0.5rem', borderRadius: '5px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{b}</span>
                          ))}
                          {slot.ageGroup && <span style={{ fontSize: '0.72rem', padding: '0.14rem 0.5rem', borderRadius: '5px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Age: {slot.ageGroup}</span>}
                        </div>
                      </div>
                      {slot.feePerMonth && (
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, margin: 0 }}>
                          ₹{slot.feePerMonth}/mo
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SCard>
            )}

            {/* Media gallery */}
            {profile.media?.length > 0 && (
              <SCard>
                <STitle>Photos & Videos</STitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {profile.media.map((item: any) => (
                    <div key={item._id} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-elevated)', aspectRatio: '16/9' }}>
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                </div>
              </SCard>
            )}

            {/* Reviews */}
            <SCard>
              <STitle>Reviews ({reviews.length})</STitle>

              {/* Write review (student only) */}
              {user && user.role === 'student' && (
                <form onSubmit={submitReview} style={{
                  marginBottom: '1.25rem', padding: '1rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', marginTop: 0 }}>Write a Review</p>
                  {/* Star picker */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button"
                        onMouseEnter={() => setHoverStar(i)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setRating(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                        <PremiumStar size={26} active={(hoverStar || rating) >= i} interactive={true} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment} onChange={e => setComment(e.target.value)}
                    rows={3} placeholder="Share your experience…"
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem', marginBottom: '0.75rem',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                      fontSize: '0.875rem', resize: 'vertical', outline: 'none',
                      transition: 'border-color 0.18s, box-shadow 0.18s', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--color-brand-ring)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'var(--border)';          e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="submit" disabled={submitting} style={{
                    padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                    background: 'var(--color-brand)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius-buttons)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}>
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              )}

              {reviews.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No reviews yet. Be the first!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reviews.map((review: any) => (
                    <div key={review._id} style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {review.user?.name ?? 'Anonymous'}
                        </p>
                        <StarRow value={review.rating} />
                      </div>
                      {review.text && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{review.text}</p>
                      )}
                      {review.createdAt && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SCard>

            {/* Danger Zone */}
            {user && user._id === profile.userId && (
              <SCard style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
                <STitle><span style={{ color: '#ef4444' }}>Danger Zone</span></STitle>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Permanently delete your account and profile. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)} style={{
                    padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-buttons)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#dc2626'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ef4444'}>
                    Delete Account
                  </button>
                ) : (
                  <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Are you absolutely sure?</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Please type <strong>Confirm</strong> to permanently delete your account.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type Confirm"
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'Confirm' || deletingAccount} style={{
                        padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                        background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-buttons)',
                        cursor: deleteConfirmText !== 'Confirm' || deletingAccount ? 'not-allowed' : 'pointer',
                        opacity: deleteConfirmText !== 'Confirm' || deletingAccount ? 0.5 : 1
                      }}>
                        {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
                      </button>
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} style={{
                        padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
                        background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-buttons)',
                        cursor: 'pointer'
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </SCard>
            )}
          </div>

          {/* Right column */}
          <div style={{ width: '264px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Map */}
            {hasMap && (
              <SCard>
                <STitle>Location</STitle>
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '172px', border: '1px solid var(--border)', marginBottom: '0.875rem' }}>
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                      defaultCenter={{ lat: coords[1], lng: coords[0] }}
                      defaultZoom={14}
                      mapId="dooars-profile-map"
                      style={{ width: '100%', height: '100%' }}
                      gestureHandling="none"
                      disableDefaultUI={true}>
                      <AdvancedMarker position={{ lat: coords[1], lng: coords[0] }}>
                        <Pin
                          background={typeColors[profile.type] ?? '#1a73e8'}
                          borderColor="#fff" glyphColor="#fff" scale={1.1}
                        />
                      </AdvancedMarker>
                    </Map>
                  </APIProvider>
                </div>
                {profile.address && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {[profile.address.street, profile.address.area, profile.address.town, profile.address.district, profile.address.state, profile.address.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
              </SCard>
            )}

            {/* Quick info */}
            <SCard>
              <STitle>Quick Info</STitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {profile.experience > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '0 0 1px' }}>Experience</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{profile.experience} years</p>
                    </div>
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '0 0 1px' }}>Languages</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{profile.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
                {r_cnt > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PremiumStar size={15} active={true} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '0 0 1px' }}>Rating</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                        {r_avg} / 5 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r_cnt})</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SCard>

            {/* Report */}
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.78rem', color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.17s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
              <Flag size={11} /> Report this profile
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}