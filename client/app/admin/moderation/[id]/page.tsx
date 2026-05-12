'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Globe, 
  MessageSquare, 
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

export default function ProfileReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/moderation/${id}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load profile details');
      router.push('/admin/moderation');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function action(type: 'approve' | 'reject') {
    try {
      await api.post(`/admin/profiles/${id}/${type}`);
      toast.success(`Profile ${type}d`);
      router.push('/admin/moderation');
    } catch {
      toast.error('Action failed');
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading review data...</div>;
  if (!data) return null;

  const { profile, enrichmentData } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" className="btn-secondary gap-2" onClick={() => router.back()}>
          <ArrowLeft size={14} /> Back to Queue
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-green-600 hover:bg-green-700 h-9 gap-2 shadow-lg"
            onClick={() => action('approve')}
          >
            <CheckCircle size={16} /> Approve Profile
          </Button>
          <Button 
            variant="outline" 
            className="text-red-500 border-red-500/30 hover:bg-red-500/10 h-9 gap-2"
            onClick={() => action('reject')}
          >
            <XCircle size={16} /> Reject
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Data & Source */}
        <div className="lg:col-span-2 space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader className="border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {profile.displayName}
                  </CardTitle>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profile.type.replace('_', ' ')} • {profile.address?.town}</p>
                </div>
                <Badge variant="outline" className="h-6">{profile.verificationStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comparison Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original/Manual Data */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Original Data (Google/Manual)</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>CONTACT</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{profile.contact?.phone || 'No phone'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{profile.contact?.website || 'No website'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>ADDRESS</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {profile.address?.line1}, {profile.address?.town}, {profile.address?.district}, {profile.address?.state} {profile.address?.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Enriched Data */}
                <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <ShieldCheck size={14} className="text-primary opacity-20" />
                  </div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-primary">AI Enriched Data</h3>
                  <div className="space-y-4">
                    {profile.subjects?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-primary opacity-70">SUBJECTS ({Math.round((profile.extractionConfidence?.subjects || 0) * 100)}%)</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.subjects.map((s: string) => (
                            <Badge key={s} className="bg-primary/10 text-primary border-primary/20 text-[10px] h-4">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.courses?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-primary opacity-70">COURSES ({Math.round((profile.extractionConfidence?.courses || 0) * 100)}%)</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{profile.courses.join(', ')}</p>
                      </div>
                    )}
                    {profile.whatsappNumber && (
                      <div>
                        <p className="text-[10px] font-bold text-primary opacity-70">WHATSAPP ({Math.round((profile.extractionConfidence?.whatsappNumber || 0) * 100)}%)</p>
                        <p className="text-sm font-bold flex items-center gap-1 text-green-600">
                          <Smartphone size={12} /> {profile.whatsappNumber}
                        </p>
                      </div>
                    )}
                    {profile.socialLinks && Object.values(profile.socialLinks).some(v => !!v) && (
                      <div>
                        <p className="text-[10px] font-bold text-primary opacity-70">SOCIAL LINKS</p>
                        <div className="flex gap-2 mt-1">
                          {Object.entries(profile.socialLinks)
                            .filter(([, v]) => v)
                            .map(([k]) => (
                              <Badge key={k} variant="outline" className="text-[10px] h-4 lowercase">{k}</Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {profile.enrichedDescription && (
                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold mb-2 text-primary opacity-70 uppercase tracking-wider">Generated AI Description</p>
                  <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                    "{profile.enrichedDescription}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Potential Duplicates */}
          {data.duplicates?.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30 shadow-sm" style={{ border: '1px solid var(--amber-200)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700">
                  <AlertCircle size={14} /> Potential Duplicates Detected ({data.duplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.duplicates.map((dup: any) => (
                  <div key={dup._id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm border-amber-100">
                    <div>
                      <p className="text-sm font-bold text-amber-900">{dup.displayName}</p>
                      <p className="text-[10px] text-amber-700">{dup.address?.town} • {dup.verificationStatus}</p>
                      <p className="text-[10px] font-mono text-amber-600 mt-1">Similarity: {Math.round(dup.similarity * 100)}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/moderation/${dup._id}`} target="_blank">
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-white">Compare</Button>
                      </Link>
                      <Button size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700">Merge Into This</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Website Content Snippets */}
          {enrichmentData?.snippets && (
            <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Source Content Snippets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(enrichmentData.snippets).map(([key, content]: [string, any]) => (
                    content && (
                      <div key={key} className="space-y-1">
                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{key}</p>
                        <div className="p-3 rounded-lg bg-gray-50 text-[11px] leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border" style={{ borderColor: 'var(--border)' }}>
                          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Metadata & Audit */}
        <div className="space-y-6">
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Import Source</p>
                  <p className="text-xs font-medium">{profile.source || 'Manual'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Batch ID</p>
                  <p className="text-xs font-mono">{profile.importBatchId || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Priority</p>
                  <p className="text-xs font-medium">{profile.sourcePriority || 50}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Created At</p>
                  <p className="text-xs font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Manual Protection</p>
                </div>
                {profile.manuallyEditedFields?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.manuallyEditedFields.map((f: string) => (
                      <Badge key={f} variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>No manual edits detected. Full AI overwrite allowed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Audit */}
          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Imported</p>
                    <p className="text-xs">{new Date(profile.importedAt || profile.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {profile.lastEnrichedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Enriched by AI</p>
                      <p className="text-xs">{new Date(profile.lastEnrichedAt).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Version: {profile.enrichmentVersion}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
