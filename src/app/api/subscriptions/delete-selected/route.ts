import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionIds } = body;

    if (!userId || !subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return NextResponse.json(
        { error: 'User ID and subscription IDs array are required' },
        { status: 400 }
      );
    }

    // First, reset all remaining credits to 0 for the selected subscriptions
    await db.userCredit.updateMany({
      where: {
        userId,
        packageId: {
          in: subscriptionIds,
        },
        remaining: {
          gt: 0,
        },
      },
      data: {
        remaining: 0,
      },
    });

    // Then, delete the selected subscriptions
    const deletedSubscriptions = await db.subscription.deleteMany({
      where: {
        userId,
        id: {
          in: subscriptionIds,
        },
      },
    });

    return NextResponse.json({ 
      message: 'Selected subscriptions deleted successfully',
      deletedCount: deletedSubscriptions.count 
    });
  } catch (error) {
    console.error('Error deleting selected subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to delete selected subscriptions' },
      { status: 500 }
    );
  }
}