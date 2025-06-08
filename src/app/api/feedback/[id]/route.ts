import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, AuthenticatedRequest } from '@/lib/auth-middleware';

interface RouteParams {
  params: { id: string };
}

// PUT /api/feedback/[id] - Update feedback status (admin only)
export const PUT = requireAdmin(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { isRead } = body;

    if (isRead === undefined) {
      return new Response(
        JSON.stringify({ error: 'isRead field is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return new Response(
        JSON.stringify({ error: 'Feedback not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { isRead },
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

    return new Response(JSON.stringify(updatedFeedback), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// DELETE /api/feedback/[id] - Delete feedback (admin only)
export const DELETE = requireAdmin(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return new Response(
        JSON.stringify({ error: 'Feedback not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.feedback.delete({
      where: { id }
    });

    return new Response(
      JSON.stringify({ message: 'Feedback deleted successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 