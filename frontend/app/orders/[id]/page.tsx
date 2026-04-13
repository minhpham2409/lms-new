'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { use } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, CheckCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { ordersApi, paymentsApi } from '@/lib/api-service';
import type { Order, Payment } from '@/types';
import Link from 'next/link';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    ordersApi.getById(id)
      .then((o) => {
        setOrder(o);
        if (o.payment) setPayment(o.payment);
      })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, id]);

  const generateQr = async () => {
    try {
      setGeneratingQr(true);
      const p = await paymentsApi.createQr(id);
      setPayment(p);
      toast.success('QR code generated! Scan to pay.');
    } catch {
      toast.error('Failed to generate QR code');
    } finally {
      setGeneratingQr(false);
    }
  };

  const checkPayment = useCallback(async () => {
    try {
      setChecking(true);
      const p = await paymentsApi.getStatus(id);
      setPayment(p);
      if (p.status === 'paid') {
        toast.success('Payment confirmed! You are now enrolled.');
        setOrder((prev) => prev ? { ...prev, status: 'paid' } : prev);
      } else {
        toast.info('Payment not confirmed yet. Please try again after paying.');
      }
    } catch {
      toast.error('Failed to check payment status');
    } finally {
      setChecking(false);
    }
  }, [id]);

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

  if (!order) return null;

  const isPaid = order.status === 'paid' || payment?.status === 'paid';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <MainNav />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
            </Link>
          </Button>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{id.slice(0, 8)}</CardTitle>
                  <Badge variant={isPaid ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {isPaid ? (
                      <><CheckCircle className="h-3 w-3" /> Paid</>
                    ) : (
                      <><Clock className="h-3 w-3" /> Pending Payment</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.course?.title ?? 'Course'}</span>
                    <span className="font-medium">{item.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary text-lg">{order.finalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </CardContent>
            </Card>

            {!isPaid && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Payment via VietQR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payment?.qrData ? (
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 inline-block">
                        <img
                          src={payment.qrData}
                          alt="VietQR Payment"
                          className="w-56 h-56 mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {!payment.qrData.startsWith('data:') && (
                          <div className="w-56 h-56 flex items-center justify-center bg-gray-100 rounded mx-auto">
                            <div className="text-center">
                              <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">QR Code</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Amount: <strong>{order.finalPrice.toLocaleString('vi-VN')}đ</strong></p>
                        <p className="font-mono text-xs">Ref: {payment.txnRef}</p>
                      </div>
                      <Button onClick={checkPayment} disabled={checking} variant="outline" className="w-full">
                        <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'Check Payment Status'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-gray-50 rounded-lg p-8">
                        <QrCode className="h-20 w-20 text-gray-300 mx-auto mb-3" />
                        <p className="text-muted-foreground">Generate a QR code to pay via bank transfer</p>
                      </div>
                      <Button onClick={generateQr} disabled={generatingQr} className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        {generatingQr ? 'Generating...' : 'Generate Payment QR'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isPaid && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-6 text-center space-y-3">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-lg font-bold text-green-800">Payment Successful!</h3>
                  <p className="text-green-700">You are now enrolled in all purchased courses.</p>
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
