import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { id: params.id },
      include: {
        package: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get the subscription before updating to check if it's being cancelled
    const existingSubscription = await db.subscription.findUnique({
      where: { id: params.id },
      include: {
        package: true,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const updatedSubscription = await db.subscription.update({
      where: { id: params.id },
      data: { status },
      include: {
        package: true,
      },
    });

    // If subscription is being cancelled, reset all remaining credits to 0
    if (status === 'CANCELLED') {
      await db.userCredit.updateMany({
        where: {
          userId: existingSubscription.userId,
          packageId: existingSubscription.packageId,
          remaining: {
            gt: 0, // Only update credits that are still available
          },
        },
        data: {
          remaining: 0, // Set remaining credits to 0
        },
      });
    }

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.subscription.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}