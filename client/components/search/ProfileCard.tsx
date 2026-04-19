'use client';

import Link from 'next/link';
import { MapPin, Star, Phone, MessageCircle, BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const typeLabels: Record<string, string> = {
  tutor: 'Private Tutor',
  coaching_center: 'Coaching Center',
  sports_trainer: 'Sports Trainer',
  arts_trainer: 'Arts & Culture',
  gym_yoga: 'Gym & Yoga',
};

const typeColors: Record<string, string> = {
  tutor: 'bg-blue-50 text-blue-700',
  coaching_center: 'bg-purple-50 text-purple-700',
  sports_trainer: 'bg-green-50 text-green-700',
  arts_trainer: 'bg-pink-50 text-pink-700',
  gym_yoga: 'bg-orange-50 text-orange-700',
};

export default function ProfileCard({ profile }: { profile: any }) {
  const matchedSlots = profile.matchedSlots?.length > 0 ? profile.matchedSlots : profile.teachingSlots?.slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white font-semibold text-lg shrink-0">
            {profile.displayName.charAt(0)}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <Link href={`/profiles/${profile.slug}`} className="font-semibold text-slate-900 hover:underline text-lg">
                  {profile.displayName}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[profile.type]}`}>
                    {typeLabels[profile.type]}
                  </span>
                  {profile.isFeatured && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              {profile.rating?.count > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-sm">{profile.rating.average}</span>
                  <span className="text-slate-400 text-xs">({profile.rating.count})</span>
                </div>
              )}
            </div>

            {/* Tagline */}
            {profile.tagline && (
              <p className="text-slate-500 text-sm mt-1">{profile.tagline}</p>
            )}

            {/* Matched slots */}
            {matchedSlots?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {matchedSlots.slice(0, 3).map((slot: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <BookOpen size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-700 font-medium">
                      {slot.subject || slot.activity}
                    </span>
                    {slot.classes?.length > 0 && (
                      <span className="text-xs text-slate-400">
                        · {slot.classes.slice(0, 2).join(', ')}
                      </span>
                    )}
                    {slot.feePerMonth && (
                      <span className="text-xs text-slate-500 ml-1">₹{slot.feePerMonth}/mo</span>
                    )}
                  </div>
                ))}
                {matchedSlots.length > 3 && (
                  <span className="text-xs text-slate-400 flex items-center">+{matchedSlots.length - 3} more</span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {profile.address?.town}, {profile.address?.district}
                </span>
                {profile.experience && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {profile.experience} yrs exp
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profile.contact?.whatsapp && (
                  <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <MessageCircle size={13} /> WhatsApp
                    </Button>
                  </a>
                )}
                {profile.contact?.phone && (
                  <a href={`tel:${profile.contact.phone}`}>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <Phone size={13} /> Call
                    </Button>
                  </a>
                )}
                <Link href={`/profiles/${profile.slug}`}>
                  <Button size="sm" className="h-8 text-xs">View Profile</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}