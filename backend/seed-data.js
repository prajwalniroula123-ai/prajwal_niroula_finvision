const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
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

    console.log('✅ Admin user created:', admin.email);

    // Create sample regular users
    const user1Password = await bcrypt.hash('user123', 10);
    const user2Password = await bcrypt.hash('user123', 10);
    const user3Password = await bcrypt.hash('user123', 10);

    const users = await Promise.all([
      prisma.user.upsert({
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
      }),
      prisma.user.upsert({
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
      }),
      prisma.user.upsert({
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
      }),
    ]);

    console.log('✅ Created', users.length, 'regular users');

    // Create wallets
    const wallets = await Promise.all([
      // Admin wallets
      prisma.wallet.create({
        data: {
          userId: admin.id,
          balance: 15000.50,
          currency: 'NPR',
          walletType: 'esewa',
          walletNumber: '9800000000',
          isActive: true,
        },
      }),
      prisma.wallet.create({
        data: {
          userId: admin.id,
          balance: 5000.00,
          currency: 'NPR',
          walletType: 'internal',
          isActive: true,
        },
      }),
      // User wallets
      prisma.wallet.create({
        data: {
          userId: users[0].id,
          balance: 25000.75,
          currency: 'NPR',
          walletType: 'esewa',
          walletNumber: '9812345678',
          isActive: true,
        },
      }),
      prisma.wallet.create({
        data: {
          userId: users[1].id,
          balance: 35000.00,
          currency: 'NPR',
          walletType: 'esewa',
          walletNumber: '9876543210',
          isActive: true,
        },
      }),
      prisma.wallet.create({
        data: {
          userId: users[2].id,
          balance: 12000.50,
          currency: 'NPR',
          walletType: 'internal',
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Created', wallets.length, 'wallets');

    // Create sample transactions
    const transactions = [
      // Admin transactions
      { userId: admin.id, walletId: wallets[0].id, amount: 5000.00, type: 'income', category: 'Salary', description: 'Monthly Salary', paymentMethod: 'esewa' },
      { userId: admin.id, walletId: wallets[0].id, amount: 1200.00, type: 'expense', category: 'Food', description: 'Restaurant Dinner', paymentMethod: 'esewa' },
      { userId: admin.id, walletId: wallets[1].id, amount: 2500.00, type: 'expense', category: 'Shopping', description: 'Online Shopping', paymentMethod: 'card' },

      // User transactions
      { userId: users[0].id, walletId: wallets[2].id, amount: 30000.00, type: 'income', category: 'Salary', description: 'Monthly Salary', paymentMethod: 'esewa' },
      { userId: users[0].id, walletId: wallets[2].id, amount: 2500.00, type: 'expense', category: 'Transportation', description: 'Bus Fare', paymentMethod: 'esewa' },

      { userId: users[1].id, walletId: wallets[3].id, amount: 45000.00, type: 'income', category: 'Business', description: 'Business Revenue', paymentMethod: 'esewa' },
      { userId: users[1].id, walletId: wallets[3].id, amount: 8000.00, type: 'expense', category: 'Rent', description: 'Monthly Rent', paymentMethod: 'esewa' },

      { userId: users[2].id, walletId: wallets[4].id, amount: 20000.00, type: 'income', category: 'Freelance', description: 'Freelance Payment', paymentMethod: 'cash' },
      { userId: users[2].id, walletId: wallets[4].id, amount: 3500.00, type: 'expense', category: 'Food', description: 'Grocery Shopping', paymentMethod: 'cash' },
    ];

    const createdTransactions = [];
    for (const tx of transactions) {
      const transaction = await prisma.transaction.create({
        data: {
          ...tx,
          status: 'completed',
          transactionDate: new Date(),
        },
      });
      createdTransactions.push(transaction);
    }

    console.log('✅ Created', createdTransactions.length, 'transactions');

    // Create emotions for some transactions
    const emotions = [];
    for (let i = 0; i < createdTransactions.length; i++) {
      if (createdTransactions[i].type === 'expense' && Math.random() > 0.5) {
        const emotion = await prisma.emotion.create({
          data: {
            userId: createdTransactions[i].userId,
            transactionId: createdTransactions[i].id,
            emotionType: ['happy', 'anxious', 'excited', 'neutral'][Math.floor(Math.random() * 4)],
            intensity: Math.floor(Math.random() * 10) + 1,
            notes: 'Sample emotion tracking',
          },
        });
        emotions.push(emotion);
      }
    }

    console.log('✅ Created', emotions.length, 'emotion records');

    // Create sample rewards and achievements
    const rewards = await Promise.all([
      prisma.reward.create({ data: { userId: admin.id, rewardType: 'badge', rewardName: 'First Transaction', points: 10 } }),
      prisma.reward.create({ data: { userId: users[0].id, rewardType: 'badge', rewardName: 'Savings Champion', points: 25 } }),
      prisma.reward.create({ data: { userId: users[1].id, rewardType: 'points', rewardName: 'Transaction Points', points: 15 } }),
    ]);

    console.log('✅ Created', rewards.length, 'rewards');

    const achievements = await Promise.all([
      prisma.achievement.create({ data: { userId: admin.id, achievementType: 'savings_milestone', title: 'Savings Master', description: 'Saved more than NPR 10,000' } }),
      prisma.achievement.create({ data: { userId: users[0].id, achievementType: 'streak', title: 'Consistency King', description: '30-day tracking streak' } }),
    ]);

    console.log('✅ Created', achievements.length, 'achievements');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 1 Admin user (np05cp4a230210@iic.edu.np)');
    console.log('- 3 Regular users');
    console.log('- 5 Wallets');
    console.log('- 11 Transactions');
    console.log('- Emotions, rewards, and achievements');

    console.log('\n🔐 Login Credentials:');
    console.log('Admin: np05cp4a230210@iic.edu.np / admin123');
    console.log('Users: john.doe@example.com / user123');
    console.log('       sarah.wilson@example.com / user123');
    console.log('       mike.johnson@example.com / user123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Main execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
