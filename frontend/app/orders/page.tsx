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
import { ShoppingBag, QrCode, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ordersApi } from '@/lib/api-service';
import type { Order } from '@/types';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending Payment', badge: 'secondary', icon: Clock },
  paid: { label: 'Paid', badge: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', badge: 'destructive', icon: AlertCircle },
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    ordersApi.getAll()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            My Orders
          </h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Browse our courses and start learning</p>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                const Icon = s.icon;
                return (
                  <Card key={order.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={s.badge} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {s.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground truncate flex-1 mr-4">
                              {item.course?.title ?? `Course ${item.courseId.slice(0, 8)}`}
                            </span>
                            <span className="font-medium shrink-0">
                              {item.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {order.coupon && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon ({order.coupon.code})</span>
                          <span>-{order.coupon.discount}%</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">{order.finalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {order.status === 'pending' && (
                        <Button className="w-full mt-2" asChild>
                          <Link href={`/orders/${order.id}`}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Pay Now
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
