'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { quizAPI, submissionAPI } from '@/lib/api';
import { Quiz, QuizProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizPageProps {
  params: { id: string };
}

export default function QuizPage({ params }: QuizPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<QuizProgress>({
    currentQuestion: 0,
    answers: [],
    startTime: new Date(),
  });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadQuiz();
    }
  }, [params.id, user, loading, router]);

  const loadQuiz = async () => {
    try {
      setLoadingQuiz(true);
      setError(null);
      const quizData = await quizAPI.getQuiz(params.id);
      
      if (!quizData.isPublished) {
        router.push('/dashboard');
        return;
      }

      setQuiz(quizData);
      
      // Initialize progress
      const questionCount = quizData.questions?.length || 0;
      setProgress(prev => ({
        ...prev,
        answers: new Array(questionCount).fill(null),
        timeRemaining: quizData.timeLimit ? quizData.timeLimit * 60 : undefined,
      }));

      if (quizData.timeLimit) {
        setTimeRemaining(quizData.timeLimit * 60);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Không thể tải quiz. Vui lòng thử lại.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting]);

  const handleAnswerSelect = (answerIndex: number) => {
    setProgress(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestion] = answerIndex;
      return { ...prev, answers: newAnswers };
    });
  };

  const handleNext = () => {
    if (quiz?.questions && progress.currentQuestion < quiz.questions.length - 1) {
      setProgress(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
    }
  };

  const handlePrevious = () => {
    if (progress.currentQuestion > 0) {
      setProgress(prev => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }));
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const timeSpent = Math.floor((new Date().getTime() - progress.startTime.getTime()) / 1000);
      
      const submission = await submissionAPI.submitQuiz({
        quizId: quiz.id,
        answers: progress.answers.map(answer => answer ?? -1), // Convert null to -1
        timeSpent,
        startedAt: progress.startTime.toISOString(),
      });

      // Store result for results page
      localStorage.setItem('lastQuizResult', JSON.stringify(submission));
      router.push(`/quiz/${quiz.id}/result`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || loadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadQuiz}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!user || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const currentQuestion = quiz.questions[progress.currentQuestion];
  const progressPercentage = ((progress.currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">
                Câu {progress.currentQuestion + 1} / {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {timeRemaining !== null && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining <= 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {formatTime(timeRemaining)}
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentQuestion.question}
            </CardTitle>
            <div className="text-sm text-gray-500">
              Điểm: {currentQuestion.points}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label 
                  key={index}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    progress.answers[progress.currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={progress.answers[progress.currentQuestion] === index}
                    onChange={() => handleAnswerSelect(index)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    progress.answers[progress.currentQuestion] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {progress.answers[progress.currentQuestion] === index && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={progress.currentQuestion === 0}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Câu trước
          </button>

          <div className="text-sm text-gray-500">
            {progress.answers.filter(answer => answer !== null).length} / {quiz.questions.length} câu đã trả lời
          </div>

          {progress.currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Câu tiếp theo
            </button>
          )}
        </div>
      </main>
    </div>
  );
} 