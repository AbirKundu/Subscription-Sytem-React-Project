import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userCredit = await db.userCredit.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        package: true,
        creditPackage: true,
      },
    });

    if (!userCredit) {
      return NextResponse.json(
        { error: 'User credit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userCredit);
  } catch (error) {
    console.error('Error fetching user credit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user credit' },
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
    const { remaining, expiryDate } = body;

    const updatedUserCredit = await db.userCredit.update({
      where: { id: params.id },
      data: {
        ...(remaining !== undefined && { remaining: parseInt(remaining) }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      },
      include: {
        package: true,
        creditPackage: true,
      },
    });

    return NextResponse.json(updatedUserCredit);
  } catch (error) {
    console.error('Error updating user credit:', error);
    return NextResponse.json(
      { error: 'Failed to update user credit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.userCredit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User credit deleted successfully' });
  } catch (error) {
    console.error('Error deleting user credit:', error);
    return NextResponse.json(
      { error: 'Failed to delete user credit' },
      { status: 500 }
    );
  }
}