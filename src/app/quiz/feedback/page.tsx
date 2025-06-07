'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockQuizzes } from '@/data/mockData';
import { Quiz } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'question' | 'suggestion' | 'bug_report'>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (quizId) {
      const foundQuiz = mockQuizzes.find(q => q.id === quizId);
      if (foundQuiz) {
        setQuiz(foundQuiz);
      }
    }
  }, [user, loading, router, quizId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real app, this would save to database
      const feedback = {
        id: `feedback-${Date.now()}`,
        userId: user.id,
        userName: user.displayName,
        quizId: quiz?.id,
        quizTitle: quiz?.title,
        message: message.trim(),
        type,
        createdAt: new Date(),
        isRead: false,
      };

      console.log('Feedback submitted:', feedback);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">Cảm ơn bạn!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Phản hồi của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và cải thiện dựa trên góp ý của bạn.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Về trang chủ
              </button>
              {quiz && (
                <button
                  onClick={() => router.push(`/quiz/${quiz.id}/result`)}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                >
                  Xem lại kết quả
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gửi phản hồi</h1>
              {quiz && (
                <p className="text-sm text-gray-600">Về bài quiz: {quiz.title}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Chia sẻ góp ý của bạn</CardTitle>
            <p className="text-gray-600">
              Phản hồi của bạn giúp chúng tôi cải thiện chất lượng bài quiz và trải nghiệm học tập.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phản hồi
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="suggestion"
                      checked={type === 'suggestion'}
                      onChange={(e) => setType(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Góp ý cải thiện</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="question"
                      checked={type === 'question'}
                      onChange={(e) => setType(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Câu hỏi về nội dung</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="bug_report"
                      checked={type === 'bug_report'}
                      onChange={(e) => setType(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Báo lỗi</span>
                  </label>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung phản hồi
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Chia sẻ ý kiến, góp ý hoặc câu hỏi của bạn..."
                  required
                />
                <div className="mt-1 text-sm text-gray-500">
                  {message.length}/500 ký tự
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 