'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Flag, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const limit = 10;
  
  useEffect(() => {
    fetchReports();
  }, [page]);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reports?page=${page}&limit=${limit}`);
      setReports(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      await api.patch(`/admin/reports/${id}/status`, { status: newStatus });
      toast.success(`Report marked as ${newStatus}`);
      fetchReports();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-slate-500 mt-2">Manage user-reported profiles</p>
        </div>
        <Button onClick={fetchReports} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Profile Reported</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500">
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-900 dark:text-slate-200 font-medium">{report.reporterId?.email || 'Unknown User'}</div>
                        <div className="text-xs text-slate-500 capitalize">{report.reporterId?.role || ''}</div>
                      </td>
                      <td className="px-4 py-4">
                        {report.reportedProfileId ? (
                          <Link href={`/profiles/${report.reportedProfileId.slug}`} className="text-blue-600 hover:underline font-medium" target="_blank">
                            {report.reportedProfileId.displayName}
                          </Link>
                        ) : (
                          <span className="text-slate-500 italic">Deleted Profile</span>
                        )}
                        <div className="text-xs text-slate-500 capitalize">{report.reportedProfileId?.type?.replace('_', ' ') || ''}</div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2" title={report.reason}>
                          {report.reason}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge 
                          variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        {report.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => updateStatus(report._id, 'resolved')}>
                              <CheckCircle size={14} className="mr-1" /> Resolve
                            </Button>
                            <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-100" onClick={() => updateStatus(report._id, 'dismissed')}>
                              <XCircle size={14} className="mr-1" /> Dismiss
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs uppercase tracking-wider">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {Math.ceil(total / limit) > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-slate-800">
              <div className="text-sm text-slate-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="text-sm font-medium px-2 text-slate-700 dark:text-slate-300">
                  Page {page} of {Math.ceil(total / limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === Math.ceil(total / limit)}
                  onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
