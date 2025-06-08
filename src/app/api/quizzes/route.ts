import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '@/lib/auth-middleware';

// GET /api/quizzes - Get all published quizzes (for users) or all quizzes (for admins)
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const isAdmin = request.user!.role === 'ADMIN';

    const where: any = {};
    
    // Non-admin users can only see published quizzes
    if (!isAdmin) {
      where.isPublished = true;
    }

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        },
        questions: {
          select: {
            id: true,
            // Don't include answers for security
          }
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include question count
    const transformedQuizzes = quizzes.map((quiz: any) => ({
      ...quiz,
      questionCount: quiz._count.questions,
      submissionCount: quiz._count.submissions,
      _count: undefined,
    }));

    return new Response(JSON.stringify(transformedQuizzes), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// POST /api/quizzes - Create new quiz (admin only)
export const POST = requireAdmin(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { title, description, timeLimit, difficulty, category, questions, isPublished } = body;

    if (!title || !description || !category || !questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question || !question.options || question.options.length < 2 || 
          question.correctAnswer === undefined || question.correctAnswer < 0 || 
          question.correctAnswer >= question.options.length) {
        return new Response(
          JSON.stringify({ error: 'Invalid question format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit,
        difficulty: difficulty?.toUpperCase() || 'MEDIUM',
        category,
        isPublished: isPublished || false,
        createdBy: request.user!.id,
        questions: {
          create: questions.map((q: any, index: number) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 1,
            order: index,
          }))
        }
      },
      include: {
        questions: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        }
      }
    });

    return new Response(JSON.stringify(quiz), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 