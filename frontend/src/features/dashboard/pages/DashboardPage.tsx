import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Brain } from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletsRes, statsRes] = await Promise.all([
          api.get('/wallets'),
          api.get('/transactions/stats'),
        ]);

        const totalBalance = walletsRes.data.data.reduce(
          (sum: number, wallet: any) => sum + Number(wallet.balance),
          0
        );

        setStats({
          totalBalance,
          totalIncome: statsRes.data.data.totalIncome || 0,
          totalExpense: statsRes.data.data.totalExpense || 0,
          netBalance: statsRes.data.data.netBalance || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expense</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

