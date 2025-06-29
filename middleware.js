// middleware.js
import { NextResponse } from 'next/server';
import { createRouteMatcher } from '@clerk/nextjs/server';

// 1. Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/',           // Protect home
  '/profile',      // Example protected page
  '/chat(.*)',   // Protect dynamic chat pages
  '/upload(.*)', // Protect file upload pages
  '/history(.*)', // Protect history
  '/api/(.*)',
]);

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // 2. Allow public routes without auth
  const publicRoutes = ['/sign-in', '/sign-up'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. If it's a protected route and the user is not signed in → redirect
  const token = request.cookies.get('__session'); // Clerk stores session token here

  if (isProtectedRoute(request) && !token) {
    const signUpUrl = new URL('/sign-up', request.url);
    return NextResponse.redirect(signUpUrl);
  }

  return NextResponse.next();
}
