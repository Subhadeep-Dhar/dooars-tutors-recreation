'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { resolveProfileKind, getProfileFieldApplicability, TeachingStyleType } from '@dooars/shared';
import { SERVICE_MODE_LABELS, STYLE_LABELS, getLearnerLevelLabels, getApplicableStyles } from '@/lib/profileFieldConfig';


const PROFILE_TYPES = [
  { value: 'tutor', label: 'Private Tutor' },
  { value: 'coaching_center', label: 'Coaching Center' },
  { value: 'sports_trainer', label: 'Sports' },
  { value: 'arts_trainer', label: 'Arts & Culture' },
  { value: 'gym_yoga', label: 'Gym & Yoga' },
];

const DISTRICTS = ['Alipurduar', 'Cooch Behar', 'Darjeeling', 'Jalpaiguri', 'Kalimpong'];
const TOWNS = ['Alipurduar', 'Banarhat', 'Binnaguri', 'Birpara', 'Cooch Behar', 'Darjeeling', 'Dhupguri', 'Falakata', 'Hasimara', 'Jaigaon', 'Jalpaiguri', 'Kalchini', 'Kalimpong', 'Kurseong', 'Madarihat', 'Mainaguri', 'Malbazar', 'Siliguri'];

export default function ProfileEditorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);

  // Delete profile
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm();
  
  const typeWatch = watch('type');
  const isOrganisationWatch = watch('isOrganisation');
  const serviceModesWatch = watch('serviceModes') || [];
  
  const profileKind = typeWatch ? resolveProfileKind(typeWatch, isOrganisationWatch === 'true' || isOrganisationWatch === true ? true : isOrganisationWatch === 'false' || isOrganisationWatch === false ? false : undefined) : 'unknown';
  const applicability = typeWatch ? getProfileFieldApplicability(typeWatch, profileKind) : null;
  const learnerLevelLabels = typeWatch ? getLearnerLevelLabels(typeWatch) : {};
  const applicableStyles = typeWatch ? getApplicableStyles(typeWatch) : [];

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
          isOrganisation: p.isOrganisation === true ? 'true' : p.isOrganisation === false ? 'false' : '',
          gender: p.gender || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          languages: p.languages?.join(', ') || '',
          serviceModes: p.serviceModes || [],
          serviceRadiusKm: p.serviceRadiusKm || '',
          learnerLevels: p.learnerLevels || [],
          teachingStyles: p.teachingStyles || [],
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
          setMapLocation({ lat: 26.491890, lng: 89.527100 }); // default Alipurduar
        }
      })
      .catch(() => {
        setIsNew(true);
        setMapLocation({ lat: 26.491890, lng: 89.527100 });
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
        isOrganisation: data.isOrganisation === 'true' ? true : data.isOrganisation === 'false' ? false : undefined,
        gender: data.gender || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        languages: typeof data.languages === 'string' ? data.languages.split(',').map((l: string) => l.trim()).filter(Boolean) : data.languages,
        serviceModes: data.serviceModes || [],
        serviceRadiusKm: data.serviceRadiusKm ? Number(data.serviceRadiusKm) : undefined,
        learnerLevels: data.learnerLevels || [],
        teachingStyles: data.teachingStyles || [],
        address: {
          line1: data?.address?.line1 || data['address.line1'],
          area: data?.address?.area || data['address.area'],
          town: data?.address?.town || data['address.town'],
          district: data?.address?.district || data['address.district'],
          state: data?.address?.state || data['address.state'],
          pincode: data?.address?.pincode || data['address.pincode'],
        },
        contact: {
          phone: data?.contact?.phone || data['contact.phone'],
          whatsapp: data?.contact?.whatsapp || data['contact.whatsapp'],
          email: data?.contact?.email || data['contact.email'],
        },
        location: mapLocation ? [mapLocation.lng, mapLocation.lat] : undefined,
      };

      if (isNew) {
        const res = await api.post('/profiles', payload);
        setProfile(res.data.data.profile);
        setIsNew(false);
        setShowSuccessModal(true);
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
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
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
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Note: Select <strong>Arts & Culture</strong> if you teach Dance, Music, Singing, Painting, or Fine Arts.</p>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Display name</Label>
                <input className="input-base" placeholder="Your name or organization name" {...register('displayName', { required: true })} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This is the main name students will see. Use your real full name or official coaching center name.</p>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Tagline (Optional)</Label>
                <input className="input-base" placeholder="e.g. Expert Math Tutor for CBSE & ICSE" {...register('tagline')} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>A short, catchy headline that appears right below your name in search results.</p>
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-primary)' }}>Bio / About You</Label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  placeholder="Tell students about your qualifications, teaching methodology, and why they should choose you..."
                  className="input-base resize-none"
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Write 3-4 sentences. Mention your degrees, past successes, and what makes your teaching unique.</p>
                {profile?.bioSource && profile.bioSource !== 'user' && profile.bioSource !== 'admin' && (
                  <div className="mt-2 text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-100 w-max">
                    <span>✨</span>
                    <span>
                      {profile.bioSource === 'ai_generated' && 'This bio was automatically enhanced by AI.'}
                      {profile.bioSource === 'deterministic' && 'This bio was automatically generated.'}
                      {profile.bioSource === 'imported' && 'This bio was imported from Google Maps.'}
                    </span>
                  </div>
                )}
              </div>
              
              {typeWatch === 'gym_yoga' && (
                <div className="space-y-1.5 p-4 rounded-lg border border-orange-200 bg-orange-50">
                  <Label className="text-orange-900 font-semibold">Are you an individual instructor or an organisation?</Label>
                  <p className="text-xs text-orange-700 mb-2">Please clarify to help us show the right profile fields.</p>
                  <select {...register('isOrganisation')} className="input-base border-orange-200 bg-white text-orange-900">
                    <option value="">-- Please specify --</option>
                    <option value="false">Individual Instructor</option>
                    <option value="true">Organisation / Centre</option>
                  </select>
                </div>
              )}

              {applicability?.showGenderDob && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }}>Gender</Label>
                    <select {...register('gender')} className="input-base">
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="alien">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }}>Date of Birth</Label>
                    <input type="date" {...register('dateOfBirth')} className="input-base" />
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Never shown publicly. Used to calculate age.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Years of experience</Label>
                  <input className="input-base" type="number" placeholder="e.g. 5" {...register('experience')} />
                </div>
                {applicability?.showLanguages && (
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }}>Languages</Label>
                    <input className="input-base" placeholder="e.g. English, Hindi, Bengali" {...register('languages')} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Specialization & Approach</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {applicability?.showServiceModes && (
                <div className="space-y-2">
                  <Label style={{ color: 'var(--text-primary)' }}>Service Modes (Where do you teach?)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(SERVICE_MODE_LABELS).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 text-sm p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" value={val} {...register('serviceModes')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {applicability?.showServiceRadius && serviceModesWatch.includes('student_home') && (
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Service Radius (Km)</Label>
                  <input className="input-base" type="number" min="0" max="200" placeholder="e.g. 10" {...register('serviceRadiusKm')} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How far are you willing to travel to a student's location?</p>
                </div>
              )}

              {applicability?.showLearnerLevels && (
                <div className="space-y-2">
                  <Label style={{ color: 'var(--text-primary)' }}>Target Learner Levels</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(learnerLevelLabels).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 text-sm p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" value={val} {...register('learnerLevels')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span style={{ color: 'var(--text-secondary)' }}>{label as string}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {applicability?.showStyles && applicableStyles.length > 0 && (
                <div className="space-y-2">
                  <Label style={{ color: 'var(--text-primary)' }}>Teaching / Training Styles</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {applicableStyles.map((styleKey) => (
                      <label key={styleKey} className="flex items-center gap-2 text-sm p-2 rounded border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" value={styleKey} {...register('teachingStyles')} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span style={{ color: 'var(--text-secondary)' }}>{STYLE_LABELS[styleKey as TeachingStyleType]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                  <select className="input-base" {...register('address.town', { required: true })}>
                    <option value="" disabled style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>Select Town</option>
                    {TOWNS.map(t => <option key={t} value={t} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>District</Label>
                  <select className="input-base" {...register('address.district', { required: true })}>
                    <option value="" disabled style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>Select District</option>
                    {DISTRICTS.map(d => <option key={d} value={d} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{d}</option>)}
                  </select>
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
                
                <div className="mb-4 p-3 rounded-lg flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-500">
                  <span className="text-xl">📍</span>
                  <div>
                    <h4 className="font-semibold text-sm">IMPORTANT: Accurate location required</h4>
                    <p className="text-xs mt-0.5 opacity-90">Please drag the map marker to your <strong>exact location</strong>. Students use the map to find tutors nearby, so placing it accurately helps you get more students!</p>
                  </div>
                </div>

                <div className="h-64 rounded-xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
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
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Students prefer WhatsApp. We highly recommend providing this!</p>
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

          <Card style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💬</span>
                <h3 className="font-bold text-emerald-800">Join Our Community!</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                Connect with other tutors, get the latest updates, and receive premium leads directly on WhatsApp.
              </p>
              <div className="flex flex-col gap-2">
                <a href="https://chat.whatsapp.com/GFxRBRpDUp0242LgNNEOTY" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-semibold transition-colors shadow-sm">
                  Join WhatsApp Group
                </a>
                <a href="https://whatsapp.com/channel/0029VbDPxuKG3R3mN8CudI3X" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-sm font-semibold transition-colors">
                  Follow Our Channel
                </a>
              </div>
            </CardContent>
          </Card>

          {!isNew && (
            <Card style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: '#ef4444' }}>Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Permanently delete your account and profile. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Are you absolutely sure?</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      Please type <strong>Confirm</strong> to delete your account.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type Confirm"
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-800 rounded-md mb-3 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none disabled:opacity-50"
                        disabled={deleteConfirmText !== 'Confirm' || deletingAccount}
                        onClick={handleDeleteAccount}
                      >
                        {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
                      </Button>
                      <Button
                        type="button"
                        size="sm" variant="outline"
                        className="flex-1"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </form>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>Profile Created Successfully!</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              Your profile is almost ready. However, students won't know what you teach until you set up your teaching niches.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Click the button below to go to the <strong>Teaching Slots</strong> section and configure the subjects, activities, and fees you want to offer.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => router.push('/dashboard/slots')} className="w-full btn-primary py-2.5">
              Set Up Teaching Slots Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}