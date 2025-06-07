'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockFeedbacks } from '@/data/mockData';
import { Feedback } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminFeedback() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'question' | 'suggestion' | 'bug_report'>('all');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    setFeedbacks(mockFeedbacks);
  }, [user, loading, router]);

  const filteredFeedbacks = feedbacks.filter(feedback => {
    switch (filter) {
      case 'unread': return !feedback.isRead;
      case 'question': return feedback.type === 'question';
      case 'suggestion': return feedback.type === 'suggestion';
      case 'bug_report': return feedback.type === 'bug_report';
      default: return true;
    }
  });

  const markAsRead = (feedbackId: string) => {
    setFeedbacks(prev => 
      prev.map(f => f.id === feedbackId ? { ...f, isRead: true } : f)
    );
  };

  const markAsUnread = (feedbackId: string) => {
    setFeedbacks(prev => 
      prev.map(f => f.id === feedbackId ? { ...f, isRead: false } : f)
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'question': return 'Câu hỏi';
      case 'suggestion': return 'Góp ý';
      case 'bug_report': return 'Báo lỗi';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-700';
      case 'suggestion': return 'bg-green-100 text-green-700';
      case 'bug_report': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quản lý phản hồi</h1>
              <p className="text-sm text-gray-600">
                {filteredFeedbacks.length} phản hồi
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Về Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'unread', label: 'Chưa đọc' },
                { key: 'question', label: 'Câu hỏi' },
                { key: 'suggestion', label: 'Góp ý' },
                { key: 'bug_report', label: 'Báo lỗi' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {key === 'unread' && (
                    <span className="ml-1 text-xs">
                      ({feedbacks.filter(f => !f.isRead).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-4 text-lg text-gray-600">Không có phản hồi nào</p>
              <p className="text-gray-500">Chọn bộ lọc khác để xem phản hồi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className={`${!feedback.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg">{feedback.userName}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(feedback.type)}`}>
                          {getTypeLabel(feedback.type)}
                        </span>
                        {!feedback.isRead && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Chưa đọc
                          </span>
                        )}
                      </div>
                      {feedback.quizTitle && (
                        <p className="text-sm text-gray-600 mb-1">
                          Về bài quiz: <span className="font-medium">{feedback.quizTitle}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {feedback.createdAt.toLocaleDateString('vi-VN')} lúc {feedback.createdAt.toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {feedback.isRead ? (
                        <button
                          onClick={() => markAsUnread(feedback.id)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Đánh dấu chưa đọc
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(feedback.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{feedback.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 