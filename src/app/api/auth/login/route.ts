
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // First, try to find the user in the database
    let dbUser = await db.user.findUnique({
      where: { email },
    });

    // For demo purposes, check hardcoded credentials for demo users
    // In a real app, you would hash passwords and use proper authentication
    const hardcodedUsers = [
      { id: '1', email: 'admin@example.com', password: 'admin123', role: 'ADMIN', name: 'Admin User' },
      { id: '2', email: 'user@example.com', password: 'user123', role: 'USER', name: 'Regular User' },
    ];

    const hardcodedUser = hardcodedUsers.find(u => u.email === email && u.password === password);

    // If user exists in database and matches hardcoded credentials, use database user
    if (dbUser && hardcodedUser) {
      return NextResponse.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      });
    }

    // If user exists in database but not in hardcoded list, check if it's a newly registered user
    // For demo purposes, we'll allow any registered user to login with any password
    // In a real app, you would properly hash and verify passwords
    if (dbUser && !hardcodedUser) {
      return NextResponse.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      });
    }

    // If user doesn't exist in database but matches hardcoded credentials, create them
    if (!dbUser && hardcodedUser) {
      dbUser = await db.user.create({
        data: {
          id: hardcodedUser.id,
          email: hardcodedUser.email,
          name: hardcodedUser.name,
          role: hardcodedUser.role as any, // Cast to Role if you have the type imported: as Role
        },
      });

      return NextResponse.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
      });
    }

    // If no user found, return error
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}