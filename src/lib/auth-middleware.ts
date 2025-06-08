import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: 'USER' | 'ADMIN';
    firebaseUid: string;
  };
}

export async function verifyAuth(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  console.log('Verifying token:', token.substring(0, 20) + '...');

  try {
    // For development, we'll do a simplified verification
    // In production, you should use proper Firebase Admin SDK
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: skipping Firebase token verification');
      
      // For development, use a default user
      const user = await prisma.user.findFirst({
        where: { email: 'admin@example.com' } // Default to admin user for testing
      });

      if (!user) {
        throw new Error('Default user not found in database');
      }

      console.log('Using default user for development:', user.email, user.role);

      // Add user to request
      (request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        firebaseUid: user.firebaseUid!,
      };

      return request as AuthenticatedRequest;
    } else {
      // Production: use proper Firebase Admin SDK
      const { auth } = await import('./firebase-admin');
      const decodedToken = await auth.verifyIdToken(token);
      console.log('Token verified for user:', decodedToken.uid, decodedToken.email);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid }
      });

      if (!user) {
        console.error('User not found in database for firebaseUid:', decodedToken.uid);
        throw new Error('User not found in database');
      }

      console.log('User found in database:', user.email, user.role);

      // Add user to request
      (request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        firebaseUid: user.firebaseUid!,
      };

      return request as AuthenticatedRequest;
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<Response>) {
  return async (request: NextRequest, context?: any) => {
    try {
      const authenticatedRequest = await verifyAuth(request);
      return await handler(authenticatedRequest, context);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

export function requireAdmin(handler: (req: AuthenticatedRequest, context?: any) => Promise<Response>) {
  return requireAuth(async (request: AuthenticatedRequest, context?: any) => {
    if (request.user?.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return await handler(request, context);
  });
} 