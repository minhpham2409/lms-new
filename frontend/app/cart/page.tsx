'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Tag, BookOpen, ArrowRight } from 'lucide-react';
import { cartApi, ordersApi } from '@/lib/api-service';
import type { CartItem, CouponPreview } from '@/types';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const r = session?.user?.role;
    if (r === 'teacher') {
      setLoading(false);
      router.replace('/teacher');
    } else if (r === 'parent') {
      setLoading(false);
      router.replace('/parent');
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const r = session?.user?.role;
    if (r === 'teacher' || r === 'parent') return;
    if (!session?.accessToken) return;
    cartApi
      .get()
      .then(setItems)
      .catch(() => toast.error('Failed to load cart'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, status, session?.user?.role]);

  const removeItem = async (itemId: string) => {
    try {
      await cartApi.removeItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setCouponPreview(null);
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setApplyingCoupon(true);
      const preview = await cartApi.applyCoupon({
        couponCode,
        courseIds: items.map((i) => i.courseId),
      });
      setCouponPreview(preview);
      toast.success(`Coupon applied! -${preview.discount}%`);
    } catch {
      toast.error('Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const checkout = async () => {
    if (items.length === 0) return;
    try {
      setCheckingOut(true);
      const order = await ordersApi.create({
        courseIds: items.map((i) => i.courseId),
        couponCode: couponCode || undefined,
      });
      toast.success('Order created!');
      router.push(`/orders/${order.id}`);
    } catch {
      toast.error('Failed to create order');
    } finally {
      setCheckingOut(false);
    }
  };

  const totalPrice = items.reduce((acc, i) => acc + (i.course?.price ?? 0), 0);
  const safeFinal =
    couponPreview != null &&
    typeof couponPreview.finalTotal === 'number' &&
    !Number.isNaN(couponPreview.finalTotal)
      ? couponPreview.finalTotal
      : totalPrice;
  const savings = Math.max(0, totalPrice - safeFinal);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" /> Shopping Cart
            {items.length > 0 && (
              <Badge variant="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
            )}
          </h1>

          {items.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add courses to get started</p>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                        {item.course?.imageUrl ? (
                          <img src={item.course.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-white/70" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.course?.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          by {item.course?.author?.username}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-bold text-primary">
                            {item.course?.price != null && item.course.price > 0
                              ? `${item.course.price.toLocaleString('vi-VN')}đ`
                              : 'Free'}
                          </span>
                          {item.course?.level && (
                            <Badge variant="outline" className="text-xs">{item.course.level}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                        <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon discount</span>
                          <span>-{savings.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{safeFinal.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Coupon code"
                            className="pl-8"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={applyCoupon}
                          disabled={applyingCoupon || !couponCode}
                        >
                          {applyingCoupon ? '...' : 'Apply'}
                        </Button>
                      </div>
                      {couponPreview && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {couponPreview.discount}% discount applied
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={checkout}
                      disabled={checkingOut}
                    >
                      {checkingOut ? 'Processing...' : (
                        <>Checkout <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      30-day money-back guarantee
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
