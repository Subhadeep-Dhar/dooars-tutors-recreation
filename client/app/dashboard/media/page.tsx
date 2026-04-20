'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Image, Video } from 'lucide-react';
import api from '@/lib/api';

const CATEGORIES = ['gallery', 'facility', 'class', 'achievement'];

export default function MediaPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => setProfile(res.data.data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await api.post(`/profiles/${profile._id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data.data.profile);
      toast.success('Media uploaded successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(mediaId: string) {
    if (!confirm('Delete this media item?')) return;
    try {
      const res = await api.delete(`/profiles/${profile._id}/media/${mediaId}`);
      setProfile(res.data.data.profile);
      toast.success('Media deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  if (loading) return <div className="text-slate-400">Loading...</div>;
  if (!profile) return (
    <div className="text-center py-12">
      <p className="text-slate-500">Create your profile first.</p>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Media</h1>

      {/* Upload card */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Upload new media</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors ${
                    category === cat
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full gap-2"
            variant="outline"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Choose image or video'}
          </Button>
          <p className="text-xs text-slate-400">Supported: JPEG, PNG, WebP (max 10MB), MP4 (max 50MB)</p>
        </CardContent>
      </Card>

      {/* Media grid */}
      {profile.media?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded media ({profile.media.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.media.map((item: any) => (
                <div key={item._id} className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-video">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      {item.thumbnailUrl
                        ? <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        : <Video size={32} className="text-slate-400" />
                      }
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 text-white text-xs bg-black/40 px-2 py-1 rounded-full">
                      {item.type === 'image' ? <Image size={11} /> : <Video size={11} />}
                      <span className="capitalize">{item.category}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Image size={32} className="mx-auto mb-3 opacity-40" />
          <p>No media uploaded yet</p>
        </div>
      )}
    </div>
  );
}