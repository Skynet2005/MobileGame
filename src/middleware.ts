import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/signin' || path === '/register' || path === '/api/account/signin' || path === '/api/account/register';
  const isApiPath = path.startsWith('/api/');

  // Skip middleware for API routes except account-related ones
  if (isApiPath && !path.startsWith('/api/account/')) {
    return NextResponse.next();
  }

  // Get the token from both cookies and headers
  const accountCookie = request.cookies.get('account')?.value;
  const accountHeader = request.headers.get('x-account-data');
  const accountData = accountCookie ? JSON.parse(accountCookie) : (accountHeader ? JSON.parse(accountHeader) : null);

  // Handle public paths
  if (isPublicPath) {
    if (accountData && !isApiPath) {
      // If user is authenticated and tries to access auth pages, redirect to game
      return NextResponse.redirect(new URL('/game', request.url));
    }
    return NextResponse.next();
  }

  // If no account data, redirect to signin
  if (!accountData) {
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('account');
    return response;
  }

  // For game routes, check if character exists
  if (path.startsWith('/game')) {
    try {
      // Check if character exists for this account
      const characterResponse = await fetch(`${request.nextUrl.origin}/api/characters/search?accountId=${accountData.id}`);
      if (!characterResponse.ok) {
        throw new Error('Failed to fetch character data');
      }

      const characters = await characterResponse.json();
      if (!characters || characters.length === 0) {
        // No character found, redirect to signin
        const response = NextResponse.redirect(new URL('/signin', request.url));
        response.cookies.delete('account');
        return response;
      }
    } catch (error) {
      console.error('Error checking character:', error);
      // On error, redirect to signin
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('account');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/game/:path*',
    '/signin',
    '/register',
    '/api/characters/:path*',
    '/api/chat/:path*',
    '/api/account/:path*'
  ]
};
