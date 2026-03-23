/**
 * NextAuth.js API Route
 * 
 * The auth configuration is in src/lib/auth.ts (extracted so it can be
 * imported by getServerSession() in server components/API routes).
 * 
 * This route file only exports the GET and POST handlers that
 * Next.js App Router requires.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
