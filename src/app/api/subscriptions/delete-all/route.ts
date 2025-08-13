import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First, reset all remaining credits to 0 for this user
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

    // Then, delete all subscriptions for this user
    const deletedSubscriptions = await db.subscription.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({ 
      message: 'All subscription history deleted successfully',
      deletedCount: deletedSubscriptions.count 
    });
  } catch (error) {
    console.error('Error deleting all subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to delete all subscriptions' },
      { status: 500 }
    );
  }
}