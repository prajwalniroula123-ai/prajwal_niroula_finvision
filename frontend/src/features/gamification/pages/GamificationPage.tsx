import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Award, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Reward {
  id: string;
  rewardType: string;
  rewardName: string;
  points: number;
  description: string | null;
  earnedAt: string;
}

interface Achievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string | null;
  unlockedAt: string;
}

interface Stats {
  totalRewards: number;
  totalPoints: number;
  totalAchievements: number;
}

export const GamificationPage = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRewards: 0,
    totalPoints: 0,
    totalAchievements: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [rewardsRes, achievementsRes, statsRes] = await Promise.all([
        api.get('/gamification/rewards'),
        api.get('/gamification/achievements'),
        api.get('/gamification/stats'),
      ]);

      setRewards(rewardsRes.data.data);
      setAchievements(achievementsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gamification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckAchievements = async () => {
    try {
      const response = await api.post('/gamification/check-achievements');
      const { newAchievements } = response.data.data;

      if (newAchievements.length > 0) {
        toast({
          title: '🎉 New Achievements Unlocked!',
          description: `You've earned ${newAchievements.length} new achievement(s)!`,
        });
        fetchData(); // Refresh data
      } else {
        toast({
          title: 'No new achievements',
          description: 'Keep working towards your goals!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check achievements',
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
          <h1 className="text-3xl font-bold">Gamification</h1>
          <p className="text-muted-foreground">Earn rewards and achievements for your financial progress</p>
        </div>
        <Button onClick={handleCheckAchievements}>
          <Sparkles className="w-4 h-4 mr-2" />
          Check Achievements
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">Points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRewards}</div>
            <p className="text-xs text-muted-foreground">Total rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">Unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Achievements</h2>
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No achievements unlocked yet. Keep working towards your goals!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {achievement.icon ? (
                      <span className="text-3xl">{achievement.icon}</span>
                    ) : (
                      <Trophy className="w-8 h-8 text-purple-500" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Unlocked: {formatDate(achievement.unlockedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rewards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Rewards</h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No rewards earned yet. Start tracking your finances to earn rewards!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rewards.slice(0, 10).map((reward) => (
              <Card key={reward.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{reward.rewardName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {reward.description || `${reward.rewardType} reward`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(reward.earnedAt)}
                        </p>
                      </div>
                    </div>
                    {reward.points > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">
                          +{reward.points}
                        </div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    )}
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
