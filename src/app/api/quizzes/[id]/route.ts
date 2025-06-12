import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '@/lib/auth-middleware';

interface RouteParams {
  params: { id: string };
}

// GET /api/quizzes/[id] - Get quiz by ID
export const GET = requireAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const isAdmin = request.user!.role === 'ADMIN';

    const quiz = await prisma.quiz.findUnique({
      where: { id },
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
            question: true,
            options: true,
            explanation: true,
            points: true,
            order: true,
            // Only include correct answer for admins
            ...(isAdmin && { correctAnswer: true }),
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            submissions: true,
          }
        }
      }
    });

    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user can access this quiz
    if (!isAdmin && !quiz.isPublished) {
      return new Response(
        JSON.stringify({ error: 'Quiz not available' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({
      ...quiz,
      submissionCount: quiz._count.submissions,
      _count: undefined,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// PUT /api/quizzes/[id] - Update quiz (admin only)
export const PUT = requireAdmin(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, timeLimit, difficulty, category, isPublished, questions } = body;

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true }
    });

    if (!existingQuiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update quiz and questions in a transaction
    const updatedQuiz = await prisma.$transaction(async (tx: any) => {
      // Update quiz
      const quiz = await tx.quiz.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(timeLimit !== undefined && { timeLimit }),
          ...(difficulty && { difficulty: difficulty.toUpperCase() }),
          ...(category && { category }),
          ...(isPublished !== undefined && { isPublished }),
        }
      });

      // Update questions if provided
      if (questions) {
        // Validate questions
        for (const question of questions) {
          if (!question.question || !question.options || question.options.length < 2 || 
              question.correctAnswer === undefined || question.correctAnswer < 0 || 
              question.correctAnswer >= question.options.length) {
            throw new Error('Invalid question format');
          }
        }

        // Delete existing questions
        await tx.question.deleteMany({
          where: { quizId: id }
        });

        // Create new questions
        await tx.question.createMany({
          data: questions.map((q: any, index: number) => ({
            quizId: id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 1,
            order: index,
          }))
        });
      }

      return quiz;
    });

    // Fetch updated quiz with questions
    const fullQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        }
      }
    });

    return new Response(JSON.stringify(fullQuiz), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// DELETE /api/quizzes/[id] - Delete quiz (admin only)
export const DELETE = requireAdmin(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;

    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.quiz.delete({
      where: { id }
    });

    return new Response(
      JSON.stringify({ message: 'Quiz deleted successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 