import { auth } from './firebase';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : '/api';

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Request: ${options.method || 'GET'} ${url}`, { hasToken: !!token });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`API Error: ${response.status}`, errorData);
    
    // If token is invalid/expired, try to refresh it
    if (response.status === 401 && token) {
      console.log('Token might be expired, trying to refresh...');
      try {
        const user = auth.currentUser;
        if (user) {
          const newToken = await user.getIdToken(true); // Force refresh
          if (newToken !== token) {
            console.log('Token refreshed, retrying request...');
            // Retry with new token
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// User API
export const userAPI = {
  // Create or update user after Firebase auth
  createOrUpdateUser: async (userData: {
    firebaseUid: string;
    email: string;
    displayName: string;
    avatar?: string;
  }) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get current user profile
  getCurrentUser: async () => {
    return apiRequest('/users');
  },

  // Update user profile
  updateProfile: async (data: { displayName?: string; avatar?: string }) => {
    return apiRequest('/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Quiz API
export const quizAPI = {
  // Get all quizzes
  getQuizzes: async (params?: { category?: string; difficulty?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    
    const query = searchParams.toString();
    return apiRequest(`/quizzes${query ? `?${query}` : ''}`);
  },

  // Get quiz by ID
  getQuiz: async (id: string) => {
    return apiRequest(`/quizzes/${id}`);
  },

  // Create quiz (admin only)
  createQuiz: async (quizData: any) => {
    return apiRequest('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  },

  // Update quiz (admin only)
  updateQuiz: async (id: string, quizData: any) => {
    return apiRequest(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
  },

  // Delete quiz (admin only)
  deleteQuiz: async (id: string) => {
    return apiRequest(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Submission API
export const submissionAPI = {
  // Get user submissions
  getSubmissions: async (quizId?: string) => {
    const query = quizId ? `?quizId=${quizId}` : '';
    return apiRequest(`/submissions${query}`);
  },

  // Submit quiz answers
  submitQuiz: async (submissionData: {
    quizId: string;
    answers: number[];
    timeSpent: number;
    startedAt: string;
  }) => {
    return apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },
};

// Feedback API
export const feedbackAPI = {
  // Get all feedback (admin only)
  getFeedback: async (params?: { type?: string; isRead?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.isRead) searchParams.append('isRead', params.isRead);
    
    const query = searchParams.toString();
    return apiRequest(`/feedback${query ? `?${query}` : ''}`);
  },

  // Create feedback
  createFeedback: async (feedbackData: {
    message: string;
    type: string;
    quizId?: string;
  }) => {
    return apiRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  // Update feedback status (admin only)
  updateFeedback: async (id: string, data: { isRead: boolean }) => {
    return apiRequest(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete feedback (admin only)
  deleteFeedback: async (id: string) => {
    return apiRequest(`/feedback/${id}`, {
      method: 'DELETE',
    });
  },
}; 