import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

// GET /api/users - Get current user profile
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        avatar: true,
        createdAt: true,
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// POST /api/users - Create or update user (called after Firebase auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseUid, email, displayName, avatar } = body;

    if (!firebaseUid || !email || !displayName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          email,
          displayName,
          avatar,
        }
      });
    } else {
      // Create new user
      // Check if email should be admin
      const role = email === 'admin@example.com' ? 'ADMIN' : 'USER';
      
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          displayName,
          avatar,
          role,
        }
      });
    }

    return new Response(JSON.stringify(user), {
      status: existingUser ? 200 : 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/users - Update user profile
export const PUT = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { displayName, avatar } = body;

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        ...(displayName && { displayName }),
        ...(avatar && { avatar }),
      }
    });

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 