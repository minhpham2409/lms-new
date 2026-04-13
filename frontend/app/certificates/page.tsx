'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Download, ExternalLink, Star } from 'lucide-react';
import { certificatesApi } from '@/lib/api-service';
import type { Certificate } from '@/types';
import Link from 'next/link';

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    certificatesApi.getMine()
      .then(setCertificates)
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

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
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              My Certificates
            </h1>
            <Badge variant="secondary">{certificates.length} earned</Badge>
          </div>

          {certificates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <Trophy className="h-20 w-20 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No certificates yet</h3>
                  <p className="text-gray-500 mb-6">Complete courses to earn certificates</p>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {certificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-shadow"
                >
                  <div className="h-2 bg-gradient-to-r from-yellow-400 to-orange-400" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-yellow-100 rounded-full shrink-0">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">{cert.course?.title ?? 'Course'}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          by {cert.course?.author?.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm font-medium text-yellow-700">Completed</span>
                    </div>
                    <Separator className="border-yellow-200" />
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Issued</span>
                        <span className="font-medium">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Certificate ID</span>
                        <span className="font-mono text-xs bg-white/60 px-1.5 py-0.5 rounded">
                          {cert.code.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 border-yellow-300 hover:bg-yellow-100" asChild>
                        <Link href={`/certificates/verify/${cert.code}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Verify
                        </Link>
                      </Button>
                      <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
