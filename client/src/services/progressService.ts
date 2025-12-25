import { apiClient } from './api';

// Study Mode Progress Types
interface StudyProgress {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  createdAt: string;
  questionText: string;
  correctAnswer: string;
}

interface StudyProgressResponse {
  test: {
    id: string;
    name: string;
  };
  progress: StudyProgress[];
  statistics: {
    totalStudied: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
    averageTime: number;
  };
}

interface SaveStudyProgressRequest {
  testId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

// Mock Test Types
interface MockTestAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

interface SaveMockTestRequest {
  testId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  answers: MockTestAnswer[];
}

interface MockTestResult {
  id: number;
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  passingScore: number;
  passed: boolean;
  percentage: number;
}

interface MockTestHistoryResponse {
  mockTests: MockTestResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface MockTestDetailResponse {
  mockTest: MockTestResult;
  answers: Array<{
    questionId: string;
    questionText: string;
    choices: Record<string, string>;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
}

// Statistics Types
interface UserStatistics {
  overall: {
    study: {
      totalStudied: number;
      correctAnswers: number;
      accuracy: number;
      averageTime: number;
    };
    mockTests: {
      totalTests: number;
      averageScore: number;
      averagePercentage: number;
      averageTimeSpent: number;
    };
  };
  studyByTest: Array<{
    testId: string;
    testName: string;
    totalStudied: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
  }>;
  mockTestsByTest: Array<{
    testId: string;
    testName: string;
    totalTests: number;
    averageScore: number;
    averagePercentage: number;
    averageTimeSpent: number;
    passingScore: number;
  }>;
}

export const progressService = {
  // Study Mode Progress
  /**
   * Save progress for a single question in Study Mode
   */
  async saveStudyProgress(data: SaveStudyProgressRequest): Promise<void> {
    await apiClient.post('/progress/study', data);
  },

  /**
   * Get Study Mode progress for a specific test
   */
  async getStudyProgress(testId: string): Promise<StudyProgressResponse> {
    const response = await apiClient.get<StudyProgressResponse>(`/progress/study/${testId}`);
    return response.data;
  },

  // Mock Test Results
  /**
   * Save Mock Test results
   */
  async saveMockTestResults(data: SaveMockTestRequest): Promise<void> {
    await apiClient.post('/progress/mock-test', data);
  },

  /**
   * Get Mock Test history
   */
  async getMockTestHistory(
    page = 1,
    limit = 10,
    testId?: string
  ): Promise<MockTestHistoryResponse> {
    const params: any = { page, limit };
    if (testId) {
      params.testId = testId;
    }

    const response = await apiClient.get<MockTestHistoryResponse>('/progress/mock-tests', {
      params,
    });
    return response.data;
  },

  /**
   * Get detailed Mock Test result
   */
  async getMockTestDetails(mockTestId: number): Promise<MockTestDetailResponse> {
    const response = await apiClient.get<MockTestDetailResponse>(`/progress/mock-tests/${mockTestId}`);
    return response.data;
  },

  // User Statistics
  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<UserStatistics> {
    const response = await apiClient.get<UserStatistics>('/progress/stats');
    return response.data;
  },

  // Local Storage Helpers for Study Mode
  /**
   * Get local Study Mode progress (for offline support)
   */
  getLocalStudyProgress(testId: string): Record<string, StudyProgress> {
    try {
      const key = `study_progress_${testId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading local study progress:', error);
      return {};
    }
  },

  /**
   * Save local Study Mode progress (for offline support)
   */
  saveLocalStudyProgress(testId: string, questionId: string, progress: StudyProgress): void {
    try {
      const key = `study_progress_${testId}`;
      const existing = this.getLocalStudyProgress(testId);
      existing[questionId] = progress;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving local study progress:', error);
    }
  },

  /**
   * Clear local Study Mode progress
   */
  clearLocalStudyProgress(testId?: string): void {
    if (testId) {
      localStorage.removeItem(`study_progress_${testId}`);
    } else {
      // Clear all study progress
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('study_progress_')) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  // Utility functions
  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(correct: number, total: number): number {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  },

  /**
   * Format time in seconds to readable format
   */
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  },

  /**
   * Get performance level based on accuracy
   */
  getPerformanceLevel(accuracy: number): { level: string; color: string } {
    if (accuracy >= 90) {
      return { level: 'Excellent', color: '#22c55e' };
    } else if (accuracy >= 80) {
      return { level: 'Good', color: '#3b82f6' };
    } else if (accuracy >= 70) {
      return { level: 'Fair', color: '#f59e0b' };
    } else if (accuracy >= 60) {
      return { level: 'Needs Improvement', color: '#ef4444' };
    } else {
      return { level: 'Poor', color: '#dc2626' };
    }
  },
};