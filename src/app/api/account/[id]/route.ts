import { NextResponse } from 'next/server';
import { AccountService } from '@/lib/db/services/accountService';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const accountService = new AccountService();
    const account = await accountService.getAccountById(params.id);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}
