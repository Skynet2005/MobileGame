import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Sign in attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Find account by email
    const account = await prisma.account.findUnique({
      where: { email },
      include: {
        characters: true
      }
    });

    if (!account) {
      console.log('Account not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.passwordHash);
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Return account data (excluding password)
    const { passwordHash: _, ...accountWithoutPassword } = account;
    console.log('Sign in successful for account:', accountWithoutPassword.id);

    return NextResponse.json(
      { account: accountWithoutPassword },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign in' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
