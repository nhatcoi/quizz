'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { quizAPI } from '@/lib/api';
import { Quiz } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleFormImporter from '@/components/GoogleFormImporter';

interface QuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

interface QuizFormData {
  title: string;
  description: string;
  timeLimit: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  isPublished: boolean;
  questions: QuestionData[];
}

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const CATEGORY_OPTIONS = [
  'JavaScript',
  'React',
  'Node.js',
  'TypeScript',
  'CSS',
  'HTML',
  'Database',
  'Algorithm',
  'General',
];

interface EditQuizPageProps {
  params: { id: string };
}

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showGoogleImporter, setShowGoogleImporter] = useState(false);
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    timeLimit: 30,
    difficulty: 'MEDIUM',
    category: 'JavaScript',
    isPublished: false,
    questions: [
      {
        question: '',
        options: ['', ''],
        correctAnswer: 0,
        explanation: '',
        points: 1,
      },
    ],
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (user && user.role === 'admin') {
      loadQuiz();
    }
  }, [params.id, user, loading, router]);

  const loadQuiz = async () => {
    try {
      setLoadingQuiz(true);
      const quizData = await quizAPI.getQuiz(params.id);
      setQuiz(quizData);
      
      // Populate form with quiz data
      setFormData({
        title: quizData.title,
        description: quizData.description,
        timeLimit: quizData.timeLimit || 30,
        difficulty: quizData.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
        category: quizData.category,
        isPublished: quizData.isPublished,
        questions: quizData.questions?.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          points: q.points || 1,
        })) || [],
      });
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Không thể tải quiz. Vui lòng thử lại.');
      router.push('/admin/quizzes');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (index: number, field: keyof QuestionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
            } 
          : q
      ),
    }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', ''],
          correctAnswer: 0,
          explanation: '',
          points: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }));
    }
  };

  const addOption = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...q.options, ''] }
          : q
      ),
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    if (question.options.length <= 2) return; // Ít nhất 2 lựa chọn

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === questionIndex) {
          const newOptions = q.options.filter((_, oi) => oi !== optionIndex);
          let newCorrectAnswer = q.correctAnswer;
          
          // Điều chỉnh correctAnswer nếu option bị xóa
          if (optionIndex === q.correctAnswer) {
            newCorrectAnswer = 0; // Reset về option đầu tiên
          } else if (optionIndex < q.correctAnswer) {
            newCorrectAnswer = q.correctAnswer - 1;
          }
          
          return {
            ...q,
            options: newOptions,
            correctAnswer: newCorrectAnswer,
          };
        }
        return q;
      }),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề quiz');
      return false;
    }

    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả quiz');
      return false;
    }

    if (formData.questions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi');
      return false;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      
      if (!question.question.trim()) {
        alert(`Vui lòng nhập câu hỏi ${i + 1}`);
        return false;
      }

      if (question.options.some(opt => !opt.trim())) {
        alert(`Vui lòng nhập đầy đủ các lựa chọn cho câu hỏi ${i + 1}`);
        return false;
      }

      if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
        alert(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !quiz) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await quizAPI.updateQuiz(quiz.id, formData);
      alert('Cập nhật quiz thành công!');
      router.push('/admin/quizzes');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Có lỗi xảy ra khi cập nhật quiz. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleImport = (importedData: any) => {
    setFormData(prev => ({
      ...prev,
      title: importedData.title,
      description: importedData.description,
      questions: importedData.questions,
    }));
    setShowGoogleImporter(false);
    alert('Import thành công! Dữ liệu quiz đã được thay thế. Vui lòng kiểm tra và chỉnh sửa nếu cần.');
  };

  if (loading || loadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin' || !quiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/quizzes')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Quiz</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/quizzes')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
                     {/* Quiz Information */}
           <Card>
             <CardHeader>
               <div className="flex justify-between items-center">
                 <CardTitle>Thông tin Quiz</CardTitle>
                 <button
                   type="button"
                   onClick={() => setShowGoogleImporter(true)}
                   className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                 >
                   <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                   </svg>
                   Import từ Google Form
                 </button>
               </div>
             </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề Quiz *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tiêu đề quiz..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mô tả quiz..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DIFFICULTY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORY_OPTIONS.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                  Xuất bản
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Câu hỏi ({formData.questions.length})</CardTitle>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Thêm câu hỏi
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Câu hỏi {questionIndex + 1}
                    </h3>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nội dung câu hỏi *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập câu hỏi..."
                        required
                      />
                    </div>

                                         <div>
                       <div className="flex justify-between items-center mb-2">
                         <label className="block text-sm font-medium text-gray-700">
                           Lựa chọn *
                         </label>
                         <button
                           type="button"
                           onClick={() => addOption(questionIndex)}
                           className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                         >
                           <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                           </svg>
                           Thêm lựa chọn
                         </button>
                       </div>
                       <div className="space-y-2">
                         {question.options.map((option, optionIndex) => (
                           <div key={optionIndex} className="flex items-center space-x-2">
                             <input
                               type="radio"
                               name={`correct-${questionIndex}`}
                               checked={question.correctAnswer === optionIndex}
                               onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                             />
                             <input
                               type="text"
                               value={option}
                               onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                               className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder={`Lựa chọn ${optionIndex + 1}...`}
                               required
                             />
                             {question.options.length > 2 && (
                               <button
                                 type="button"
                                 onClick={() => removeOption(questionIndex, optionIndex)}
                                 className="text-red-600 hover:text-red-800 p-1"
                                 title="Xóa lựa chọn"
                               >
                                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giải thích
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Giải thích đáp án..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Điểm số
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/quizzes')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật Quiz'}
            </button>
          </div>
                 </form>
       </main>

       {/* Google Form Importer Modal */}
       {showGoogleImporter && (
         <GoogleFormImporter
           onImport={handleGoogleImport}
           onClose={() => setShowGoogleImporter(false)}
         />
       )}
     </div>
   );
 } 