import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import TabNavigation, { TabType } from './components/TabNavigation';
import TestSelector from './components/TestSelector';
import RandomPractice from './components/RandomPractice';
import MockTest from './components/MockTest';
import PracticeMode from './components/PracticeMode';
import StudyMode from './components/StudyMode';
import TestHistory from './components/TestHistory';
import { Question, TestMetadata } from './types';
import { testService } from './services/testService';
import './App.css';

// Main app content (protected)
const AppContent: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('random');
  const [availableTests, setAvailableTests] = useState<TestMetadata[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const { user, logout } = useAuth();

  // Load available tests on component mount
  useEffect(() => {
    const loadTests = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get all tests (with high limit to get all at once)
        const response = await testService.getTests(1, 100);
        setAvailableTests(response.tests);
        
        // Try to restore saved test and tab from localStorage
        const savedTestId = localStorage.getItem('selectedTestId');
        const savedTab = localStorage.getItem('activeTab') as TabType;
        
        if (savedTestId && response.tests.length > 0) {
          const savedTest = response.tests.find(test => test.id === savedTestId);
          if (savedTest) {
            setSelectedTest(savedTest);
          }
        }
        
        if (savedTab && ['random', 'mock', 'practice', 'study', 'history'].includes(savedTab)) {
          setActiveTab(savedTab);
        }
        
      } catch (error: any) {
        console.error('Error loading tests:', error);
        setError('Failed to load tests. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTests();
  }, []);

  // Load questions when test is selected
  useEffect(() => {
    if (selectedTest) {
      loadTestQuestions(selectedTest);
    }
  }, [selectedTest]);

  const loadTestQuestions = async (test: TestMetadata) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Try to get cached questions first
      const cachedQuestions = testService.getCachedQuestions(test.id);
      if (cachedQuestions && cachedQuestions.length > 0) {
        const validQuestions = testService.filterValidQuestions(cachedQuestions);
        setQuestions(validQuestions);
        setIsLoading(false);
        return;
      }
      
      // Load all questions for the test
      const response = await testService.getAllQuestions(test.id);
      const validQuestions = testService.filterValidQuestions(response.questions);
      
      setQuestions(validQuestions);
      
      // Cache questions for offline support
      testService.cacheQuestions(test.id, validQuestions);
      
    } catch (error: any) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions. Please try again.');
      
      // Try to use cached questions as fallback
      const cachedQuestions = testService.getCachedQuestions(test.id);
      if (cachedQuestions && cachedQuestions.length > 0) {
        const validQuestions = testService.filterValidQuestions(cachedQuestions);
        setQuestions(validQuestions);
        setError('Using cached questions (offline mode)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Save tab to localStorage
    localStorage.setItem('activeTab', tab);
  };

  const handleTestSelect = (test: TestMetadata) => {
    setSelectedTest(test);
    setActiveTab('random'); // Reset to first tab when changing tests
    // Save test selection to localStorage
    localStorage.setItem('selectedTestId', test.id);
    localStorage.setItem('activeTab', 'random');
  };

  const handleChangeTest = () => {
    setSelectedTest(null);
    setQuestions([]);
    // Clear saved test from localStorage
    localStorage.removeItem('selectedTestId');
    localStorage.removeItem('activeTab');
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading && !selectedTest) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error && !selectedTest && availableTests.length === 0) {
    return (
      <div className="App">
        <div className="error-container">
          <div className="error-message">
            <h2>Error Loading Application</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTest) {
    return (
      <div className="App">
        <div className="container">
          <div className="app-header">
            <div className="header-content">
              <div className="header-text">
                <h1>AWS Practice Tests</h1>
                <p>Professional certification practice platform</p>
              </div>
              <div className="user-info">
                <span>Welcome, {user?.firstName || user?.email}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
          
          <TestSelector 
            tests={availableTests}
            selectedTest={selectedTest}
            onTestSelect={handleTestSelect}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    if (isLoading) {
      return <div className="loading">Loading questions...</div>;
    }

    if (error && questions.length === 0) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => loadTestQuestions(selectedTest)}>
            Retry Loading Questions
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'random':
        return <RandomPractice questions={questions} testName={selectedTest.name} />;
      case 'mock':
        return <MockTest questions={questions} testName={selectedTest.name} testId={selectedTest.id} />;
      case 'practice':
        return <PracticeMode questions={questions} testName={selectedTest.name} />;
      case 'study':
        return <StudyMode questions={questions} testName={selectedTest.name} testId={selectedTest.id} />;
      case 'history':
        return <TestHistory testName={selectedTest.name} testId={selectedTest.id} />;
      default:
        return <RandomPractice questions={questions} testName={selectedTest.name} />;
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="app-header">
          <div className="header-content">
            <div className="header-text">
              <h1>{selectedTest.name}</h1>
              <p>{selectedTest.description}</p>
            </div>
            <div className="header-actions">
              <div className="user-info">
                <span>Welcome, {user?.firstName || user?.email}</span>
              </div>
              <button 
                className="change-test-btn"
                onClick={handleChangeTest}
              >
                Change Test
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
          
          <div className="test-info-bar">
            <span className="test-info-item">
              📊 {questions.length} Questions Available
            </span>
            <span className="test-info-item">
              ⏱️ {selectedTest.timeLimit} min Time Limit
            </span>
            <span className="test-info-item">
              🎯 {selectedTest.passingScore}% Passing Score
            </span>
          </div>
        </div>
        
        {error && questions.length > 0 && (
          <div className="warning-banner">
            {error}
          </div>
        )}
        
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="tab-content">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

// Main App component with routing
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute fallback={<Navigate to="/auth" replace />}>
                  <AppContent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
