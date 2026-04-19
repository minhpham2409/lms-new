"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api-service";
import type { Course } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, Users, Star } from "lucide-react";
import { cn, truncateText } from "@/lib/utils";

type FeaturedCoursesProps = {
  className?: string;
  heading?: string;
  subheading?: string;
};

export function FeaturedCourses({
  className,
  heading = "Featured Courses",
  subheading = "Explore our most popular courses and start your learning journey today",
}: FeaturedCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    coursesApi.getAll()
      .then((data) => setCourses(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getLessonCount = (course: Course) =>
    course.sections?.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0) ?? 0;

  return (
    <section
      className={cn(
        "py-16 bg-gray-50 dark:bg-gray-900",
        className,
      )}
    >
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">{heading}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {subheading}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200 rounded-t-lg" />
                <CardHeader className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="h-44 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-white/40" />
                    </div>
                  )}
                  {course.level && (
                    <Badge className="absolute top-3 left-3 text-xs bg-black/50 text-white border-0 capitalize">
                      {course.level}
                    </Badge>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/95 text-primary font-bold px-2.5 py-1 rounded-full text-sm">
                    {course.price != null && course.price > 0
                      ? `${course.price.toLocaleString('vi-VN')}đ`
                      : 'Free'}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 leading-tight">{course.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> {course.author?.username}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pb-3">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {truncateText(course.description || "No description available", 100)}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{getLessonCount(course)} lessons</span>
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
                  <Button asChild className="w-full">
                    <Link href={`/courses/${course.id}`}>View Course</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No courses available yet.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link href="/courses">View All Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
