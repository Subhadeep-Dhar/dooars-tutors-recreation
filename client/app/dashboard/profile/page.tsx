'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
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
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);

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

        if (p.location?.coordinates && p.location.coordinates.length === 2) {
          setMapLocation({ lat: p.location.coordinates[1], lng: p.location.coordinates[0] });
        } else {
          setMapLocation({ lat: 26.7132, lng: 89.1743 }); // default Jalpaiguri
        }
      })
      .catch(() => {
        setIsNew(true);
        setMapLocation({ lat: 26.7132, lng: 89.1743 });
      })
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
        location: mapLocation ? [mapLocation.lng, mapLocation.lat] : undefined,
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

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isNew ? 'Create Profile' : 'Edit Profile'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Update your public profile information to attract more students.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Basic Info & Address */}
        <div className="lg:col-span-2 space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Basic info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Profile type</Label>
                <select {...register('type')} className="input-base">
                  {PROFILE_TYPES.map(({ value, label }) => (
                    <option key={value} value={value} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Display name</Label>
                <input className="input-base" placeholder="Your name or organization name" {...register('displayName', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Tagline</Label>
                <input className="input-base" placeholder="Short description shown in search results" {...register('tagline')} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Bio</Label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  placeholder="Tell students about yourself, your experience, and teaching style..."
                  className="input-base resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Years of experience</Label>
                <input className="input-base" type="number" placeholder="e.g. 5" {...register('experience')} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Address line 1</Label>
                <input className="input-base" placeholder="House/flat number, street" {...register('address.line1', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Area / Locality</Label>
                <input className="input-base" placeholder="Area or locality" {...register('address.area')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Town</Label>
                  <input className="input-base" placeholder="e.g. Jalpaiguri" {...register('address.town', { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>District</Label>
                  <input className="input-base" placeholder="e.g. Jalpaiguri" {...register('address.district', { required: true })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>State</Label>
                  <input className="input-base" placeholder="e.g. West Bengal" {...register('address.state', { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Pincode</Label>
                  <input className="input-base" placeholder="e.g. 735101" {...register('address.pincode', { required: true })} />
                </div>
              </div>

              {/* Map Location Picker */}
              <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <Label className="mb-3 block" style={{ color: 'var(--text-primary)' }}>Precise Map Location</Label>
                <div className="h-64 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {mapLocation && (
                    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                      <Map
                        defaultZoom={13}
                        defaultCenter={mapLocation}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId="DEMO_MAP_ID"
                        onClick={(e) => {
                          if (e.detail.latLng) {
                            setMapLocation({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                          }
                        }}
                      >
                        <AdvancedMarker
                          position={mapLocation}
                          draggable={true}
                          onDragEnd={(e) => {
                            if (e.latLng) {
                              setMapLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                            }
                          }}
                        />
                      </Map>
                    </APIProvider>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Drag the pin or click on the map to set your exact location.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Contact & Actions */}
        <div className="space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Phone number</Label>
                <input className="input-base" placeholder="10-digit mobile number" {...register('contact.phone')} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>WhatsApp number</Label>
                <input className="input-base" placeholder="WhatsApp number (if different)" {...register('contact.whatsapp')} />
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Contact email</Label>
                <input className="input-base" type="email" placeholder="Public contact email" {...register('contact.email')} />
              </div>
            </CardContent>
          </Card>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 shadow-token-md">
            {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
          </button>

          <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--gradient-to)' }}>
            <CardContent className="p-5">
              <h3 className="font-medium mb-2" style={{ color: 'var(--gradient-to)' }}>Pro Tip</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Profiles with detailed bios and accurate addresses receive 3x more student inquiries. Make sure to highlight your unique teaching style!
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}