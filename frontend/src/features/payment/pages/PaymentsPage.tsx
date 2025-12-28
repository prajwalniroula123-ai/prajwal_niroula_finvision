import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface PaymentHistory {
  id: string;
  amount: string;
  type: string;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  wallet: {
    id: string;
    walletType: string;
  };
}

export const PaymentsPage = () => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    walletId: '',
    gateway: 'esewa' as 'esewa' | 'khalti',
    description: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [historyRes, walletsRes] = await Promise.all([
        api.get('/payments/history'),
        api.get('/wallets'),
      ]);
      setPaymentHistory(historyRes.data.data);
      setWallets(walletsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/payments/initiate', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast({
        title: 'Payment Initiated',
        description: 'Redirecting to payment gateway...',
      });
      // In production, redirect to actual payment gateway
      console.log('Payment data:', response.data);
      setShowPaymentForm(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Make payments via eSewa or Khalti</p>
        </div>
        <Button onClick={() => setShowPaymentForm(!showPaymentForm)}>
          <CreditCard className="w-4 h-4 mr-2" />
          Make Payment
        </Button>
      </div>

      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Initiate Payment</CardTitle>
            <CardDescription>Pay using eSewa or Khalti</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Gateway</label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={formData.gateway === 'esewa' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, gateway: 'esewa' })}
                    className="flex-1"
                  >
                    💳 eSewa
                  </Button>
                  <Button
                    type="button"
                    variant={formData.gateway === 'khalti' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, gateway: 'khalti' })}
                    className="flex-1"
                  >
                    💵 Khalti
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Wallet</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.walletId}
                  onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                  required
                >
                  <option value="">Select wallet</option>
                  {wallets
                    .filter((w) => w.isActive)
                    .map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.walletType} - {formatCurrency(Number(wallet.balance))}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Payment description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Proceed to Payment
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
        {paymentHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Make your first payment using eSewa or Khalti
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paymentHistory.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <h3 className="font-semibold capitalize">
                          {payment.paymentMethod || 'Payment'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {payment.wallet.walletType} • {formatDateTime(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(Number(payment.amount))}
                      </div>
                      <div
                        className={`text-xs capitalize ${
                          payment.status === 'completed'
                            ? 'text-green-600'
                            : payment.status === 'failed'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {payment.status}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
