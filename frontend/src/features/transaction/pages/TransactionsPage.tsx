import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Filter } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: string;
  type: string;
  category: string | null;
  description: string | null;
  paymentMethod: string | null;
  status: string;
  transactionDate: string;
  wallet: {
    id: string;
    walletType: string;
  };
}

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState({ type: '', category: '' });
  const [wallets, setWallets] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    walletId: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    paymentMethod: 'cash',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [transactionsRes, walletsRes] = await Promise.all([
        api.get('/transactions', { params: filter }),
        api.get('/wallets'),
      ]);
      setTransactions(transactionsRes.data.data);
      setWallets(walletsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      setShowAddForm(false);
      setFormData({
        walletId: '',
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        paymentMethod: 'cash',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case 'expense':
        return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case 'transfer':
        return <ArrowLeftRight className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your financial transactions</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="h-10 rounded-md border border-input bg-background px-3"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
            <Input
              placeholder="Filter by category"
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Transaction</CardTitle>
            <CardDescription>Add a new transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.walletId}
                  onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                  required
                >
                  <option value="">Select wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.walletType} - {formatCurrency(Number(wallet.balance))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
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
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="e.g., Food, Transport, Salary"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Transaction description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="esewa">eSewa</option>
                  <option value="khalti">Khalti</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <h3 className="font-semibold capitalize">
                        {transaction.type} - {transaction.category || 'Uncategorized'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(transaction.transactionDate)} • {transaction.wallet.walletType}
                        {transaction.paymentMethod && ` • ${transaction.paymentMethod}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : transaction.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(Number(transaction.amount))}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {transaction.status}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
