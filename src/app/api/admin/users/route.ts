import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin API endpoint for fetching user data and statistics

export async function GET(request: NextRequest) {
  try {
    // Get all users with their subscriptions and related data
    const users = await db.user.findMany({
      include: {
        subscriptions: {
          include: {
            package: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        userCredits: {
          include: {
            package: true,
            creditPackage: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalUsers = users.length;
    
    // Calculate total revenue from all transactions
    const transactions = await db.transaction.findMany({
      where: { status: 'COMPLETED' },
    });
    const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Calculate monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyTransactions = await db.transaction.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: currentMonth,
        },
      },
    });
    const monthlyRevenue = monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    // Prepare user subscription data for the table
    type UserSubscriptionData = {
      userId: string;
      userName: string | null;
      userEmail: string;
      packageName: string;
      duration: string;
      price: number;
      credits: number;
      expiryDate: Date;
      status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
      purchaseDate: Date;
    };
    const userSubscriptionData: UserSubscriptionData[] = [];
    
    for (const user of users) {
      for (const subscription of user.subscriptions) {
        const subscriptionCredits = user.userCredits.filter(credit => credit.packageId === subscription.packageId);
        const totalCredits = subscriptionCredits.reduce((sum, credit) => sum + credit.credits, 0);
        
        userSubscriptionData.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          packageName: subscription.package.name,
          duration: `${subscription.package.duration} days`,
          price: subscription.package.price,
          credits: totalCredits,
          expiryDate: subscription.endDate,
          status: subscription.status,
          purchaseDate: subscription.createdAt,
        });
      }
    }

    // Get all user credits data (including credit packages)
    type AllCreditsData = {
      userId: string;
      userName: string | null;
      userEmail: string;
      sourceName: string;
      sourceType: string;
      credits: number;
      remaining: number;
      expiryDate: Date;
      createdAt: Date;
    };
    const allCreditsData: AllCreditsData[] = [];
    
    for (const user of users) {
      for (const credit of user.userCredits) {
        const sourceName = credit.package?.name || credit.creditPackage?.name || 'Unknown';
        const sourceType = credit.package ? 'Subscription' : 'Credit Package';
        
        allCreditsData.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          sourceName,
          sourceType,
          credits: credit.credits,
          remaining: credit.remaining,
          expiryDate: credit.expiryDate ?? new Date(0),
          createdAt: credit.createdAt,
        });
      }
    }

    // Get package-specific statistics
    const allPackages = await db.package.findMany({
      include: {
        subscriptions: {
          include: {
            user: true,
          },
        },
        transactions: true,
        userCredits: true,
      },
    });

    const packageStats = allPackages.map(pkg => {
      const packageSubscriptions = pkg.subscriptions;
      const packageTransactions = pkg.transactions.filter(t => t.status === 'COMPLETED');
      const packageCredits = pkg.userCredits;
      
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        duration: pkg.duration,
        credits: pkg.credits,
        features: pkg.features,
        isActive: pkg.isActive,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        stats: {
          totalSubscriptions: packageSubscriptions.length,
          activeSubscriptions: packageSubscriptions.filter(s => s.status === 'ACTIVE').length,
          expiredSubscriptions: packageSubscriptions.filter(s => s.status === 'EXPIRED').length,
          cancelledSubscriptions: packageSubscriptions.filter(s => s.status === 'CANCELLED').length,
          totalRevenue: packageTransactions.reduce((sum, t) => sum + t.amount, 0),
          totalCreditsGranted: packageCredits.reduce((sum, c) => sum + c.credits, 0),
          activeCredits: packageCredits.reduce((sum, c) => sum + c.remaining, 0),
          usedCredits: packageCredits.reduce((sum, c) => sum + c.credits, 0) - packageCredits.reduce((sum, c) => sum + c.remaining, 0),
          uniqueUsers: new Set(packageSubscriptions.map(s => s.userId)).size,
          averageRevenuePerUser: packageSubscriptions.length > 0 ? packageTransactions.reduce((sum, t) => sum + t.amount, 0) / new Set(packageSubscriptions.map(s => s.userId)).size : 0,
          conversionRate: users.length > 0 ? (new Set(packageSubscriptions.map(s => s.userId)).size / users.length) * 100 : 0,
        },
        recentActivity: packageSubscriptions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(sub => ({
            id: sub.id,
            userName: sub.user.name,
            userEmail: sub.user.email,
            status: sub.status,
            startDate: sub.startDate,
            createdAt: sub.createdAt,
          })),
      };
    });

    return NextResponse.json({
      statistics: {
        totalRevenue,
        monthlyRevenue,
        totalUsers,
        totalSubscriptions: userSubscriptionData.length,
        totalCreditsPurchased: allCreditsData.reduce((sum, credit) => sum + credit.credits, 0),
        activeCredits: allCreditsData.reduce((sum, credit) => sum + credit.remaining, 0),
      },
      userSubscriptions: userSubscriptionData,
      allCredits: allCreditsData,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        totalSubscriptions: user.subscriptions.length,
        activeSubscriptions: user.subscriptions.filter(s => s.status === 'ACTIVE').length,
        totalCredits: user.userCredits.reduce((sum, credit) => sum + credit.credits, 0),
        remainingCredits: user.userCredits.reduce((sum, credit) => sum + credit.remaining, 0),
      })),
      packageStats: packageStats,
    });
  } catch (error) {
    console.error('Error fetching admin user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin user data' },
      { status: 500 }
    );
  }
}