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

  useEffect(() => {
    const config = testsConfig as TestsConfig;
    setAvailableTests(config.tests);
    
    // Auto-select first test if available
    if (config.tests.length > 0) {
      setSelectedTest(config.tests[0]);
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
  };

  const handleTestSelect = (test: TestMetadata) => {
    setSelectedTest(test);
    setActiveTab('random'); // Reset to first tab when changing tests
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
            <h1>AWS Practice Tests</h1>
            <p>Professional certification practice platform</p>
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
              onClick={() => setSelectedTest(null)}
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
