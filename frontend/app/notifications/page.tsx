'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api-service';
import type { Notification } from '@/types';

const TYPE_STYLES: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
};

const TYPE_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  info: 'secondary',
  success: 'default',
  warning: 'outline',
  error: 'destructive',
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    notificationsApi.getAll()
      .then(setNotifications)
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <MainNav />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500">{unreadCount}</Badge>
              )}
            </h1>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications</h3>
                  <p className="text-gray-500">You&apos;re all caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-lg border transition-all ${
                    n.isRead ? 'bg-white border-gray-100' : (TYPE_STYLES[n.type] || 'bg-blue-50 border-blue-200')
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
                        <h4 className={`font-medium text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                          {n.title}
                        </h4>
                        <Badge variant={TYPE_BADGE[n.type] || 'secondary'} className="text-xs">
                          {n.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => markRead(n.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={() => deleteNotification(n.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
