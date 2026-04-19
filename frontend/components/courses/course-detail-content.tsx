'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  User,
  Users,
  CheckCircle,
  Lock,
  ArrowLeft,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Star,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { enrollmentsApi, cartApi } from '@/lib/api-service';
import type { Course, Review } from '@/types';

interface Props {
  course: Course;
  reviews?: Review[];
}

export default function CourseDetailContent({ course, reviews = [] }: Props) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    enrollmentsApi.checkStatus(course.id)
      .then((s) => setIsEnrolled(s.enrolled))
      .catch(() => {});
    cartApi.get()
      .then((items) => setInCart(items.some((i) => i.courseId === course.id)))
      .catch(() => {});
  }, [session, course.id]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/courses/${course.id}`);
      return;
    }
    try {
      setIsEnrolling(true);
      await enrollmentsApi.enroll(course.id);
      toast.success("You've enrolled in this course!");
      setIsEnrolled(true);
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 409) {
        toast.info("You're already enrolled!");
        setIsEnrolled(true);
      } else {
        toast.error('Failed to enroll. Please try again.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/courses/${course.id}`);
      return;
    }
    if (inCart) {
      router.push('/cart');
      return;
    }
    try {
      setAddingToCart(true);
      await cartApi.addItem(course.id);
      setInCart(true);
      toast.success('Added to cart!');
    } catch {
      toast.error('Could not add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewCourse = () => {
    const firstSection = course.sections?.[0];
    const firstLesson = firstSection?.lessons?.[0];
    if (firstLesson) {
      router.push(`/courses/${course.id}/lessons/${firstLesson.id}`);
    } else {
      toast.info('This course has no lessons yet.');
    }
  };

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0) ?? 0;
  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="container py-10 px-4 md:px-6 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        className="mt-16 mb-6"
        onClick={() => router.push('/courses')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to courses
      </Button>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          {course.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-6 h-64">
              <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {course.level && <Badge variant="outline">{course.level}</Badge>}
            {course.status && (
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{course.author?.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{course._count?.enrollments ?? 0} students</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="py-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>About This Course</h3>
                <p>{course.description || 'No description available.'}</p>
                <h3 className="mt-8">What You&apos;ll Learn</h3>
                <ul>
                  <li>Gain hands-on experience with practical exercises</li>
                  <li>Build real-world projects for your portfolio</li>
                  <li>Learn at your own pace with on-demand video lectures</li>
                  <li>Receive a certificate upon completion</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="curriculum" className="py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Course Content</h3>
                <span className="text-sm text-muted-foreground">
                  {course.sections?.length ?? 0} sections • {totalLessons} lessons
                </span>
              </div>
              {(course.sections ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(course.sections ?? []).map((section) => (
                    <Card key={section.id} className="overflow-hidden">
                      <button
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {section.title}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {section.lessons?.length ?? 0} lessons
                        </Badge>
                      </button>
                      {expandedSections.has(section.id) && (
                        <div className="border-t">
                          {(section.lessons ?? []).map((lesson, idx) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-muted flex items-center justify-center w-7 h-7 rounded-full text-xs shrink-0">
                                  {idx + 1}
                                </div>
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.videoUrl && (
                                  <PlayCircle className="h-3.5 w-3.5 text-blue-500" />
                                )}
                              </div>
                              {isEnrolled ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg text-muted-foreground">
                  No curriculum available yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="py-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{review.user?.username ?? 'User'}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="sticky top-6 shadow-lg">
            {isEnrolled ? (
              <>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-snug">Keep going</CardTitle>
                  <CardDescription className="text-sm">
                    Pick up where you left off — one tap to open the classroom.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-2 pt-0">
                  <Button className="w-full" size="lg" onClick={handleViewCourse}>
                    <PlayCircle className="h-4 w-4 mr-2" /> Continue learning
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your enrolled courses also appear on{' '}
                    <button
                      type="button"
                      className="text-primary underline-offset-4 hover:underline font-medium"
                      onClick={() => router.push('/dashboard')}
                    >
                      Dashboard → My courses
                    </button>
                  </p>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  {course.price != null && course.price > 0 ? (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-3xl font-bold">{course.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-green-600 mb-1">Free</div>
                  )}
                  <CardTitle className="text-base">Join This Course</CardTitle>
                  <CardDescription>Start learning today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Certificate</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course._count?.enrollments ?? 0} enrolled</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    {[
                      'Full lifetime access',
                      'Access on any device',
                      'Project files & resources',
                      'Certificate of completion',
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {course.price != null && course.price > 0 ? (
                    <Button className="w-full" onClick={handleAddToCart} disabled={addingToCart}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {addingToCart ? 'Adding...' : inCart ? 'Go to Cart' : 'Add to Cart'}
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={handleEnroll} disabled={isEnrolling}>
                      {isEnrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                    </Button>
                  )}
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
