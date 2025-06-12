'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleForm {
  formId: string;
  info: {
    title: string;
    description?: string;
  };
}

interface GoogleFormQuestion {
  questionId: string;
  title: string;
  questionItem: {
    question: {
      required?: boolean;
      choiceQuestion?: {
        type: string;
        options: Array<{
          value: string;
        }>;
      };
    };
  };
}

interface FormData {
  title: string;
  description: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    points: number;
  }>;
}

interface GoogleFormImporterProps {
  onImport: (formData: FormData) => void;
  onClose: () => void;
}

export default function GoogleFormImporter({ onImport, onClose }: GoogleFormImporterProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<GoogleForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [extractedFormId, setExtractedFormId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize Google API
  useEffect(() => {
    const initializeGapi = async () => {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('auth2', () => {
          (window as any).gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          });
        });
      };
      document.head.appendChild(script);
    };

    initializeGapi();
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!(window as any).gapi?.auth2) {
        throw new Error('Google API not loaded');
      }

      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not found');
      }

      const user = await authInstance.signIn({
        scope: 'https://www.googleapis.com/auth/forms.readonly'
      });

      if (user.isSignedIn()) {
        setIsAuthenticated(true);
        await loadGoogleForms(user.getAuthResponse().access_token);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Đang phát triển');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleForms = async (accessToken: string) => {
    try {
      setIsLoading(true);
      
      // Note: Google Forms API has limited access, this is a simplified implementation
      // In production, you would need proper API access and potentially use Google Drive API
      // to list forms, then Forms API to get form details
      
      // For demo purposes, we'll simulate the API call
      // In real implementation, you'd call:
      // const response = await fetch('https://forms.googleapis.com/v1/forms', {
      //   headers: { Authorization: `Bearer ${accessToken}` }
      // });
      
      setError('Lưu ý: Google Forms API yêu cầu phê duyệt đặc biệt. Để demo, vui lòng nhập ID Google Form trực tiếp.');
      
    } catch (error) {
      console.error('Error loading forms:', error);
      setError('Không thể tải danh sách Google Forms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualFormId = async () => {
    const formIdToUse = extractedFormId || selectedFormId.trim();
    
    if (!formIdToUse) {
      setError('Vui lòng nhập Google Form URL hoặc Form ID');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Call Google Apps Script endpoint directly with extracted Form ID
      const googleScriptUrl = `https://script.google.com/macros/s/AKfycbwIPZmBJksaZDrFAtyphAIUUKIJ_BgfXJXp4QoBljA9hVkDW7aEyFbGVbw5GL8vMqm3/exec?formId=${formIdToUse}`;
      
      const response = await fetch(googleScriptUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const googleFormData = await response.json();
      console.log('Google Form data received:', googleFormData);

      // Convert Google Apps Script response to our quiz format
      const convertedData = convertGoogleFormToQuiz(googleFormData);
      onImport(convertedData);
      
    } catch (error) {
      console.error('Error importing form:', error);
      setError(`Không thể import Google Form. Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Google Apps Script response to our quiz format
  const convertGoogleFormToQuiz = (googleFormData: any): FormData => {
    try {
      const { formId, questions } = googleFormData;
      
      if (!questions || !Array.isArray(questions)) {
        throw new Error('Invalid questions data from Google Form');
      }

      const convertedQuestions = questions.map((gQuestion: any) => {
        // Extract question data
        const question = gQuestion.question || `Câu hỏi ${gQuestion.index || '?'}`;
        const choices = gQuestion.choices || [];
        
        // Ensure we have at least 2 choices
        const options = choices.length >= 2 ? choices : ['Đáp án A', 'Đáp án B'];
        
        return {
          question: question,
          options: options,
          correctAnswer: 0, // default
          explanation: `Giải thích cho câu hỏi: ${question}`,
          points: 1
        };
      });

      return {
        title: `Quiz từ Google Form (ID: ${formId})`,
        description: `Quiz này được import từ Google Form với ${convertedQuestions.length} câu hỏi`,
        questions: convertedQuestions
      };
    } catch (error) {
      console.error('Error converting Google Form data:', error);
      throw new Error('Không thể chuyển đổi dữ liệu từ Google Form');
    }
  };

  // Extract Form ID from various URL formats
  const extractFormIdFromUrl = (input: string): string => {
    const trimmedInput = input.trim();
    
    // If it's already a Form ID (no URL patterns)
    if (!trimmedInput.includes('http') && !trimmedInput.includes('forms.gle') && !trimmedInput.includes('docs.google.com')) {
      return trimmedInput;
    }
    
    // Extract from full Google Forms URL
    // Pattern: https://docs.google.com/forms/d/FORM_ID/edit or /viewform
    const fullUrlMatch = trimmedInput.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    if (fullUrlMatch) {
      return fullUrlMatch[1];
    }
    
    // Extract from shortened URL
    // Pattern: https://forms.gle/FORM_ID
    const shortUrlMatch = trimmedInput.match(/forms\.gle\/([a-zA-Z0-9-_]+)/);
    if (shortUrlMatch) {
      return shortUrlMatch[1];
    }
    
    return trimmedInput; // Return as-is if no pattern matches
  };

  // Handle input change with auto-extraction
  const handleInputChange = (value: string) => {
    setSelectedFormId(value);
    const extracted = extractFormIdFromUrl(value);
    setExtractedFormId(extracted);
    
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
              <svg className="h-8 w-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import Quiz từ Google Form
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Xác thực Google (Tùy chọn)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Xác thực với Google để truy cập Google Forms của bạn
              </p>
              {!isAuthenticated ? (
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                >
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? 'Đang xác thực...' : 'Đăng nhập với Google'}
                </button>
              ) : (
                <div className="flex items-center text-green-600 bg-green-50 rounded-lg p-3">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Đã xác thực thành công</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Nhập Google Form
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Nhập URL Google Form hoặc Form ID để import câu hỏi tự động
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Google Form URL hoặc Form ID
                  </label>
                  <input
                    type="text"
                    value={selectedFormId}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="https://docs.google.com/forms/d/1YBIKbihEyGUjJDKt39BUzRJpiBHtM0F3BN0yDpggO5Q/edit"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  />
                  
                  {/* Show extracted Form ID */}
                  {extractedFormId && extractedFormId !== selectedFormId && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <strong>Form ID được tìm thấy:</strong> 
                        <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-mono">{extractedFormId}</code>
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">💡 Các định dạng được hỗ trợ:</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span className="font-medium">URL đầy đủ:</span>
                        <code className="ml-1 text-gray-800">https://docs.google.com/forms/d/FORM_ID/edit</code>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span className="font-medium">URL ngắn:</span>
                        <code className="ml-1 text-gray-800">https://forms.gle/FORM_ID</code>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span className="font-medium">Chỉ Form ID:</span>
                        <code className="ml-1 text-gray-800">1YBIKbihEyGUjJDKt39BUzRJpiBHtM0F3BN0yDpggO5Q</code>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleManualFormId}
                  disabled={isLoading || !(extractedFormId || selectedFormId.trim())}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang import...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Import Quiz từ Google Form
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">📚</span>
                Hướng dẫn sử dụng
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <p>Mở Google Form của bạn </p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <p>Chọn form, bật chỉnh chia sẻ công khai cho người xem và chỉnh sửa</p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <p>Copy URL, Paste vô đây</p>
                </div>
                <div className="flex items-start">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                  <p>Done!, tắt quyền chỉnh sửa trong form</p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg mt-4">
                  <p className="text-orange-800 text-sm">
                    <strong>⚠️ Lưu ý:</strong> Cách 2 này không hỗ trợ import đáp án, chỉ hỗ trợ import câu hỏi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}   