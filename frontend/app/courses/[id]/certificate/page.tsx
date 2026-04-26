import { Metadata } from 'next';
import Certificate from '@/components/courses/certificate';

export const metadata: Metadata = {
  title: 'Certificate of Completion',
  description: 'Download your certificate of completion',
};

interface CertificatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;
  
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Certificate courseId={id} />
      </div>
    </div>
  );
}
