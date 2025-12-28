const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Hardcode the database URL for seeding
const DATABASE_URL = "mongodb+srv://np05cp4a230210_db_user:ESOfLO4aP4iS2m32@finvision.11yvygk.mongodb.net/finvision_db?retryWrites=true&w=majority";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'np05cp4a230210@iic.edu.np' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping seeding');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
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

    // Create regular users
    const users = [];
    const userData = [
      { email: 'john.doe@example.com', name: 'John Doe' },
      { email: 'sarah.wilson@example.com', name: 'Sarah Wilson' },
      { email: 'mike.johnson@example.com', name: 'Mike Johnson' }
    ];

    for (const data of userData) {
      const password = await bcrypt.hash('user123', 10);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password,
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ')[1],
          role: 'USER',
          isEmailVerified: true,
        },
      });
      users.push(user);
    }
    console.log('✅ Created', users.length, 'regular users');

    // Create wallets
    const wallets = [
      { userId: admin.id, balance: 15000.50, type: 'esewa', number: '9800000000' },
      { userId: admin.id, balance: 5000.00, type: 'internal' },
      { userId: users[0].id, balance: 25000.75, type: 'esewa', number: '9812345678' },
      { userId: users[1].id, balance: 35000.00, type: 'esewa', number: '9876543210' },
      { userId: users[2].id, balance: 12000.50, type: 'internal' },
    ];

    const createdWallets = [];
    for (const wallet of wallets) {
      const w = await prisma.wallet.create({
        data: {
          userId: wallet.userId,
          balance: wallet.balance,
          currency: 'NPR',
          walletType: wallet.type,
          walletNumber: wallet.number || null,
          isActive: true,
        },
      });
      createdWallets.push(w);
    }
    console.log('✅ Created', createdWallets.length, 'wallets');

    // Create transactions
    const transactions = [
      { userId: admin.id, walletId: createdWallets[0].id, amount: 5000, type: 'income', category: 'Salary', desc: 'Monthly Salary' },
      { userId: admin.id, walletId: createdWallets[0].id, amount: 1200, type: 'expense', category: 'Food', desc: 'Restaurant Dinner' },
      { userId: admin.id, walletId: createdWallets[1].id, amount: 2500, type: 'expense', category: 'Shopping', desc: 'Online Shopping' },
      { userId: users[0].id, walletId: createdWallets[2].id, amount: 30000, type: 'income', category: 'Salary', desc: 'Monthly Salary' },
      { userId: users[0].id, walletId: createdWallets[2].id, amount: 2500, type: 'expense', category: 'Transportation', desc: 'Bus Fare' },
      { userId: users[1].id, walletId: createdWallets[3].id, amount: 45000, type: 'income', category: 'Business', desc: 'Business Revenue' },
      { userId: users[1].id, walletId: createdWallets[3].id, amount: 8000, type: 'expense', category: 'Rent', desc: 'Monthly Rent' },
      { userId: users[2].id, walletId: createdWallets[4].id, amount: 20000, type: 'income', category: 'Freelance', desc: 'Freelance Payment' },
      { userId: users[2].id, walletId: createdWallets[4].id, amount: 3500, type: 'expense', category: 'Food', desc: 'Grocery Shopping' },
    ];

    const createdTransactions = [];
    for (const tx of transactions) {
      const transaction = await prisma.transaction.create({
        data: {
          userId: tx.userId,
          walletId: tx.walletId,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          description: tx.desc,
          status: 'completed',
          transactionDate: new Date(),
        },
      });
      createdTransactions.push(transaction);
    }
    console.log('✅ Created', createdTransactions.length, 'transactions');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 1 Admin user (np05cp4a230210@iic.edu.np)');
    console.log('- 3 Regular users');
    console.log('- 5 Wallets');
    console.log('- 9 Transactions');

    console.log('\n🔐 Login Credentials:');
    console.log('Admin: np05cp4a230210@iic.edu.np / admin123');
    console.log('Users: john.doe@example.com / user123');
    console.log('       sarah.wilson@example.com / user123');
    console.log('       mike.johnson@example.com / user123');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
