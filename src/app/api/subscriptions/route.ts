import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId },
      include: {
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageId, carryOverCredits = false } = body;

    if (!userId || !packageId) {
      return NextResponse.json(
        { error: 'User ID and Package ID are required' },
        { status: 400 }
      );
    }

    // Check if package exists
    const packageItem = await db.package.findUnique({
      where: { id: packageId },
    });

    if (!packageItem) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + packageItem.duration);

    let totalCreditsToAdd = packageItem.credits;
    
    // If carry-over is enabled, get remaining credits from active subscription
    if (carryOverCredits) {
      // Find active subscription
      const activeSubscription = await db.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          package: true,
        },
      });

      if (activeSubscription) {
        // Get remaining credits from the active subscription
        const userCredits = await db.userCredit.findMany({
          where: {
            userId,
            packageId: activeSubscription.packageId,
            remaining: {
              gt: 0, // Only count credits that are still available
            },
          },
        });

        // Sum up all remaining credits
        const remainingCredits = userCredits.reduce((sum, credit) => sum + credit.remaining, 0);
        totalCreditsToAdd += remainingCredits;

        // Cancel the old subscription and reset its credits to 0
        await db.subscription.update({
          where: { id: activeSubscription.id },
          data: { status: 'CANCELLED' },
        });

        // Reset remaining credits for the old subscription to 0
        await db.userCredit.updateMany({
          where: {
            userId,
            packageId: activeSubscription.packageId,
            remaining: {
              gt: 0,
            },
          },
          data: {
            remaining: 0,
          },
        });
      }
    } else {
      // If no carry-over, check if user has any cancelled subscriptions and reset their credits to 0
      // This ensures that when purchasing a new package without carry-over, all previous credits are set to 0
      await db.userCredit.updateMany({
        where: {
          userId,
          remaining: {
            gt: 0,
          },
        },
        data: {
          remaining: 0,
        },
      });
    }

    // Create new subscription
    const subscription = await db.subscription.create({
      data: {
        userId,
        packageId,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        package: true,
      },
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        packageId,
        amount: packageItem.price,
        status: 'COMPLETED',
      },
    });

    // Add credits record for all subscriptions (even if credits = 0)
    // This ensures consistency in the admin dashboard
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await db.userCredit.create({
      data: {
        userId,
        packageId,
        credits: totalCreditsToAdd,
        remaining: totalCreditsToAdd,
        expiryDate,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}