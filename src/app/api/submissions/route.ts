import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

// GET /api/submissions - Get user's submissions
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');

    const where: any = {
      userId: request.user!.id
    };

    if (quizId) {
      where.quizId = quizId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return new Response(JSON.stringify(submissions), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// POST /api/submissions - Submit quiz answers
export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { quizId, answers, timeSpent, startedAt } = body;

    if (!quizId || !answers || !Array.isArray(answers) || !startedAt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!quiz.isPublished) {
      return new Response(
        JSON.stringify({ error: 'Quiz not available' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach((question: any, index: number) => {
      totalPoints += question.points;
      if (answers[index] === question.correctAnswer) {
        score += question.points;
      }
    });

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId: request.user!.id,
        quizId,
        answers,
        score,
        totalPoints,
        timeSpent: timeSpent || 0,
        startedAt: new Date(startedAt),
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          }
        }
      }
    });

    return new Response(JSON.stringify(submission), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 