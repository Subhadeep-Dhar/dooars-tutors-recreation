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

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!profile) return (
    <div className="text-center py-12">
      <p style={{ color: 'var(--text-muted)' }}>Create your profile first.</p>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Media Gallery</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload photos and videos to showcase your teaching environment and achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Uploaded Media Grid */}
        <div className="lg:col-span-2 space-y-6">
          {profile.media?.length > 0 ? (
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardHeader>
                <CardTitle className="text-base">Uploaded media ({profile.media.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                  {profile.media.map((item: any) => (
                    <div key={item._id} className="relative group rounded-xl overflow-hidden aspect-video" style={{ background: 'var(--bg-elevated)' }}>
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          {item.thumbnailUrl
                            ? <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            : <Video size={32} style={{ color: 'var(--text-muted)' }} />
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
            <div className="py-16 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
              <Image size={40} className="mx-auto mb-4 opacity-40" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No media uploaded yet. Adding photos builds trust!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Upload Form & Guidelines */}
        <div className="space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader><CardTitle className="text-base">Upload new media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{
                        background: category === cat ? 'var(--gradient-to)' : 'transparent',
                        color: category === cat ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${category === cat ? 'var(--gradient-to)' : 'var(--border)'}`
                      }}
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
                className="w-full gap-2 btn-secondary py-6 shadow-sm"
                variant="outline"
              >
                <Upload size={18} />
                {uploading ? 'Uploading...' : 'Choose image or video'}
              </Button>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>JPEG, PNG, WebP (max 10MB)<br/>MP4 (max 50MB)</p>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CardContent className="p-5">
              <h3 className="font-medium text-emerald-500 mb-2">Media Guidelines</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                High-quality photos of your classroom or teaching materials significantly increase trust. Avoid blurry or heavily edited images.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}