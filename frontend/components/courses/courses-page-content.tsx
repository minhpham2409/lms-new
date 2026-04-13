'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api-service';
import type { Course } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, User, Users, Search, Star } from 'lucide-react';
import { truncateText } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function CoursesPageContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filtered, setFiltered] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [levelFilter, setLevelFilter] = useState('all');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    coursesApi.getAll()
      .then((data) => {
        setCourses(data);
        setFiltered(data);
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let result = [...courses];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.author?.username.toLowerCase().includes(q)
      );
    }
    if (levelFilter !== 'all') {
      result = result.filter((c) => c.level === levelFilter);
    }
    if (sortBy === 'popular') {
      result.sort((a, b) => (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }
    setFiltered(result);
  }, [courses, search, sortBy, levelFilter]);

  const getLessonCount = (course: Course) =>
    course.sections?.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="container py-10 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="text-center max-w-3xl mx-auto pt-8">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Explore Our Courses</h1>
          <p className="text-muted-foreground text-lg">
            Browse our comprehensive catalog and start your learning journey
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses, topics, or instructors..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 && !isLoading && (
          <p className="text-sm text-muted-foreground -mt-4">
            {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} found
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200 rounded-t-lg" />
                <CardHeader className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const lessonCount = getLessonCount(course);
              return (
                <Card
                  key={course.id}
                  className="flex flex-col h-full hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <div className="h-44 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-white/40" />
                      </div>
                    )}
                    {course.level && (
                      <Badge className="absolute top-3 left-3 text-xs capitalize bg-black/50 hover:bg-black/50 text-white border-0">
                        {course.level}
                      </Badge>
                    )}
                    {course.price != null && (
                      <div className="absolute bottom-3 right-3 bg-white/95 text-primary font-bold px-2.5 py-1 rounded-full text-sm">
                        {course.price > 0 ? `${course.price.toLocaleString('vi-VN')}đ` : 'Free'}
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {course.author?.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pb-3">
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {truncateText(course.description || 'No description available', 100)}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{lessonCount} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{course._count?.enrollments ?? 0} enrolled</span>
                      </div>
                      {course.averageRating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{course.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/courses/${course.id}`);
                      }}
                    >
                      {session ? 'View Course' : 'Learn More'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search or filters' : 'No courses available yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
