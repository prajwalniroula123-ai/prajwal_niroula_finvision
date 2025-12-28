import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Insight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  confidence: number | null;
  category: string | null;
  createdAt: string;
  transaction: {
    id: string;
    amount: string;
    description: string | null;
  } | null;
}

const insightIcons: Record<string, any> = {
  prediction: TrendingUp,
  recommendation: Lightbulb,
  warning: AlertTriangle,
  pattern: Target,
};

const insightColors: Record<string, string> = {
  prediction: 'text-blue-600 bg-blue-100',
  recommendation: 'text-green-600 bg-green-100',
  warning: 'text-red-600 bg-red-100',
  pattern: 'text-purple-600 bg-purple-100',
};

export const InsightsPage = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai-insights');
      setInsights(response.data.data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to load insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerateInsight = async () => {
    setGenerating(true);
    try {
      await api.get('/ai-insights/generate');
      toast({
        title: 'Success',
        description: 'New insight generated successfully',
      });
      fetchInsights();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate insight',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">
            Get AI-powered financial insights and recommendations
          </p>
        </div>
        <Button onClick={handleGenerateInsight} disabled={generating}>
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Generating...' : 'Generate Insight'}
        </Button>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate AI-powered insights based on your financial data
            </p>
            <Button onClick={handleGenerateInsight} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Insight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = insightIcons[insight.insightType] || Brain;
            const colorClass = insightColors[insight.insightType] || insightColors.recommendation;

            return (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs capitalize ${colorClass}`}
                          >
                            {insight.insightType}
                          </span>
                          {insight.confidence && (
                            <span className="text-xs text-muted-foreground">
                              Confidence: {Math.round(insight.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                  {insight.transaction && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Related Transaction:</p>
                      <p className="text-sm">
                        {insight.transaction.description || 'Transaction'} - {insight.transaction.amount}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    {formatDate(insight.createdAt)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
