'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Bot } from 'lucide-react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const [aiDailyLimit, setAiDailyLimit] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Fetch current limit from our new backend route
        const res = await api.get('/settings/admin');
        if (res.data.success) {
          setAiDailyLimit(res.data.data.aiDailyLimit);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (aiDailyLimit === '') return;
    
    setIsSaving(true);
    try {
      const res = await api.put('/settings/admin', {
        aiDailyLimit: Number(aiDailyLimit)
      });
      
      if (res.data.success) {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Settings</h1>
        <p className="text-muted-foreground">Manage global configurations for Dooars Tutors.</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Assistant Settings
            </CardTitle>
            <CardDescription>
              Configure the limits and behavior of the Dooars Tutors AI Chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="dailyLimit">Daily Query Limit Per User</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="dailyLimit"
                  type="number"
                  min="0"
                  max="100"
                  value={aiDailyLimit}
                  onChange={(e) => setAiDailyLimit(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set how many times a logged-in user can query the AI assistant per day. (0 disables the AI completely)
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving || aiDailyLimit === ''}>
              {isSaving ? 'Saving...' : 'Save Changes'}
              {!isSaving && <Save className="ml-2 w-4 h-4" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
