'use client';

import { useSearchStore } from '@/store/searchStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const types = [
  { label: 'All', value: '' },
  { label: 'Private Tutors', value: 'tutor' },
  { label: 'Coaching Centers', value: 'coaching_center' },
  { label: 'Sports Trainers', value: 'sports_trainer' },
  { label: 'Arts & Culture', value: 'arts_trainer' },
  { label: 'Gym & Yoga', value: 'gym_yoga' },
];

const classes = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12',
];

const boards = ['CBSE', 'ICSE', 'State', 'Other'];

export default function FilterPanel() {
  const { params, setParams, search } = useSearchStore();

  function apply(newParams: any) {
    setParams(newParams);
    search({ ...params, ...newParams, page: 1 });
  }

  function clearAll() {
    search({ page: 1, limit: 20, sort: 'rating' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Filters</h3>
        <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-800">
          Clear all
        </button>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Category</Label>
        <div className="space-y-1">
          {types.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => apply({ type: value || undefined })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                (params.type ?? '') === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Subject</Label>
        <Input
          placeholder="e.g. Mathematics"
          value={params.subject ?? ''}
          onChange={(e) => apply({ subject: e.target.value || undefined })}
          className="text-sm"
        />
      </div>

      {/* Class */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Class</Label>
        <div className="grid grid-cols-3 gap-1">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => apply({ class: params.class === cls ? undefined : cls })}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                params.class === cls
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {cls.replace('Class ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Board</Label>
        <div className="grid grid-cols-2 gap-1">
          {boards.map((board) => (
            <button
              key={board}
              onClick={() => apply({ board: params.board === board ? undefined : board })}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                params.board === board
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {board}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Sort by</Label>
        <div className="space-y-1">
          {[
            { label: 'Highest rated', value: 'rating' },
            { label: 'Newest', value: 'newest' },
            { label: 'Fee: low to high', value: 'fee_asc' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => apply({ sort: value as any })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                params.sort === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}