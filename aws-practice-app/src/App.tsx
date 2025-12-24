import React, { useState, useEffect } from 'react';
import TabNavigation, { TabType } from './components/TabNavigation';
import TestSelector from './components/TestSelector';
import RandomPractice from './components/RandomPractice';
import MockTest from './components/MockTest';
import PracticeMode from './components/PracticeMode';
import { Question, QuizData, TestMetadata, TestsConfig } from './types';
import testsConfig from './tests/tests.json';
import './App.css';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('random');
  const [availableTests, setAvailableTests] = useState<TestMetadata[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect hard refresh and handle localStorage
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if user is in mock test mode
      const currentTab = localStorage.getItem('activeTab');
      const mockTestActive = localStorage.getItem('mockTestActive');
      
      if (currentTab === 'mock' && mockTestActive === 'true') {
        e.preventDefault();
        e.returnValue = 'You are currently taking a mock test. Refreshing will lose your progress. Are you sure you want to continue?';
        return e.returnValue;
      }
    };

    // Detect hard refresh and clean localStorage
    const detectHardRefresh = () => {
      // Check if this is a hard refresh by looking at sessionStorage
      const isHardRefresh = !sessionStorage.getItem('normalNavigation');
      
      if (isHardRefresh) {
        // Clear localStorage on hard refresh
        localStorage.removeItem('selectedTestId');
        localStorage.removeItem('activeTab');
        localStorage.removeItem('mockTestActive');
        
        // Clear any other app-specific data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('mockTest') || key.startsWith('practiceMode') || key.startsWith('randomPractice'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Set flag for normal navigation
      sessionStorage.setItem('normalNavigation', 'true');
    };

    // Check for hard refresh on component mount
    detectHardRefresh();

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const config = testsConfig as TestsConfig;
    setAvailableTests(config.tests);
    
    // Try to restore saved test and tab from localStorage (only if not hard refresh)
    const savedTestId = localStorage.getItem('selectedTestId');
    const savedTab = localStorage.getItem('activeTab') as TabType;
    
    if (savedTestId && config.tests.length > 0) {
      const savedTest = config.tests.find(test => test.id === savedTestId);
      if (savedTest) {
        setSelectedTest(savedTest);
      }
    }
    
    if (savedTab && ['random', 'mock', 'practice'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestData(selectedTest);
    }
  }, [selectedTest]);

  const loadTestData = async (test: TestMetadata) => {
    setIsLoading(true);
    try {
      // Import the test data dynamically
      const testData = await import(`./tests/${test.filename}`);
      const data = testData.default as QuizData;
      
      // Filter out questions with empty choices or missing content
      const validQuestions = data.questions.filter(question => {
        const hasValidChoices = Object.values(question.choices).some(choice => choice.trim().length > 0);
        const hasValidQuestionText = question.question_text && question.question_text.trim().length > 0;
        const hasImagePlaceholder = question.question_text && question.question_text.includes('//IMG//');
        
        // Keep questions that have valid choices OR have image placeholders (choices might be in images)
        return hasValidQuestionText && (hasValidChoices || hasImagePlaceholder);
      });
      
      setQuestions(validQuestions);
    } catch (error) {
      console.error('Error loading test data:', error);
      setQuestions([]);
    }
    setIsLoading(false);
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
    // Clear saved test from localStorage
    localStorage.removeItem('selectedTestId');
    localStorage.removeItem('activeTab');
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
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
            </div>
          </div>
          
          <TestSelector 
            tests={availableTests}
            selectedTest={selectedTest}
            onTestSelect={handleTestSelect}
          />
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'random':
        return <RandomPractice questions={questions} />;
      case 'mock':
        return <MockTest questions={questions} />;
      case 'practice':
        return <PracticeMode questions={questions} />;
      default:
        return <RandomPractice questions={questions} />;
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
            <button 
              className="change-test-btn"
              onClick={handleChangeTest}
            >
              Change Test
            </button>
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
        
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="tab-content">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}

export default App;
