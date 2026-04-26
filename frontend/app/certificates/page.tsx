'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Download, ExternalLink, Star } from 'lucide-react';
import { certificatesApi } from '@/lib/api-service';
import type { Certificate } from '@/types';
import Link from 'next/link';

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (!session?.accessToken) return;
    certificatesApi.getMine()
      .then(setCertificates)
      .catch(() => toast.error('Không thể tải chứng chỉ'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Chứng chỉ của tôi
            </h1>
            <p className="section-content mt-2">Xem tất cả chứng chỉ bạn đã đạt được</p>
          </div>
          <Badge className="text-lg py-2 px-4">
            {certificates.length} chứng chỉ
          </Badge>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Chưa có chứng chỉ
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Hoàn thành các khóa học để nhận chứng chỉ
            </p>
            <Link href="/courses">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Duyệt khóa học
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <Trophy className="h-12 w-12 text-yellow-500 flex-shrink-0" />
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">
                  {cert.course?.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Hoàn thành:{' '}
                  <span className="font-semibold">
                    {new Date(cert.issuedAt).toLocaleDateString('vi-VN')}
                  </span>
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 mb-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Mã chứng chỉ:
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-50">
                    {cert.code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/certificates/${cert.id}`} className="flex-1">
                    <Button
                      variant="default"
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      toast.info('Tính năng tải xuống sẽ sớm có');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
