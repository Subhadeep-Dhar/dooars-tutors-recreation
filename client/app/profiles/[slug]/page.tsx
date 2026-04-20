'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Phone, MessageCircle, Star, Clock, Globe, Mail, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import MiniMap from '@/components/profile/MiniMap';

const typeLabels: Record<string, string> = {
    tutor: 'Private Tutor',
    coaching_center: 'Coaching Center',
    sports_trainer: 'Sports Trainer',
    arts_trainer: 'Arts & Culture',
    gym_yoga: 'Gym & Yoga',
};

export default function ProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [profileRes, reviewsRes] = await Promise.all([
                    api.get(`/profiles/slug/${slug}`),
                    api.get(`/profiles/${slug}/reviews`).catch(() => ({ data: { data: { reviews: [] } } })),
                ]);
                setProfile(profileRes.data.data.profile);
                setReviews(reviewsRes.data.data.reviews ?? []);
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );

    if (!profile) return (
        <div className="text-center py-24">
            <p className="text-slate-500 text-lg">Profile not found</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex gap-5 items-start">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                            {profile.displayName.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-sm text-slate-500">{typeLabels[profile.type]}</span>
                                        {profile.isFeatured && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Featured</Badge>}
                                    </div>
                                    {profile.tagline && <p className="text-slate-600 mt-1">{profile.tagline}</p>}
                                </div>
                                {profile.rating?.count > 0 && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                                        <Star size={16} className="fill-amber-400 text-amber-400" />
                                        <span className="font-bold">{profile.rating.average}</span>
                                        <span className="text-slate-500 text-sm">({profile.rating.count} reviews)</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    {profile.address?.area && `${profile.address.area}, `}
                                    {profile.address?.town}, {profile.address?.district}
                                </span>
                                {profile.experience && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {profile.experience} years experience
                                    </span>
                                )}
                                {profile.languages?.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Globe size={14} />
                                        {profile.languages.join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact buttons */}
                    <div className="flex gap-3 mt-5 flex-wrap">
                        {profile.contact?.whatsapp && (
                            <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer">
                                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                                    <MessageCircle size={16} /> WhatsApp
                                </Button>
                            </a>
                        )}
                        {profile.contact?.phone && (
                            <a href={`tel:${profile.contact.phone}`}>
                                <Button variant="outline" className="gap-2">
                                    <Phone size={16} /> {profile.contact.phone}
                                </Button>
                            </a>
                        )}
                        {profile.contact?.email && (
                            <a href={`mailto:${profile.contact.email}`}>
                                <Button variant="outline" className="gap-2">
                                    <Mail size={16} /> Email
                                </Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Bio */}
                    {profile.bio && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
                            <CardContent><p className="text-slate-600 leading-relaxed">{profile.bio}</p></CardContent>
                        </Card>
                    )}

                    {/* Teaching slots */}
                    {profile.teachingSlots?.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">
                                {profile.type === 'tutor' || profile.type === 'coaching_center' ? 'Subjects & Classes' : 'Activities & Programs'}
                            </CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {profile.teachingSlots.map((slot: any, i: number) => (
                                        <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen size={14} className="text-slate-400" />
                                                    <span className="font-medium text-slate-800">{slot.subject || slot.activity}</span>
                                                    {slot.board && <Badge variant="outline" className="text-xs">{slot.board}</Badge>}
                                                    {slot.medium && <Badge variant="outline" className="text-xs">{slot.medium}</Badge>}
                                                </div>
                                                {slot.classes?.length > 0 && (
                                                    <p className="text-sm text-slate-500 mt-1 ml-5">{slot.classes.join(', ')}</p>
                                                )}
                                                {slot.ageGroups?.length > 0 && (
                                                    <p className="text-sm text-slate-500 mt-1 ml-5">Age: {slot.ageGroups.join(', ')}</p>
                                                )}
                                                {slot.timing && (
                                                    <p className="text-sm text-slate-500 mt-0.5 ml-5">{slot.timing} · {slot.sessionType}</p>
                                                )}
                                            </div>
                                            {slot.feePerMonth && (
                                                <span className="text-sm font-semibold text-slate-800 shrink-0">₹{slot.feePerMonth}/mo</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reviews */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Reviews ({reviews.length})</CardTitle></CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <p className="text-slate-400 text-sm">No reviews yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review: any) => (
                                        <div key={review._id}>
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{review.reviewerId?.name ?? 'Student'}</span>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: review.rating }).map((_, i) => (
                                                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm mt-1">{review.text}</p>
                                            <Separator className="mt-4" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Location</CardTitle>
                        </CardHeader>

                        <CardContent className="text-sm text-slate-600 space-y-3">

                            {/* MAP */}
                            <MiniMap location={profile.location} />

                            {/* ADDRESS */}
                            <div>
                                <p>{profile.address?.line1}</p>
                                {profile.address?.area && <p>{profile.address.area}</p>}
                                <p>{profile.address?.town}</p>
                                <p>{profile.address?.district}, {profile.address?.state}</p>
                                <p>{profile.address?.pincode}</p>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}