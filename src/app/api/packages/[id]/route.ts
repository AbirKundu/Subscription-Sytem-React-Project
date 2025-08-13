import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageItem = await db.package.findUnique({
      where: { id: params.id },
    });

    if (!packageItem) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(packageItem);
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
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
    const { name, description, price, duration, features, isActive, credits } = body;

    const updatedPackage = await db.package.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(features !== undefined && { features: features ? JSON.stringify(features) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.package.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}