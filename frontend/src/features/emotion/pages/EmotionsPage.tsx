import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Emotion {
  id: string;
  emotionType: string;
  intensity: number;
  notes: string | null;
  createdAt: string;
  transaction: {
    id: string;
    amount: string;
    description: string | null;
  } | null;
}

const emotionColors: Record<string, string> = {
  happy: 'bg-yellow-100 text-yellow-800',
  sad: 'bg-blue-100 text-blue-800',
  anxious: 'bg-orange-100 text-orange-800',
  excited: 'bg-pink-100 text-pink-800',
  neutral: 'bg-gray-100 text-gray-800',
  stressed: 'bg-red-100 text-red-800',
};

const emotionEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  excited: '🤩',
  neutral: '😐',
  stressed: '😓',
};

export const EmotionsPage = () => {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    emotionType: 'neutral',
    intensity: 5,
    notes: '',
    transactionId: '',
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [emotionsRes, transactionsRes] = await Promise.all([
        api.get('/emotions'),
        api.get('/transactions'),
      ]);
      setEmotions(emotionsRes.data.data);
      setTransactions(transactionsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch emotions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load emotions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEmotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/emotions', {
        ...formData,
        transactionId: formData.transactionId || undefined,
      });
      toast({
        title: 'Success',
        description: 'Emotion logged successfully',
      });
      setShowAddForm(false);
      setFormData({
        emotionType: 'neutral',
        intensity: 5,
        notes: '',
        transactionId: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to log emotion',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emotion Tracking</h1>
          <p className="text-muted-foreground">Track your emotional states related to spending</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Emotion
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Emotion</CardTitle>
            <CardDescription>Record how you're feeling about a transaction or in general</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEmotion} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Emotion Type</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.emotionType}
                  onChange={(e) => setFormData({ ...formData, emotionType: e.target.value })}
                  required
                >
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="stressed">😓 Stressed</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Intensity: {formData.intensity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.intensity}
                  onChange={(e) =>
                    setFormData({ ...formData, intensity: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link to Transaction (Optional)</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                >
                  <option value="">None</option>
                  {transactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.description || 'Transaction'} - {transaction.amount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="How are you feeling? What triggered this emotion?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Log Emotion</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {emotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No emotions logged yet</h3>
            <p className="text-muted-foreground">
              Start tracking your emotional states to gain insights into your spending behavior
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emotions.map((emotion) => (
            <Card key={emotion.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{emotionEmojis[emotion.emotionType] || '😐'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold capitalize">{emotion.emotionType}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${emotionColors[emotion.emotionType] || emotionColors.neutral}`}
                        >
                          Intensity: {emotion.intensity}/10
                        </span>
                      </div>
                      {emotion.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{emotion.notes}</p>
                      )}
                      {emotion.transaction && (
                        <p className="text-xs text-muted-foreground">
                          Linked to transaction: {emotion.transaction.description || 'Transaction'}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(emotion.createdAt)}
                      </p>
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
