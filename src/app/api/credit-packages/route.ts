import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const creditPackages = await db.creditPackage.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(creditPackages);
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, credits, price } = body;

    if (!name || !credits || !price) {
      return NextResponse.json(
        { error: 'Name, credits, and price are required' },
        { status: 400 }
      );
    }

    const newCreditPackage = await db.creditPackage.create({
      data: {
        name,
        description,
        credits: parseInt(credits),
        price: parseFloat(price),
      },
    });

    return NextResponse.json(newCreditPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating credit package:', error);
    return NextResponse.json(
      { error: 'Failed to create credit package' },
      { status: 500 }
    );
  }
}