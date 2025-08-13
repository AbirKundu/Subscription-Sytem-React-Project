import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creditPackage = await db.creditPackage.findUnique({
      where: { id: params.id },
    });

    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Credit package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(creditPackage);
  } catch (error) {
    console.error('Error fetching credit package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit package' },
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
    const { name, description, credits, price, isActive } = body;

    const updatedCreditPackage = await db.creditPackage.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedCreditPackage);
  } catch (error) {
    console.error('Error updating credit package:', error);
    return NextResponse.json(
      { error: 'Failed to update credit package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.creditPackage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Credit package deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit package:', error);
    return NextResponse.json(
      { error: 'Failed to delete credit package' },
      { status: 500 }
    );
  }
}