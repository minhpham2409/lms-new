'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { use } from 'react';
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
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

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

  const generateQr = async (forceRegenerate = false) => {
    try {
      setGeneratingQr(true);
      const p = await paymentsApi.createQr(id, { forceRegenerate });
      setPayment(p);
      toast.success(
        forceRegenerate
          ? 'New payment code created. Use this reference for your transfer.'
          : 'Payment instructions ready. Complete transfer with the reference below.',
      );
    } catch {
      toast.error('Failed to generate payment code');
    } finally {
      setGeneratingQr(false);
    }
  };

  const checkPayment = useCallback(async () => {
    try {
      setChecking(true);
      const o = await ordersApi.getById(id);
      setOrder(o);
      if (o.payment) setPayment(o.payment);
      const paid =
        o.status === 'paid' ||
        o.payment?.status === 'paid' ||
        o.payment?.status === 'completed';
      if (paid) {
        toast.success('Payment confirmed! You are now enrolled.');
      } else {
        toast.info('Payment not confirmed yet. Complete the transfer then tap refresh.');
      }
    } catch {
      toast.error('Failed to check payment status');
    } finally {
      setChecking(false);
    }
  }, [id]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) return null;

  const isPaid =
    order.status === 'paid' ||
    payment?.status === 'paid' ||
    payment?.status === 'completed';

  const hasPaymentCode = !!(payment?.qrData && payment?.txnRef);
  const isImageQr =
    !!payment?.qrData &&
    (payment.qrData.startsWith('data:') ||
      payment.qrData.startsWith('http://') ||
      payment.qrData.startsWith('https://'));

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4">
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
                  {hasPaymentCode ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                        <p className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          Pending payment — your code is saved. You can leave and return here anytime.
                        </p>
                      </div>

                      {isImageQr ? (
                        <div className="text-center">
                          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 inline-block">
                            <img
                              src={payment!.qrData}
                              alt="Payment QR"
                              className="w-56 h-56 mx-auto"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Payment payload (demo)
                          </p>
                          <p className="text-xs font-mono break-all text-foreground">{payment!.qrData}</p>
                        </div>
                      )}

                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount due</span>
                          <strong>{order.finalPrice.toLocaleString('vi-VN')}đ</strong>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">Reference</span>
                          <span className="font-mono text-xs text-right break-all">{payment!.txnRef}</span>
                        </div>
                      </div>

                      <Button onClick={checkPayment} disabled={checking} variant="outline" className="w-full">
                        <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'I paid — refresh status'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => {
                          if (!confirm('Create a new payment code? The old reference will no longer match this order.')) return;
                          void generateQr(true);
                        }}
                        disabled={generatingQr}
                      >
                        {generatingQr ? '…' : 'Create new payment code'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-gray-50 rounded-lg p-8">
                        <QrCode className="h-20 w-20 text-gray-300 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Create a payment code to get a transfer reference. It stays valid until you pay or generate a new one.
                        </p>
                      </div>
                      <Button onClick={() => generateQr(false)} disabled={generatingQr} className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        {generatingQr ? 'Working...' : 'Get payment code'}
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
    </div>
  );
}
