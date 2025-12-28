import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Plus, Edit, Trash2, PieChart, BarChart3, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Transaction form schema
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(['esewa', 'khalti', 'cash', 'card']).optional(),
  walletId: z.string().min(1, 'Please select a wallet'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  description?: string;
  paymentMethod?: string;
  status: string;
  transactionDate: string;
  wallet: {
    id: string;
    walletType: string;
  };
}

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  walletType: string;
  isActive: boolean;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface TrendData {
  name: string;
  income: number;
  expense: number;
}

export const DashboardPage = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    savingsRate: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filters and search
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Chart data
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
    },
  });

  const fetchData = async () => {
    try {
      const [walletsRes, transactionsRes, statsRes] = await Promise.all([
        api.get('/wallets'),
        api.get('/transactions', {
          params: {
            limit: 50,
            type: transactionTypeFilter !== 'all' ? transactionTypeFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
          }
        }),
        api.get('/transactions/stats'),
      ]);

      const wallets = walletsRes.data.data;
      const transactions = transactionsRes.data.data;
      const statsData = statsRes.data.data;

      const totalBalance = wallets.reduce(
        (sum: number, wallet: any) => sum + Number(wallet.balance),
        0
      );

      const savingsRate = statsData.totalIncome > 0
        ? ((statsData.totalIncome - statsData.totalExpense) / statsData.totalIncome) * 100
        : 0;

      setWallets(wallets);
      setTransactions(transactions);
      setStats({
        totalBalance,
        totalIncome: statsData.totalIncome || 0,
        totalExpense: statsData.totalExpense || 0,
        netBalance: statsData.netBalance || 0,
        savingsRate,
      });

      // Prepare chart data
      prepareChartData(transactions, statsData.categoryBreakdown || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (transactions: Transaction[], categoryBreakdown: any[]) => {
    // Income vs Expense trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trendData = last7Days.map(date => {
      const dayTransactions = transactions.filter(t =>
        t.transactionDate.startsWith(date)
      );

      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        income,
        expense,
      };
    });

    setTrendData(trendData);

    // Category breakdown for pie chart
    const categoryColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    const categoryChartData = categoryBreakdown.map((item, index) => ({
      name: item.category || 'Uncategorized',
      value: item._sum.amount,
      color: categoryColors[index % categoryColors.length],
    }));

    setCategoryData(categoryChartData);
  };

  useEffect(() => {
    fetchData();
  }, [transactionTypeFilter, categoryFilter]);

  const onSubmitTransaction = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, data);
        toast({
          title: 'Success',
          description: 'Transaction updated successfully',
        });
      } else {
        await api.post('/transactions', data);
        toast({
          title: 'Success',
          description: 'Transaction added successfully',
        });
      }

      setShowTransactionDialog(false);
      setEditingTransaction(null);
      transactionForm.reset();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save transaction',
        variant: 'destructive',
      });
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await api.delete(`/transactions/${transactionId}`);
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    transactionForm.reset({
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod as any,
      walletId: transaction.wallet.id,
    });
    setShowTransactionDialog(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Of total income</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Add transactions or manage your wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTransaction(null);
                  transactionForm.reset({ type: 'income' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                  setEditingTransaction(null);
                  transactionForm.reset({ type: 'expense' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? 'Update your transaction details' : 'Enter your transaction details'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={transactionForm.watch('type')}
                        onValueChange={(value) => transactionForm.setValue('type', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        {...transactionForm.register('amount', { valueAsNumber: true })}
                      />
                      {transactionForm.formState.errors.amount && (
                        <p className="text-sm text-destructive">
                          {transactionForm.formState.errors.amount.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wallet</label>
                    <Select
                      value={transactionForm.watch('walletId')}
                      onValueChange={(value) => transactionForm.setValue('walletId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.walletType} - {formatCurrency(wallet.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {transactionForm.formState.errors.walletId && (
                      <p className="text-sm text-destructive">
                        {transactionForm.formState.errors.walletId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category (Optional)</label>
                    <Input {...transactionForm.register('category')} placeholder="e.g., Food, Transport" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Input {...transactionForm.register('description')} placeholder="Transaction description" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method (Optional)</label>
                    <Select
                      value={transactionForm.watch('paymentMethod')}
                      onValueChange={(value) => transactionForm.setValue('paymentMethod', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="esewa">eSewa</SelectItem>
                        <SelectItem value="khalti">Khalti</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTransactionDialog(false);
                        setEditingTransaction(null);
                        transactionForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTransaction ? 'Update' : 'Add'} Transaction
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income vs Expense Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Income vs Expense Trend
            </CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {/* Add category options based on data */}
                {Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).map(category => (
                  <SelectItem key={category} value={category!}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.category || 'Uncategorized'}</TableCell>
                  <TableCell>{transaction.description || 'No description'}</TableCell>
                  <TableCell className="capitalize">{transaction.wallet.walletType}</TableCell>
                  <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
