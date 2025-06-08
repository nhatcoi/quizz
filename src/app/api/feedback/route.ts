import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '@/lib/auth-middleware';

// GET /api/feedback - Get feedback (admin only)
export const GET = requireAdmin(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    const where: any = {};

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    if (isRead !== null && isRead !== 'all') {
      where.isRead = isRead === 'true';
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return new Response(JSON.stringify(feedback), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// POST /api/feedback - Create feedback
export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { message, type, quizId } = body;

    if (!message || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate type
    const validTypes = ['QUESTION', 'SUGGESTION', 'BUG_REPORT'];
    if (!validTypes.includes(type.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid feedback type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate quiz if provided
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId }
      });

      if (!quiz) {
        return new Response(
          JSON.stringify({ error: 'Quiz not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
        type: type.toUpperCase(),
        userId: request.user!.id,
        ...(quizId && { quizId }),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    return new Response(JSON.stringify(feedback), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 