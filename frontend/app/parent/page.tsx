'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  UserPlus,
  BookOpen,
  TrendingUp,
  Trophy,
  GraduationCap,
  Mail,
  Hash,
  Calendar,
  Activity,
  FileText,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { parentsApi } from '@/lib/api-service';
import type { ParentChild, ParentChildDashboard } from '@/types';
import { cn } from '@/lib/utils';

function formatDt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function initials(first?: string | null, last?: string | null, username?: string) {
  const a = (first?.trim()?.[0] ?? '').toUpperCase();
  const b = (last?.trim()?.[0] ?? '').toUpperCase();
  if (a && b) return a + b;
  if (a) return a + (username?.[1]?.toUpperCase() ?? '');
  return (username?.slice(0, 2) ?? '?').toUpperCase();
}

export default function ParentPage() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ParentChild[]>([]);
  const [dashboardByChild, setDashboardByChild] = useState<Record<string, ParentChildDashboard>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDashId, setLoadingDashId] = useState<string | null>(null);
  const [childIdentifier, setChildIdentifier] = useState('');
  const [linking, setLinking] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const dashboardCacheRef = useRef<Record<string, ParentChildDashboard>>({});

  const loadDashboard = useCallback(async (cid: string) => {
    setSelectedChild(cid);
    if (dashboardCacheRef.current[cid]) {
      setDashboardByChild((prev) => ({ ...prev, [cid]: dashboardCacheRef.current[cid] }));
      return;
    }
    try {
      setLoadingDashId(cid);
      const dash = await parentsApi.getChildDashboard(cid);
      dashboardCacheRef.current[cid] = dash;
      setDashboardByChild((prev) => ({ ...prev, [cid]: dash }));
    } catch {
      toast.error('Could not load learner details');
    } finally {
      setLoadingDashId(null);
    }
  }, []);

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          parentsApi.getChildren(),
          parentsApi.getOutgoingPending().catch(() => [] as ParentChild[]),
        ]);
        if (cancelled) return;
        setChildren(c);
        setPendingRequests(p);
        const firstAccepted = c.find((ch) => ch.status === 'accepted');
        if (firstAccepted) await loadDashboard(firstAccepted.childId);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, loadDashboard]);

  const refreshLinks = async () => {
    const [c, p] = await Promise.all([
      parentsApi.getChildren(),
      parentsApi.getOutgoingPending().catch(() => [] as ParentChild[]),
    ]);
    setChildren(c);
    setPendingRequests(p);
  };

  const linkChild = async () => {
    if (!childIdentifier.trim()) return;
    try {
      setLinking(true);
      await parentsApi.linkChild(childIdentifier.trim());
      toast.success('Link request sent! The learner must accept it.');
      setChildIdentifier('');
      await refreshLinks();
    } catch {
      toast.error('Failed to send link request');
    } finally {
      setLinking(false);
    }
  };

  const cancelPending = async (linkId: string) => {
    try {
      await parentsApi.cancelOutgoingRequest(linkId);
      toast.success('Request cancelled');
      await refreshLinks();
    } catch {
      toast.error('Could not cancel request');
    }
  };

  const unlinkChild = async (childId: string) => {
    try {
      await parentsApi.unlinkChild(childId);
      toast.success('Link removed');
      delete dashboardCacheRef.current[childId];
      setDashboardByChild((prev) => {
        const next = { ...prev };
        delete next[childId];
        return next;
      });
      if (selectedChild === childId) setSelectedChild(null);
      await refreshLinks();
    } catch {
      toast.error('Could not remove link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const dash = selectedChild ? dashboardByChild[selectedChild] : undefined;
  const enrollments = dash?.enrollments ?? [];
  const completedCount = enrollments.filter((e) => e.progress >= 100).length;
  const inProgressCount = enrollments.filter((e) => e.progress > 0 && e.progress < 100).length;
  const notStartedCount = enrollments.filter((e) => e.progress === 0).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / enrollments.length)
    : 0;
  const parentName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    'Parent';

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-1 pb-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </span>
            Bảng điều khiển Phụ huynh
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Xin chào, <span className="font-medium text-foreground">{parentName}</span>. Dưới đây là tất cả thông tin về các con em được liên kết: khóa học, tiến độ bài học, chứng chỉ, và hoạt động học tập.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {children.filter((c) => c.status === 'accepted').length} đã liên kết
          </Badge>
          {pendingRequests.length > 0 && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 text-xs">
              {pendingRequests.length} yêu cầu chờ xử lý
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(280px,340px)_1fr]">
        <div className="space-y-6">
          <Card className="border-primary/15 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Liên kết con em
              </CardTitle>
              <CardDescription>
                Nhập email, tên tài khoản, hoặc ID tài khoản của con em. Con em sẽ phải chấp nhận trên bảng điều khiển của mình.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Email, tên tài khoản, hoặc ID tài khoản"
                value={childIdentifier}
                onChange={(e) => setChildIdentifier(e.target.value)}
                autoComplete="off"
              />
              <Button
                className="w-full"
                onClick={linkChild}
                disabled={linking || !childIdentifier.trim()}
              >
                {linking ? 'Đang gửi…' : 'Gửi yêu cầu liên kết'}
              </Button>
            </CardContent>
          </Card>

          {pendingRequests.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-amber-950">Chờ con em phản hồi</CardTitle>
                <CardDescription className="text-amber-900/80">
                  Những yêu cầu này đang chờ học sinh chấp nhận hoặc từ chối.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-amber-100 bg-white p-3 text-sm shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium truncate">
                          {req.child?.firstName || req.child?.lastName
                            ? [req.child?.firstName, req.child?.lastName].filter(Boolean).join(' ')
                            : req.child?.username ?? 'Learner'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {req.child?.email ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          @{req.child?.username ?? '—'}
                        </p>
                        {req.createdAt && (
                          <p className="text-[11px] text-muted-foreground">Sent {formatDt(req.createdAt)}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 text-xs"
                        onClick={() => cancelPending(req.id)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Con em được liên kết</CardTitle>
              <CardDescription>Chọn một để xem chi tiết đầy đủ bên phải.</CardDescription>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Chưa có con em được liên kết.</p>
              ) : (
                <div className="space-y-2">
                  {children.map((link) => {
                    const d = dashboardByChild[link.childId];
                    const nCourses = d?.enrollments.length ?? 0;
                    const isSel = selectedChild === link.childId;
                    return (
                      <div
                        key={link.id}
                        className={cn(
                          'flex rounded-xl border p-2 transition-colors',
                          isSel ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <button
                          type="button"
                          disabled={link.status !== 'accepted' || loadingDashId === link.childId}
                          className={cn(
                            'flex flex-1 min-w-0 gap-3 rounded-lg p-2 text-left transition-colors',
                            link.status === 'accepted' ? 'hover:bg-background/80' : 'opacity-60 cursor-not-allowed',
                          )}
                          onClick={() => link.status === 'accepted' && void loadDashboard(link.childId)}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initials(link.child?.firstName, link.child?.lastName, link.child?.username)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {link.child?.firstName || link.child?.lastName
                                ? [link.child?.firstName, link.child?.lastName].filter(Boolean).join(' ')
                                : link.child?.username}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{link.child?.email}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {link.status === 'accepted' ? 'Đã chấp nhận' : 'Chờ xử lý'}
                              </Badge>
                              {link.status === 'accepted' && (
                                <span className="text-[10px] text-muted-foreground">
                                  {nCourses} khóa học
                                </span>
                              )}
                            </div>
                            {link.createdAt && link.status === 'accepted' && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Liên kết từ {formatDt(link.createdAt)}
                              </p>
                            )}
                          </div>
                        </button>
                        {link.status === 'accepted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 self-center text-destructive hover:text-destructive text-xs"
                            onClick={() => unlinkChild(link.childId)}
                          >
                            Hủy liên kết
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {!selectedChild || !dash ? (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="text-center max-w-md mx-auto space-y-3">
                  <GraduationCap className="h-14 w-14 text-muted-foreground/30 mx-auto" />
                  <h3 className="text-lg font-semibold text-foreground">Chọn con em</h3>
                  <p className="text-sm text-muted-foreground">
                    {children.some((c) => c.status === 'accepted')
                      ? 'Chọn một tài khoản được liên kết ở bên trái để xem khóa học, chứng chỉ, và hoạt động học tập.'
                      : 'Liên kết con em trước. Sau khi con em chấp nhận, toàn bộ thông tin học tập sẽ hiển thị ở đây.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden border-primary/20 shadow-md">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/8 via-background to-muted/30 p-6 sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg font-bold text-primary">
                        {initials(dash.child.firstName, dash.child.lastName, dash.child.username)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            {[dash.child.firstName, dash.child.lastName].filter(Boolean).join(' ') ||
                              dash.child.username}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {dash.child.email}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-xs">
                              <Hash className="h-3.5 w-3.5" />@{dash.child.username}
                            </span>
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                          <div className="rounded-lg border bg-background/80 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">ID tài khoản</p>
                            <p className="font-mono text-xs break-all mt-0.5">{dash.child.id}</p>
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Thành viên từ</p>
                            <p className="text-xs mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {formatDt(dash.child.createdAt)}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Trạng thái tài khoản</p>
                            <p className="mt-0.5 flex items-center gap-1.5">
                              {dash.child.isActive ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-xs">Hoạt động</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-destructive" />
                                  <span className="text-xs">Không hoạt động</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-background/80 px-3 py-2 sm:col-span-2 lg:col-span-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Liên kết phụ huynh (kết nối của bạn)
                            </p>
                            <p className="text-xs mt-0.5">
                              Liên kết từ <strong>{formatDt(dash.link.linkedAt)}</strong>
                              <span className="text-muted-foreground"> · Link ID </span>
                              <span className="font-mono text-[11px]">{dash.link.id}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{enrollments.length}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Khóa học đang ghi danh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{avgProgress}%</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Tiến độ trung bình</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{dash.certificates.length}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Chứng chỉ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <Activity className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{dash.activity.videoLessonsCompleted}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Bài học đã hoàn thành</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-muted">
                  <CardContent className="pt-4 pb-3 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-orange-500/90" />
                    <div>
                      <p className="text-xl font-bold">{dash.activity.assignmentSubmissions}</p>
                      <p className="text-xs text-muted-foreground">Nộp bài tập (bài luận)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4 pb-3 flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-sky-500/90" />
                    <div>
                      <p className="text-xl font-bold">{dash.activity.quizAttempts}</p>
                      <p className="text-xs text-muted-foreground">Làm bài quiz (hoàn thành)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-[11px] font-medium text-muted-foreground mb-2">Kết quả khóa học</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">{completedCount} hoàn thành</Badge>
                      <Badge variant="outline">{inProgressCount} đang học</Badge>
                      <Badge variant="outline">{notStartedCount} chưa bắt đầu</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {enrollments.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Tiến độ tổng thể (các khóa học đã ghi danh)</CardTitle>
                    <CardDescription>Trung bình tiến độ của từng khóa học tính theo phần trăm.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{avgProgress}%</span>
                    </div>
                    <Progress value={avgProgress} className="h-3" />
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Tất cả khóa học đã ghi danh
                  </CardTitle>
                  <CardDescription>
                    Mọi khóa học mà học sinh đã ghi danh, bao gồm giáo viên, trạng thái, giá, và tiến độ hoàn thành bài học.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-6 pb-6">Chưa ghi danh khóa học nào.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[72px]"> </TableHead>
                            <TableHead>Khóa học</TableHead>
                            <TableHead className="hidden md:table-cell">Giáo viên</TableHead>
                            <TableHead className="hidden lg:table-cell">Trạng thái</TableHead>
                            <TableHead className="text-right">Giá</TableHead>
                            <TableHead className="hidden sm:table-cell">Ghi danh</TableHead>
                            <TableHead className="text-right">Tiến độ</TableHead>
                            <TableHead className="hidden xl:table-cell text-right">Bài học</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrollments.map((row) => {
                            const c = row.course;
                            const thumb = c.thumbnail;
                            const authorLabel =
                              [c.author?.firstName, c.author?.lastName].filter(Boolean).join(' ') ||
                              c.author?.username;
                            return (
                              <TableRow key={row.id}>
                                <TableCell className="align-middle">
                                  <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                                    {thumb ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      'No img'
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[220px]">
                                  <p className="font-medium leading-snug">{c.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {c.description ? c.description : '—'}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1 xl:hidden">
                                    Bài học: {row.stats.completedLessons}/{row.stats.totalLessons} · Sections:{' '}
                                    {c._count?.sections ?? 0}
                                  </p>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm">
                                  <span className="font-medium">{authorLabel}</span>
                                  <p className="text-xs text-muted-foreground font-mono">@{c.author?.username}</p>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <Badge variant="outline" className="capitalize font-normal">
                                    {c.status ?? '—'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-sm">
                                  {typeof c.price === 'number' ? `${c.price.toLocaleString()}` : '—'}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-xs whitespace-nowrap">
                                  {formatDt(row.createdAt)}
                                </TableCell>
                                <TableCell className="text-right align-middle">
                                  <span className="font-semibold tabular-nums">{Math.round(row.progress)}%</span>
                                  <Progress value={row.progress} className="h-1.5 mt-1 w-24 ml-auto max-w-full" />
                                </TableCell>
                                <TableCell className="hidden xl:table-cell text-right text-sm tabular-nums">
                                  {row.stats.completedLessons}/{row.stats.totalLessons}
                                  <p className="text-[11px] text-muted-foreground font-normal">
                                    {c._count?.sections ?? 0} sections
                                  </p>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    Chứng chỉ
                  </CardTitle>
                  <CardDescription>
                    Được cấp khi học sinh hoàn thành khóa học (cùng quy tắc trên tài khoản của họ). Bạn có thể mở liên kết xác minh công khai cho mỗi mã.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 pb-6">
                  {dash.certificates.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-6">Chưa có chứng chỉ nào.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Khóa học</TableHead>
                            <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
                            <TableHead>Ngày cấp</TableHead>
                            <TableHead className="min-w-[200px]">Mã & xác minh</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dash.certificates.map((cert) => (
                            <TableRow key={cert.id}>
                              <TableCell>
                                <p className="font-medium">{cert.course?.title ?? '—'}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{cert.courseId}</p>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="secondary" className="capitalize">
                                  {cert.course?.status ?? '—'}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">{formatDt(cert.issuedAt)}</TableCell>
                              <TableCell>
                                <code className="text-[11px] break-all block bg-muted/50 rounded px-2 py-1">
                                  {cert.code}
                                </code>
                                <Link
                                  href={`/certificates/verify/${cert.code}`}
                                  className="text-xs text-primary hover:underline mt-1 inline-block"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Mở trang xác minh
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Các con số cập nhật gần như thời gian thực từ nền tảng. "Bài học đã hoàn thành" là số bài học học sinh đã đánh dấu là xong trong phần phát; số lượng bài tập và quiz bao gồm tất cả nộp bài/thử trên tài khoản của họ. Nếu có gì có vẻ sai, hãy yêu cầu họ làm mới hoặc liên hệ hỗ trợ.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
