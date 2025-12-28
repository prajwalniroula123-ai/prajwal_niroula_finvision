import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  // Create admin user (using the requested email)
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'np05cp4a230210@iic.edu.np' },
    update: {},
    create: {
      email: 'np05cp4a230210@iic.edu.np',
      password: adminPassword,
      firstName: 'Prajwal',
      lastName: 'Niroula',
      phoneNumber: '+977 98XXXXXXXX',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  // Create sample regular users
  const user1Password = await bcrypt.hash('user123', 10);
  const user2Password = await bcrypt.hash('user123', 10);
  const user3Password = await bcrypt.hash('user123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      password: user1Password,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+977 9812345678',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah.wilson@example.com' },
    update: {},
    create: {
      email: 'sarah.wilson@example.com',
      password: user2Password,
      firstName: 'Sarah',
      lastName: 'Wilson',
      phoneNumber: '+977 9876543210',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mike.johnson@example.com' },
    update: {},
    create: {
      email: 'mike.johnson@example.com',
      password: user3Password,
      firstName: 'Mike',
      lastName: 'Johnson',
      phoneNumber: '+977 9823456789',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  // Create payment gateways
  await prisma.paymentGateway.upsert({
    where: { gatewayName: 'esewa' },
    update: {},
    create: {
      gatewayName: 'esewa',
      isActive: true,
    },
  });

  await prisma.paymentGateway.upsert({
    where: { gatewayName: 'khalti' },
    update: {},
    create: {
      gatewayName: 'khalti',
      isActive: true,
    },
  });

  // Create wallets for users
  const adminWalletEsewa = await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 15000.50,
      currency: 'NPR',
      walletType: 'esewa',
      walletNumber: '9800000000',
      isActive: true,
    },
  });

  const adminWalletInternal = await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 5000.00,
      currency: 'NPR',
      walletType: 'internal',
      isActive: true,
    },
  });

  const user1WalletEsewa = await prisma.wallet.create({
    data: {
      userId: user1.id,
      balance: 25000.75,
      currency: 'NPR',
      walletType: 'esewa',
      walletNumber: '9812345678',
      isActive: true,
    },
  });

  const user1WalletKhalti = await prisma.wallet.create({
    data: {
      userId: user1.id,
      balance: 8000.25,
      currency: 'NPR',
      walletType: 'khalti',
      walletNumber: 'KH123456789',
      isActive: true,
    },
  });

  const user2WalletEsewa = await prisma.wallet.create({
    data: {
      userId: user2.id,
      balance: 35000.00,
      currency: 'NPR',
      walletType: 'esewa',
      walletNumber: '9876543210',
      isActive: true,
    },
  });

  const user3WalletInternal = await prisma.wallet.create({
    data: {
      userId: user3.id,
      balance: 12000.50,
      currency: 'NPR',
      walletType: 'internal',
      isActive: true,
    },
  });

  // Create transactions
  const transactions = [
    // Admin transactions
    {
      userId: admin.id,
      walletId: adminWalletEsewa.id,
      amount: 5000.00,
      type: 'income' as const,
      category: 'Salary',
      description: 'Monthly Salary',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-01'),
    },
    {
      userId: admin.id,
      walletId: adminWalletEsewa.id,
      amount: 1200.00,
      type: 'expense' as const,
      category: 'Food',
      description: 'Restaurant Dinner',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-15'),
    },
    {
      userId: admin.id,
      walletId: adminWalletInternal.id,
      amount: 2500.00,
      type: 'expense' as const,
      category: 'Shopping',
      description: 'Online Shopping',
      paymentMethod: 'card',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-20'),
    },

    // User1 transactions
    {
      userId: user1.id,
      walletId: user1WalletEsewa.id,
      amount: 30000.00,
      type: 'income' as const,
      category: 'Salary',
      description: 'Monthly Salary',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-01'),
    },
    {
      userId: user1.id,
      walletId: user1WalletEsewa.id,
      amount: 2500.00,
      type: 'expense' as const,
      category: 'Transportation',
      description: 'Bus Fare',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-10'),
    },
    {
      userId: user1.id,
      walletId: user1WalletKhalti.id,
      amount: 1500.00,
      type: 'expense' as const,
      category: 'Entertainment',
      description: 'Movie Tickets',
      paymentMethod: 'khalti',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-18'),
    },

    // User2 transactions
    {
      userId: user2.id,
      walletId: user2WalletEsewa.id,
      amount: 45000.00,
      type: 'income' as const,
      category: 'Business',
      description: 'Business Revenue',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-01'),
    },
    {
      userId: user2.id,
      walletId: user2WalletEsewa.id,
      amount: 8000.00,
      type: 'expense' as const,
      category: 'Rent',
      description: 'Monthly Rent',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-05'),
    },
    {
      userId: user2.id,
      walletId: user2WalletEsewa.id,
      amount: 3200.00,
      type: 'expense' as const,
      category: 'Utilities',
      description: 'Electricity Bill',
      paymentMethod: 'esewa',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-12'),
    },

    // User3 transactions
    {
      userId: user3.id,
      walletId: user3WalletInternal.id,
      amount: 20000.00,
      type: 'income' as const,
      category: 'Freelance',
      description: 'Freelance Project Payment',
      paymentMethod: 'cash',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-01'),
    },
    {
      userId: user3.id,
      walletId: user3WalletInternal.id,
      amount: 3500.00,
      type: 'expense' as const,
      category: 'Food',
      description: 'Grocery Shopping',
      paymentMethod: 'cash',
      status: 'completed' as const,
      transactionDate: new Date('2024-12-08'),
    },
  ];

  // Create transactions and link emotions
  for (const transactionData of transactions) {
    const transaction = await prisma.transaction.create({
      data: transactionData,
    });

    // Add emotions for some transactions (simulate emotional tracking)
    if (transaction.type === 'expense' && Math.random() > 0.5) {
      const emotions = ['happy', 'sad', 'anxious', 'excited', 'neutral', 'stressed'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

      await prisma.emotion.create({
        data: {
          userId: transaction.userId,
          transactionId: transaction.id,
          emotionType: randomEmotion,
          intensity: Math.floor(Math.random() * 10) + 1,
          notes: `Felt ${randomEmotion} while making this ${transaction.category?.toLowerCase()} purchase`,
        },
      });
    }

    // Add AI insights for some transactions
    if (Math.random() > 0.6) {
      const insights = [
        { type: 'warning', title: 'High Expense Alert', description: 'This expense is higher than your average spending in this category.' },
        { type: 'recommendation', title: 'Budget Tip', description: 'Consider setting a monthly budget for this category.' },
        { type: 'pattern', title: 'Spending Pattern', description: 'You tend to spend more on weekends in this category.' },
      ];

      const randomInsight = insights[Math.floor(Math.random() * insights.length)];

      await prisma.aiInsight.create({
        data: {
          userId: transaction.userId,
          transactionId: transaction.id,
          insightType: randomInsight.type as any,
          title: randomInsight.title,
          description: randomInsight.description,
          confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
          category: transaction.category,
        },
      });
    }
  }

  // Create rewards and achievements
  const rewards = [
    {
      userId: admin.id,
      rewardType: 'badge',
      rewardName: 'First Transaction',
      points: 10,
    },
    {
      userId: admin.id,
      rewardType: 'streak',
      rewardName: '7-Day Streak',
      points: 50,
    },
    {
      userId: user1.id,
      rewardType: 'badge',
      rewardName: 'Savings Champion',
      points: 25,
    },
    {
      userId: user2.id,
      rewardType: 'points',
      rewardName: 'Transaction Points',
      points: 15,
    },
  ];

  for (const reward of rewards) {
    await prisma.reward.create({
      data: reward,
    });
  }

  const achievements = [
    {
      userId: admin.id,
      achievementType: 'savings_milestone',
      title: 'Savings Master',
      description: 'Saved more than NPR 10,000 this month',
    },
    {
      userId: user1.id,
      achievementType: 'streak',
      title: 'Consistency King',
      description: 'Tracked expenses for 30 consecutive days',
    },
    {
      userId: user2.id,
      achievementType: 'category_master',
      title: 'Budget Guru',
      description: 'Stayed within budget for all categories this month',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
  }

  // Create sample chat messages
  const chatMessages = [
    {
      userId: admin.id,
      message: 'How can I improve my savings?',
      response: 'Based on your transaction history, you could save 20% more by reducing dining out expenses. Consider meal prepping!',
    },
    {
      userId: user1.id,
      message: 'What are my biggest expenses?',
      response: 'Your largest expense category is Transportation at 25% of total spending. Consider using public transport more often.',
    },
    {
      userId: user2.id,
      message: 'Help me create a budget',
      response: 'Based on your income of NPR 45,000, I recommend: 50% for needs, 30% for wants, and 20% for savings and debt repayment.',
    },
  ];

  for (const chat of chatMessages) {
    await prisma.chatMessage.create({
      data: chat,
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log('Admin user created with email: np05cp4a230210@iic.edu.np');
  console.log('Password: admin123');
  console.log(`Created ${transactions.length} transactions, ${rewards.length} rewards, ${achievements.length} achievements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

