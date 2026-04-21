'use client';

import { useSearchStore } from '@/store/searchStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';

const types = [
  { label: 'All', value: '' },
  { label: 'Private Tutors', value: 'tutor' },
  { label: 'Coaching Centers', value: 'coaching_center' },
  { label: 'Sports Trainers', value: 'sports_trainer' },
  { label: 'Arts & Culture', value: 'arts_trainer' },
  { label: 'Gym & Yoga', value: 'gym_yoga' },
];

const classes = [
  'Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
  'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12',
];

const boards = ['CBSE', 'ICSE', 'State', 'Other'];

interface FilterPanelProps {
  onFilter?: () => void;
}

export default function FilterPanel({ onFilter }: FilterPanelProps) {
  const { params, setParams, search } = useSearchStore();

  const subjectTimer = useRef<any>(null);

  function handleSubjectChange(value: string) {
    clearTimeout(subjectTimer.current);
    subjectTimer.current = setTimeout(() => {
      apply({ subject: value || undefined });
    }, 400); // wait 400ms after user stops typing
  }

  function apply(newParams: any) {
    const merged = { ...params, ...newParams, page: 1, limit: 10 };
    setParams(merged);
    search(merged);
    onFilter?.();
  }

  function clearAll() {
    const reset = { page: 1, limit: 10, sort: 'rating' as const };
    setParams(reset);
    search(reset);
    onFilter?.();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Filters</h3>
        <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-800">Clear all</button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Category</Label>
        <div className="space-y-1">
          {types.map(({ label, value }) => (
            <button key={value} onClick={() => apply({ type: value || undefined })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                (params.type ?? '') === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Subject</Label>
        <Input
          placeholder="e.g. Maths, Physics"
          defaultValue={params.subject ?? ''}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="text-sm"
        />
        <p className="text-xs text-slate-400">Separate multiple with commas</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Class</Label>
        <div className="grid grid-cols-3 gap-1">
          {classes.map((cls) => (
            <button key={cls}
              onClick={() => apply({ class: params.class === cls ? undefined : cls })}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                params.class === cls
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {cls.replace('Class ', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Board</Label>
        <div className="grid grid-cols-2 gap-1">
          {boards.map((board) => (
            <button key={board}
              onClick={() => apply({ board: params.board === board ? undefined : board })}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                params.board === board
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {board}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Sort by</Label>
        <div className="space-y-1">
          {[
            { label: 'Highest rated', value: 'rating' },
            { label: 'Newest', value: 'newest' },
            { label: 'Fee: low to high', value: 'fee_asc' },
          ].map(({ label, value }) => (
            <button key={value} onClick={() => apply({ sort: value as any })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                params.sort === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}