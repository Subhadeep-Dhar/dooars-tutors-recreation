'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { GraduationCap, Building2, Activity, Palette, Dumbbell, User, Users, Tag, FileText, Calendar, Languages, Briefcase, MapPin, Phone, Mail, MessageCircle, Info, Sparkles, BookOpen, UserRound, Bot, Navigation } from 'lucide-react';
import { FluidDropdown } from '@/components/ui/fluid-dropdown';
import { DatePicker } from '@/components/ui/date-picker';
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
  { id: 'tutor', label: 'Private Tutor', icon: GraduationCap, color: '#3b82f6' },
  { id: 'coaching_center', label: 'Coaching Center', icon: Building2, color: '#8b5cf6' },
  { id: 'sports_trainer', label: 'Sports', icon: Activity, color: '#f59e0b' },
  { id: 'arts_trainer', label: 'Arts & Culture', icon: Palette, color: '#ec4899' },
  { id: 'gym_yoga', label: 'Gym & Yoga', icon: Dumbbell, color: '#10b981' },
];

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: User },
  { id: 'female', label: 'Female', icon: UserRound },
  { id: 'alien', label: 'Alien', icon: Bot },
];

const ORG_OPTIONS = [
  { id: 'false', label: 'Individual Instructor', icon: User, color: '#3b82f6' },
  { id: 'true', label: 'Organisation / Centre', icon: Users, color: '#8b5cf6' },
];

const DISTRICTS = ['Alipurduar', 'Cooch Behar', 'Darjeeling', 'Jalpaiguri', 'Kalimpong'].map(d => ({ id: d, label: d }));
const TOWNS = ["Algarah","Alipurduar","Bagdogra","Banarhat","Barobisha","Bindu","Binnaguri","Birpara","Chalsa","Cooch Behar","Darjeeling","Dhupguri","Dinhata","Falakata","Gorubathan","Haldibari","Hasimara","Jaigaon","Jaldapara","Jaldhaka","Jalpaiguri","Kalchini","Kalimpong","Kamakhyaguri","Kharibari","Kranti","Kumargram","Kurseong","Lataguri","Lava","Madarihat","Mainaguri","Malbazar","Mathabhanga","Matiali","Matigara","Mekhliganj","Mirik","Nagrakata","Naxalbari","Oodlabari","Pedong","Phansidewa","Pundibari","Rajabhatkhawa","Rajganj","Rango","Siliguri","Sitai","Sitalkuchi","Sonada","Sonapur","Sukna","Takdah","Tapshikhata","Teesta Bazar","Tufanganj"].map(t => ({ id: t, label: t }));

const TOWN_TO_DISTRICT: Record<string, string> = {
  "Alipurduar": "Alipurduar",
  "Barobisha": "Alipurduar",
  "Birpara": "Alipurduar",
  "Falakata": "Alipurduar",
  "Hasimara": "Alipurduar",
  "Jaigaon": "Alipurduar",
  "Jaldapara": "Alipurduar",
  "Kalchini": "Alipurduar",
  "Kamakhyaguri": "Alipurduar",
  "Kumargram": "Alipurduar",
  "Madarihat": "Alipurduar",
  "Rajabhatkhawa": "Alipurduar",
  "Sonapur": "Alipurduar",
  "Tapshikhata": "Alipurduar",
  "Banarhat": "Jalpaiguri",
  "Binnaguri": "Jalpaiguri",
  "Chalsa": "Jalpaiguri",
  "Dhupguri": "Jalpaiguri",
  "Jalpaiguri": "Jalpaiguri",
  "Kranti": "Jalpaiguri",
  "Lataguri": "Jalpaiguri",
  "Mainaguri": "Jalpaiguri",
  "Malbazar": "Jalpaiguri",
  "Matiali": "Jalpaiguri",
  "Nagrakata": "Jalpaiguri",
  "Oodlabari": "Jalpaiguri",
  "Rajganj": "Jalpaiguri",
  "Bagdogra": "Darjeeling",
  "Darjeeling": "Darjeeling",
  "Kharibari": "Darjeeling",
  "Kurseong": "Darjeeling",
  "Matigara": "Darjeeling",
  "Mirik": "Darjeeling",
  "Naxalbari": "Darjeeling",
  "Phansidewa": "Darjeeling",
  "Siliguri": "Darjeeling",
  "Sonada": "Darjeeling",
  "Sukna": "Darjeeling",
  "Takdah": "Darjeeling",
  "Cooch Behar": "Cooch Behar",
  "Dinhata": "Cooch Behar",
  "Haldibari": "Cooch Behar",
  "Mathabhanga": "Cooch Behar",
  "Mekhliganj": "Cooch Behar",
  "Pundibari": "Cooch Behar",
  "Sitai": "Cooch Behar",
  "Sitalkuchi": "Cooch Behar",
  "Tufanganj": "Cooch Behar",
  "Algarah": "Kalimpong",
  "Bindu": "Kalimpong",
  "Gorubathan": "Kalimpong",
  "Jaldhaka": "Kalimpong",
  "Kalimpong": "Kalimpong",
  "Lava": "Kalimpong",
  "Pedong": "Kalimpong",
  "Rango": "Kalimpong",
  "Teesta Bazar": "Kalimpong"
};

const normalizeLanguages = (input: string) => {
  if (!input) return '';
  
  const map: Record<string, string> = {
    'bangla': 'Bengali',
    'beng': 'Bengali',
    'bengalee': 'Bengali',
    'eng': 'English',
    'englis': 'English',
    'hind': 'Hindi',
    'nepalese': 'Nepali',
    'nepal': 'Nepali',
    'santhali': 'Santali',
    'sanatali': 'Santali',
    'sadri': 'Sadri',
    'kortha': 'Khortha',
    'rajbanshi': 'Rajbanshi',
    'kamtapuri': 'Kamtapuri',
    'bhojpuri': 'Bhojpuri',
    'bihari': 'Bhojpuri',
    'marwari': 'Marwari',
    'punjabi': 'Punjabi',
    'panjabi': 'Punjabi'
  };

  return input
    .split(',')
    .map(l => l.trim().toLowerCase())
    .filter(Boolean)
    .map(l => {
      if (map[l]) return map[l];
      return l.charAt(0).toUpperCase() + l.slice(1);
    })
    .join(', ');
};

export default function ProfileEditorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Delete profile
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const { register, handleSubmit, reset, watch, control, trigger, getFieldState, formState, setValue } = useForm({
    shouldFocusError: false
  });

  const handleNext = async () => {
    let fieldsToValidate: string[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['type', 'displayName'];
    } else if (currentStep === 2) {
      fieldsToValidate = []; // Add specialization requirements if needed
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Please fill all required fields');
      setTimeout(() => {
        const errorField = fieldsToValidate.find(f => getFieldState(f, formState).invalid);
        if (errorField) {
          const el = document.querySelector(`[name="${errorField}"]`) || document.getElementById(`field-${errorField}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              (el as HTMLElement).focus({ preventScroll: true });
            }
          }
        }
      }, 50);
    }
  };

  const onError = (errors: any) => {
    toast.error('Please fill all required fields');
    
    // Helper to find the first deeply nested error key
    const getFirstErrorKey = (obj: any, prefix = ''): string => {
      const key = Object.keys(obj)[0];
      if (!key) return '';
      if (obj[key].message !== undefined || obj[key].type !== undefined) {
        return prefix ? `${prefix}.${key}` : key;
      }
      return getFirstErrorKey(obj[key], prefix ? `${prefix}.${key}` : key);
    };

    const firstErrorKey = getFirstErrorKey(errors);
    if (firstErrorKey) {
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(`field-${firstErrorKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            (el as HTMLElement).focus({ preventScroll: true });
          }
        }
      }, 50);
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        reset({ type: 'tutor' });
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          {isNew ? 'Create Profile' : 'Edit Profile'}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Update your public profile information to attract more students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-between relative mb-8">
              <div className="absolute left-0 right-0 top-4 -z-10 h-[2px] bg-[var(--border)] mx-8 hidden sm:block"></div>
              {[
                { id: 1, label: 'Basic Info' },
                { id: 2, label: 'Specialization' },
                { id: 3, label: 'Contact & Location' }
              ].map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--bg-main)] px-2 sm:px-4 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep === step.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : currentStep > step.id ? 'bg-green-500 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
                    {step.id}
                  </div>
                  <span className="text-xs font-medium" style={{ color: currentStep >= step.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: BASIC INFO */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="space-y-6">
              <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <CardHeader><CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Basic info</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5" id="field-type">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-500" /> Profile type <span className="text-red-500">*</span></Label>
                      <Controller
                        name="type"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <FluidDropdown
                            options={PROFILE_TYPES}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select profile type"
                          />
                        )}
                      />
                      <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] leading-relaxed text-blue-700 dark:text-blue-300 opacity-90">Select <strong>Arts & Culture</strong> for Dance, Music, Fine Arts, etc.</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-500" /> Display name <span className="text-red-500">*</span></Label>
                      <input className="input-base w-full" placeholder="Your name or organization name" {...register('displayName', { required: true })} />
                      <p className="text-[12px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                        Main name shown to students.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-blue-500" /> Tagline</Label>
                    <input className="input-base w-full" placeholder="e.g. Expert Math Tutor for CBSE & ICSE" {...register('tagline')} />
                    <p className="text-[13px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                      A short, catchy headline that appears right below your name in search results.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-500" /> Bio / About You</Label>
                    <textarea
                      {...register('bio')}
                      rows={4}
                      placeholder="Tell students about your qualifications, teaching methodology, and why they should choose you..."
                      className="input-base w-full resize-none"
                    />
                    <p className="text-[13px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                      Write 3-4 sentences. Mention your degrees, past successes, and what makes your teaching unique.
                    </p>
                    {profile?.bioSource && profile.bioSource !== 'user' && profile.bioSource !== 'admin' && (
                      <div className="mt-2 text-xs flex items-center gap-1.5 px-3 py-2 rounded-md w-max" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {profile.bioSource === 'ai_generated' && 'This bio was automatically enhanced by AI.'}
                          {profile.bioSource === 'deterministic' && 'This bio was automatically generated.'}
                          {profile.bioSource === 'imported' && 'This bio was imported from Google Maps.'}
                        </span>
                      </div>
                    )}
                  </div>

                  {typeWatch === 'gym_yoga' && (
                    <div className="space-y-1.5 p-4 rounded-lg border" style={{ borderColor: 'var(--gradient-to)', background: 'var(--bg-elevated)' }}>
                      <Label className="font-semibold" style={{ color: 'var(--gradient-to)' }}>Are you an individual instructor or an organisation?</Label>
                      <p className="text-[13px] mt-1.5 leading-relaxed opacity-90 mb-2" style={{ color: 'var(--text-secondary)' }}>Please clarify to help us show the right profile fields.</p>
                      <Controller
                        name="isOrganisation"
                        control={control}
                        render={({ field }) => (
                          <FluidDropdown
                            options={ORG_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="-- Please specify --"
                          />
                        )}
                      />
                    </div>
                  )}

                  {applicability?.showGenderDob && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-500" /> Gender</Label>
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <FluidDropdown
                              options={GENDER_OPTIONS}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select Gender"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> Date of Birth</Label>
                        <Controller
                          name="dateOfBirth"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select Date"
                            />
                          )}
                        />
                        <p className="text-[12px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                          Never shown publicly. Used to calculate age.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-500" /> Experience</Label>
                      <input className="input-base w-full" type="number" placeholder="e.g. 5 (in years)" {...register('experience')} />
                    </div>
                    {applicability?.showLanguages && (() => {
                      const languageField = register('languages');
                      return (
                        <div className="space-y-1.5">
                          <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Languages className="w-4 h-4 text-blue-500" /> Languages</Label>
                          <input 
                            className="input-base w-full" 
                            placeholder="e.g. English, Hindi, Bengali" 
                            {...languageField}
                            onBlur={(e) => {
                              languageField.onBlur(e);
                              const normalized = normalizeLanguages(e.target.value);
                              if (normalized !== e.target.value) {
                                setValue('languages', normalized, { shouldValidate: true, shouldDirty: true });
                              }
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* STEP 2: SPECIALIZATION */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="space-y-6">
              <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <CardHeader><CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-500" /> Specialization & Approach</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  {applicability?.showServiceModes && (
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Service Modes (Where do you teach?)</Label>
                      <p className="text-[13px] mb-3 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                        Select all that apply. This helps students find you based on their preference.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(SERVICE_MODE_LABELS).map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <input type="checkbox" value={val} {...register('serviceModes')} className="rounded focus:ring-blue-500" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {applicability?.showServiceRadius && serviceModesWatch.includes('student_home') && (
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Service Radius (Km)</Label>
                      <input className="input-base w-full" type="number" min="0" max="200" placeholder="e.g. 10" {...register('serviceRadiusKm')} />
                      <p className="text-[13px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                        How far are you willing to travel to a student's location?
                      </p>
                    </div>
                  )}

                  {applicability?.showLearnerLevels && (
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> Target Learner Levels</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(learnerLevelLabels).map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <input type="checkbox" value={val} {...register('learnerLevels')} className="rounded focus:ring-blue-500" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{label as string}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {applicability?.showStyles && applicableStyles.length > 0 && (
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" /> Teaching / Training Styles</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {applicableStyles.map((styleKey) => (
                          <label key={styleKey} className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <input type="checkbox" value={styleKey} {...register('teachingStyles')} className="rounded focus:ring-blue-500" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{STYLE_LABELS[styleKey as TeachingStyleType]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* STEP 3: ADDRESS & CONTACT */}
            <div style={{ display: currentStep === 3 ? 'block' : 'none' }} className="space-y-6">
              <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                <CardHeader><CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-500" /> Address & Contact</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Address line 1 <span className="text-red-500">*</span></Label>
                      <input className="input-base w-full" placeholder="House/flat number, street" {...register('address.line1', { required: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Area / Locality</Label>
                      <input className="input-base w-full" placeholder="Area or locality" {...register('address.area')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5" id="field-address.town">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-500" /> Town <span className="text-red-500">*</span></Label>
                      <Controller
                        name="address.town"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <FluidDropdown
                            options={TOWNS}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              if (val && TOWN_TO_DISTRICT[val]) {
                                setValue('address.district', TOWN_TO_DISTRICT[val], { shouldValidate: true });
                              }
                            }}
                            placeholder="Select Town"
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5" id="field-address.district">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> District <span className="text-red-500">*</span></Label>
                      <Controller
                        name="address.district"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <FluidDropdown
                            options={DISTRICTS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select District"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> State <span className="text-red-500">*</span></Label>
                      <input className="input-base w-full" placeholder="e.g. West Bengal" {...register('address.state', { required: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Pincode <span className="text-red-500">*</span></Label>
                      <input className="input-base w-full" placeholder="e.g. 735101" {...register('address.pincode', { required: true })} />
                    </div>
                  </div>

                  {/* Map Location Picker */}
                  <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      <Label className="block" style={{ color: 'var(--text-primary)' }}>Precise Map Location</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 h-8 text-xs font-medium"
                        onClick={() => {
                          if (navigator.geolocation) {
                            toast.loading('Fetching your location...', { id: 'geo-toast' });
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setMapLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                toast.success('Location updated!', { id: 'geo-toast' });
                                toast('Please manually verify the location on the map before submitting.', {
                                  icon: '⚠️',
                                  duration: 5000,
                                });
                              },
                              (err) => {
                                toast.error('Could not get your location. Please check browser permissions.', { id: 'geo-toast' });
                              },
                              { enableHighAccuracy: true, timeout: 10000 }
                            );
                          } else {
                            toast.error('Geolocation is not supported by your browser');
                          }
                        }}
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-500" />
                        Use Current Location
                      </Button>
                    </div>

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
                    <p className="text-[13px] mt-2 leading-relaxed opacity-90" style={{ color: 'var(--text-muted)' }}>Drag the pin or click on the map to set your exact location.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card moved here */}
              <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <CardHeader><CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2"><Phone className="w-5 h-5 text-blue-500" /> Contact</CardTitle></CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-blue-500" /> Phone number <span className="text-red-500">*</span></Label>
                      <input className="input-base w-full" placeholder="10-digit mobile number" {...register('contact.phone', { required: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp number</Label>
                      <input className="input-base w-full" placeholder="WhatsApp number (if different)" {...register('contact.whatsapp')} />
                      <p className="text-[12px] mt-1.5 leading-relaxed opacity-90 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                        Students prefer WhatsApp.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }} className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /> Contact email</Label>
                    <input className="input-base w-full" type="email" placeholder="Public contact email" {...register('contact.email')} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step Navigation & Submission */}
            <div className="flex items-center justify-between pt-6 border-t border-[var(--border)] mt-8">
              {currentStep > 1 ? (
                <button type="button" onClick={handlePrev} className="px-6 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)] transition-colors">
                  Previous
                </button>
              ) : <div></div>}

              {currentStep < 3 ? (
                <button type="button" onClick={handleNext} className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20">
                  Next Step
                </button>
              ) : (
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors shadow-md shadow-green-500/20">
                  {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Profile'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Sidebar: Info Cards & Danger Zone */}
        <div className="lg:col-span-4 space-y-6 lg:mt-[104px]">
          <Card className="relative overflow-hidden border-none shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-sky-500/10 to-emerald-500/10 dark:from-blue-500/20 dark:via-sky-500/20 dark:to-emerald-500/20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-emerald-500"></div>
            <CardContent className="p-5 sm:p-6 relative">
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles className="w-5 h-5 text-blue-500 drop-shadow-sm" />
                <h3 className="font-bold text-lg text-blue-800 dark:text-blue-300 tracking-tight">Unlock More Students</h3>
              </div>
              <p className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                We deeply appreciate your contribution to education. To help us connect you with the best students, please provide as much detail as possible!
              </p>
              <div className="mt-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-[13px] font-medium text-blue-900 dark:text-blue-200">
                  <span className="text-emerald-500 font-bold mr-1">Fact:</span>
                  Profiles that complete every field receive <strong className="text-blue-600 dark:text-blue-400">3x more student inquiries.</strong>
                </p>
              </div>
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
                <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: '#ef4444' }}>Danger Zone</CardTitle>
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
      </div>

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