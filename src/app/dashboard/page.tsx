'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockQuizzes } from '@/data/mockData';
import { Quiz } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    
    // Load published quizzes only
    const publishedQuizzes = mockQuizzes.filter(quiz => quiz.isPublished);
    setQuizzes(publishedQuizzes);
  }, [user, loading, router]);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QuizApp</h1>
              <p className="text-sm text-gray-600">Xin chào, {user.displayName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/quiz/feedback')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Góp ý
              </button>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Danh sách bài quiz</h2>
          <p className="text-gray-600">Chọn một bài quiz để bắt đầu học tập</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{quiz.title}</CardTitle>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                    {getDifficultyText(quiz.difficulty)}
                  </span>
                </div>
                <CardDescription className="text-gray-600">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Danh mục:</span>
                    <span className="font-medium">{quiz.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Số câu hỏi:</span>
                    <span className="font-medium">{quiz.questions.length}</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Thời gian:</span>
                      <span className="font-medium">{quiz.timeLimit} phút</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => router.push(`/quiz/${quiz.id}`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Bắt đầu làm bài
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có bài quiz nào được phát hành.</p>
          </div>
        )}
      </main>
    </div>
  );
} 