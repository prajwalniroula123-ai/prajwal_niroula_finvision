import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface WalletData {
  id: string;
  balance: string;
  currency: string;
  walletType: string;
  walletNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

export const WalletsPage = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    walletType: 'internal',
    walletNumber: '',
    currency: 'NPR',
  });
  const { toast } = useToast();

  const fetchWallets = async () => {
    try {
      const response = await api.get('/wallets');
      setWallets(response.data.data);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wallets', formData);
      toast({
        title: 'Success',
        description: 'Wallet created successfully',
      });
      setShowAddForm(false);
      setFormData({ walletType: 'internal', walletNumber: '', currency: 'NPR' });
      fetchWallets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create wallet',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this wallet?')) return;

    try {
      await api.delete(`/wallets/${id}`);
      toast({
        title: 'Success',
        description: 'Wallet deactivated successfully',
      });
      fetchWallets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete wallet',
        variant: 'destructive',
      });
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'esewa':
        return '💳';
      case 'khalti':
        return '💵';
      default:
        return '💰';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallets</h1>
          <p className="text-muted-foreground">Manage your payment wallets</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Wallet</CardTitle>
            <CardDescription>Add a new wallet to track your finances</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet Type</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.walletType}
                  onChange={(e) => setFormData({ ...formData, walletType: e.target.value })}
                  required
                >
                  <option value="internal">Internal</option>
                  <option value="esewa">eSewa</option>
                  <option value="khalti">Khalti</option>
                </select>
              </div>

              {(formData.walletType === 'esewa' || formData.walletType === 'khalti') && (
                <div>
                  <label className="text-sm font-medium">Wallet Number</label>
                  <Input
                    placeholder="Enter wallet number"
                    value={formData.walletNumber}
                    onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">Create Wallet</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {wallets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wallets yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first wallet to start tracking your finances
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className={!wallet.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getWalletIcon(wallet.walletType)}</span>
                    <div>
                      <CardTitle className="text-lg capitalize">{wallet.walletType}</CardTitle>
                      {wallet.walletNumber && (
                        <CardDescription>{wallet.walletNumber}</CardDescription>
                      )}
                    </div>
                  </div>
                  {!wallet.isActive && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Number(wallet.balance), wallet.currency)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteWallet(wallet.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
