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

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!profile) return (
    <div className="text-center py-12">
      <p className="text-slate-500">Create your profile first before adding slots.</p>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Teaching Slots</h1>

      {/* Existing slots */}
      {profile.teachingSlots?.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Current slots</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {profile.teachingSlots.map((slot: any, index: number) => (
              <div key={slot._id ?? index} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="font-medium text-sm">{slot.subject || slot.activity}</span>
                    {slot.board && <Badge variant="outline" className="text-xs">{slot.board}</Badge>}
                    {slot.medium && <Badge variant="outline" className="text-xs">{slot.medium}</Badge>}
                  </div>
                  {slot.classes?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1 ml-5">{slot.classes.join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {slot.feePerMonth && <span className="text-sm font-semibold">₹{slot.feePerMonth}/mo</span>}
                  <button onClick={() => deleteSlot(slot._id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add slot form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add new slot</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input placeholder="e.g. Mathematics" {...register('subject', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Classes</Label>
              <div className="grid grid-cols-4 gap-2">
                {CLASS_OPTIONS.map((cls) => (
                  <button
                    key={cls} type="button"
                    onClick={() => toggleClass(cls)}
                    className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                      selectedClasses.includes(cls)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {cls.replace('Class ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Board</Label>
                <select {...register('board')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {BOARD_OPTIONS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Medium</Label>
                <select {...register('medium')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {MEDIUM_OPTIONS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Fee per month (₹)</Label>
              <Input type="number" placeholder="e.g. 1000" {...register('feePerMonth')} />
            </div>

            <Button type="submit" disabled={saving} className="w-full gap-2">
              <Plus size={16} />
              {saving ? 'Adding...' : 'Add Slot'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}