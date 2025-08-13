import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const packages = await db.package.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, duration, features, credits } = body;

    if (!name || !price || !duration) {
      return NextResponse.json(
        { error: 'Name, price, and duration are required' },
        { status: 400 }
      );
    }

    const newPackage = await db.package.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        credits: credits ? parseInt(credits) : 0,
        features: features ? JSON.stringify(features) : null,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}