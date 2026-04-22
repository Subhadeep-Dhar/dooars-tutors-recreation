'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, BookOpen } from 'lucide-react';
import api from '@/lib/api';

const CLASS_OPTIONS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const BOARD_OPTIONS = ['CBSE','ICSE','State','Other'];
const MEDIUM_OPTIONS = ['Bengali','English','Hindi','Other'];

export default function SlotsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { subject: '', board: 'CBSE', medium: 'Bengali', feePerMonth: '' },
  });

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => setProfile(res.data.data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  function toggleClass(cls: string) {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }

  async function onSubmit(data: any) {
    if (selectedClasses.length === 0) { toast.error('Select at least one class'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/profiles/${profile._id}/slots`, {
        ...data,
        feePerMonth: data.feePerMonth ? Number(data.feePerMonth) : null,
        classes: selectedClasses,
      });
      setProfile(res.data.data.profile);
      reset();
      setSelectedClasses([]);
      toast.success('Slot added');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add slot');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(slotId: string) {
    try {
      const res = await api.delete(`/profiles/${profile._id}/slots/${slotId}`);
      setProfile(res.data.data.profile);
      toast.success('Slot removed');
    } catch {
      toast.error('Failed to remove slot');
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!profile) return (
    <div className="text-center py-12">
      <p style={{ color: 'var(--text-muted)' }}>Create your profile first before adding slots.</p>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Teaching Slots</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage the subjects and activities you teach, along with your pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Existing Slots */}
        <div className="lg:col-span-2 space-y-6">
          {profile.teachingSlots?.length > 0 ? (
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardHeader><CardTitle className="text-base">Current slots</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {profile.teachingSlots.map((slot: any, index: number) => (
                  <div key={slot._id ?? index} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{slot.subject || slot.activity}</span>
                        {slot.board && <Badge variant="outline" className="text-xs">{slot.board}</Badge>}
                        {slot.medium && <Badge variant="outline" className="text-xs">{slot.medium}</Badge>}
                      </div>
                      {slot.classes?.length > 0 && (
                        <p className="text-xs mt-1 ml-5" style={{ color: 'var(--text-secondary)' }}>{slot.classes.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {slot.feePerMonth && <span className="text-sm font-semibold">₹{slot.feePerMonth}/mo</span>}
                      <button onClick={() => deleteSlot(slot._id)} className="hover:text-red-600 transition-colors" style={{ color: '#ef4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="py-12 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
              <BookOpen size={32} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No teaching slots added yet.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Add Form & Tips */}
        <div className="space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Add new slot</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Subject</Label>
                  <input className="input-base" placeholder="e.g. Mathematics" {...register('subject', { required: true })} />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: 'var(--text-primary)' }}>Classes</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {CLASS_OPTIONS.map((cls) => (
                      <button
                        key={cls} type="button"
                        onClick={() => toggleClass(cls)}
                        className="px-2 py-1.5 rounded-lg text-xs transition-colors"
                        style={{
                          background: selectedClasses.includes(cls) ? 'var(--gradient-to)' : 'transparent',
                          color: selectedClasses.includes(cls) ? '#fff' : 'var(--text-secondary)',
                          border: `1px solid ${selectedClasses.includes(cls) ? 'var(--gradient-to)' : 'var(--border)'}`
                        }}
                      >
                        {cls.replace('Class ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }}>Board</Label>
                    <select {...register('board')} className="input-base">
                      {BOARD_OPTIONS.map((b) => <option key={b} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-primary)' }}>Medium</Label>
                    <select {...register('medium')} className="input-base">
                      {MEDIUM_OPTIONS.map((m) => <option key={m} style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--text-primary)' }}>Fee per month (₹)</Label>
                  <input className="input-base" type="number" placeholder="e.g. 1000" {...register('feePerMonth')} />
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                  <Plus size={16} />
                  {saving ? 'Adding...' : 'Add Slot'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <CardContent className="p-5">
              <h3 className="font-medium text-amber-500 mb-2">Pricing Tip</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Consider offering competitive rates for your initial slots to build your reputation and gather positive reviews quickly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}