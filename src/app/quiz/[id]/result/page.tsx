'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockQuizzes } from '@/data/mockData';
import { Quiz, QuizSubmission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultPageProps {
  params: { id: string };
}

export default function ResultPage({ params }: ResultPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    // Load quiz
    const foundQuiz = mockQuizzes.find(q => q.id === params.id);
    if (!foundQuiz) {
      router.push('/dashboard');
      return;
    }

    // Load result from localStorage
    const savedResult = localStorage.getItem('lastQuizResult');
    if (!savedResult) {
      router.push('/dashboard');
      return;
    }

    setQuiz(foundQuiz);
    setResult(JSON.parse(savedResult));
  }, [user, loading, router, params.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'Xuất sắc! 🎉';
    if (percentage >= 80) return 'Rất tốt! 👏';
    if (percentage >= 70) return 'Tốt! 👍';
    if (percentage >= 60) return 'Khá! 📚';
    return 'Cần cố gắng thêm! 💪';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !quiz || !result) {
    return null;
  }

  const percentage = Math.round((result.score / result.totalPoints) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kết quả quiz</h1>
              <p className="text-sm text-gray-600">{quiz.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">
              {getScoreMessage(result.score, result.totalPoints)}
            </CardTitle>
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(result.score, result.totalPoints)}`}>
              {percentage}%
            </div>
            <div className="text-gray-600">
              {result.score} / {result.totalPoints} điểm
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {quiz.questions.length}
                </div>
                <div className="text-sm text-gray-600">Tổng số câu</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.answers.filter((answer: number, index: number) => 
                    answer === quiz.questions[index].correctAnswer
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Câu đúng</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(result.timeSpent)}
                </div>
                <div className="text-sm text-gray-600">Thời gian làm bài</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết kết quả</h2>
          
          {quiz.questions.map((question, index) => {
            const userAnswer = result.answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <Card key={question.id} className={`border-l-4 ${
                isCorrect ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      Câu {index + 1}: {question.question}
                    </CardTitle>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? `+${question.points} điểm` : '0 điểm'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div 
                        key={optionIndex}
                        className={`p-3 rounded-lg border ${
                          optionIndex === question.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : optionIndex === userAnswer && !isCorrect
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          <div className="flex items-center space-x-2">
                            {optionIndex === question.correctAnswer && (
                              <span className="text-green-600 text-sm font-medium">
                                ✓ Đáp án đúng
                              </span>
                            )}
                            {optionIndex === userAnswer && userAnswer !== question.correctAnswer && (
                              <span className="text-red-600 text-sm font-medium">
                                ✗ Bạn đã chọn
                              </span>
                            )}
                            {optionIndex === userAnswer && userAnswer === question.correctAnswer && (
                              <span className="text-green-600 text-sm font-medium">
                                ✓ Bạn đã chọn đúng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Giải thích:</h4>
                      <p className="text-blue-800">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feedback Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Gửi phản hồi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Bạn có góp ý gì về bài quiz này không? Hãy chia sẻ với chúng tôi!
            </p>
            <button
              onClick={() => router.push(`/quiz/feedback?quizId=${quiz.id}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Gửi phản hồi
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 