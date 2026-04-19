'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api-service';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Order } from '@/types';

const STATUS_MAP: Record<string, { label: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending', badge: 'secondary', icon: Clock },
  paid: { label: 'Paid', badge: 'default', icon: CheckCircle },
  completed: { label: 'Completed', badge: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelled', badge: 'destructive', icon: AlertCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">All platform orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No orders yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
            const Icon = s.icon;
            return (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.user?.username ?? order.userId} ·{' '}
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge variant={s.badge} className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {s.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground truncate">
                        {item.course?.title ?? item.courseId}
                      </span>
                      <span className="shrink-0">{item.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{order.finalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-xs text-primary hover:underline inline-block pt-1"
                  >
                    View as user (payment)
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
