'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send } from 'lucide-react';
import { commentsApi } from '@/lib/api-service';
import type { Comment } from '@/types';

export function LessonComments({ lessonId }: { lessonId: string }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = () => {
    if (status !== 'authenticated' || !session?.accessToken) {
      setLoading(false);
      return;
    }
    commentsApi
      .getByLesson(lessonId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [lessonId, status, session?.accessToken]);

  const submit = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await commentsApi.create(lessonId, { content: text.trim() });
      setText('');
      toast.success('Comment posted');
      load();
    } catch {
      toast.error('Could not post comment (enrollment required)');
    } finally {
      setSending(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      await commentsApi.reply(lessonId, parentId, { content: replyText.trim() });
      setReplyText('');
      setReplyTo(null);
      toast.success('Reply posted');
      load();
    } catch {
      toast.error('Could not post reply');
    } finally {
      setSending(false);
    }
  };

  if (status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sign in and enroll to join the discussion.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading comments…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Ask a question or share a note about this lesson…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <Button size="sm" onClick={submit} disabled={sending || !text.trim()}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? 'Sending…' : 'Post comment'}
          </Button>
        </div>

        <div className="space-y-4 border-t pt-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            items.map((c) => (
              <div key={c.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium">
                    {c.user?.username ?? 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReplyTo((prev) => (prev === c.id ? null : c.id))}
                >
                  Reply
                </Button>
                {replyTo === c.id && (
                  <div className="pl-3 border-l-2 space-y-2">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={sending || !replyText.trim()}
                      onClick={() => submitReply(c.id)}
                    >
                      Send reply
                    </Button>
                  </div>
                )}
                {(c.replies ?? []).length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 mt-2">
                    {(c.replies ?? []).map((r) => (
                      <div key={r.id} className="text-sm">
                        <span className="font-medium">{r.user?.username ?? 'User'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(r.createdAt).toLocaleString('vi-VN')}
                        </span>
                        <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
