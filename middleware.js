// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ✅ Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/',               // homepage
  '/chat(.*)',       // any chat-related pages
  '/upload(.*)',     // upload pages
  '/profile(.*)',    // profile pages
  '/history(.*)',    // history pages
  '/api/(.*)'        // all API endpoints
])

// ✅ Middleware handler
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Enforce authentication – redirects to sign-in for pages, 404 for APIs
    await auth.protect()
  }
})

// ✅ Config for matcher — skip static assets and _next internals
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
}
