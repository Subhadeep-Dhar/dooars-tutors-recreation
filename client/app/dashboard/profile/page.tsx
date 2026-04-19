'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

const PROFILE_TYPES = [
  { value: 'tutor', label: 'Private Tutor' },
  { value: 'coaching_center', label: 'Coaching Center' },
  { value: 'sports_trainer', label: 'Sports Trainer' },
  { value: 'arts_trainer', label: 'Arts & Culture' },
  { value: 'gym_yoga', label: 'Gym & Yoga' },
];

export default function ProfileEditorPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => {
        const p = res.data.data.profile;
        setProfile(p);
        reset({
          type: p.type,
          displayName: p.displayName,
          tagline: p.tagline,
          bio: p.bio,
          experience: p.experience,
          'address.line1': p.address?.line1,
          'address.area': p.address?.area,
          'address.town': p.address?.town,
          'address.district': p.address?.district,
          'address.state': p.address?.state,
          'address.pincode': p.address?.pincode,
          'contact.phone': p.contact?.phone,
          'contact.whatsapp': p.contact?.whatsapp,
          'contact.email': p.contact?.email,
        });
      })
      .catch(() => setIsNew(true))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: any) {
    setSaving(true);
    try {
      const payload = {
        type: data.type,
        displayName: data.displayName,
        tagline: data.tagline,
        bio: data.bio,
        experience: data.experience ? Number(data.experience) : undefined,
        address: {
          line1: data['address.line1'],
          area: data['address.area'],
          town: data['address.town'],
          district: data['address.district'],
          state: data['address.state'],
          pincode: data['address.pincode'],
        },
        contact: {
          phone: data['contact.phone'],
          whatsapp: data['contact.whatsapp'],
          email: data['contact.email'],
        },
      };

      if (isNew) {
        const res = await api.post('/profiles', payload);
        setProfile(res.data.data.profile);
        setIsNew(false);
        toast.success('Profile created! Pending admin approval.');
      } else {
        const res = await api.put(`/profiles/${profile._id}`, payload);
        setProfile(res.data.data.profile);
        toast.success('Profile updated');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isNew ? 'Create Profile' : 'Edit Profile'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Profile type</Label>
              <select {...register('type')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {PROFILE_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Display name</Label>
              <Input placeholder="Your name or organization name" {...register('displayName', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Tagline</Label>
              <Input placeholder="Short description shown in search results" {...register('tagline')} />
            </div>
            <div className="space-y-1">
              <Label>Bio</Label>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder="Tell students about yourself, your experience, and teaching style..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div className="space-y-1">
              <Label>Years of experience</Label>
              <Input type="number" placeholder="e.g. 5" {...register('experience')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Address line 1</Label>
              <Input placeholder="House/flat number, street" {...register('address.line1', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label>Area / Locality</Label>
              <Input placeholder="Area or locality" {...register('address.area')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Town</Label>
                <Input placeholder="e.g. Jalpaiguri" {...register('address.town', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>District</Label>
                <Input placeholder="e.g. Jalpaiguri" {...register('address.district', { required: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>State</Label>
                <Input placeholder="e.g. West Bengal" {...register('address.state', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Pincode</Label>
                <Input placeholder="e.g. 735101" {...register('address.pincode', { required: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Phone number</Label>
              <Input placeholder="10-digit mobile number" {...register('contact.phone')} />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp number</Label>
              <Input placeholder="WhatsApp number (if different)" {...register('contact.whatsapp')} />
            </div>
            <div className="space-y-1">
              <Label>Contact email</Label>
              <Input type="email" placeholder="Public contact email" {...register('contact.email')} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}