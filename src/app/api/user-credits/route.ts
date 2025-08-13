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

    const userCredits = await db.userCredit.findMany({
      where: { userId },
      include: {
        package: true,
        creditPackage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total remaining credits
    const totalCredits = userCredits.reduce((sum, credit) => sum + credit.remaining, 0);

    return NextResponse.json({
      credits: userCredits,
      totalCredits,
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user credits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageId, creditPackageId, credits, expiryDays } = body;

    if (!userId || !credits || (!packageId && !creditPackageId)) {
      return NextResponse.json(
        { error: 'User ID, credits, and either package ID or credit package ID are required' },
        { status: 400 }
      );
    }

    // Calculate expiry date if provided
    let expiryDate = null;
    if (expiryDays) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
    }

    const newUserCredit = await db.userCredit.create({
      data: {
        userId,
        packageId,
        creditPackageId,
        credits: parseInt(credits),
        remaining: parseInt(credits),
        expiryDate,
      },
      include: {
        package: true,
        creditPackage: true,
      },
    });

    return NextResponse.json(newUserCredit, { status: 201 });
  } catch (error) {
    console.error('Error creating user credit:', error);
    return NextResponse.json(
      { error: 'Failed to create user credit' },
      { status: 500 }
    );
  }
}