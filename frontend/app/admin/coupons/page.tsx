'use client';

import { useEffect, useState } from 'react';
import { couponsApi } from '@/lib/api-service';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus } from 'lucide-react';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('10');
  const [saving, setSaving] = useState(false);

  const load = () => {
    couponsApi
      .getAll()
      .then(setCoupons)
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!code.trim()) {
      toast.error('Code required');
      return;
    }
    const d = parseFloat(discount);
    if (Number.isNaN(d) || d < 0 || d > 100) {
      toast.error('Discount must be 0–100');
      return;
    }
    try {
      setSaving(true);
      await couponsApi.create({
        code: code.trim().toUpperCase(),
        discount: d,
        maxUses: 100,
      });
      toast.success('Coupon created');
      setCode('');
      load();
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <p className="text-sm text-gray-500 mt-1">Create and view discount codes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> New coupon
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SALE20" />
          </div>
          <div className="w-full sm:w-32 space-y-1.5">
            <Label>Discount %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <Button onClick={create} disabled={saving}>
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons.</p>
        ) : (
          coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Tag className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-mono font-semibold">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.discount}% · used {c.usedCount}/{c.maxUses ?? '∞'}
                      {c.expiresAt && ` · exp ${new Date(c.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Badge variant={c.isActive ? 'default' : 'secondary'}>
                  {c.isActive ? 'Active' : 'Off'}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
