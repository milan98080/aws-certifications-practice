import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import Discussions from './Discussions';
import './MockTest.css';

interface MockTestProps {
  questions: Question[];
  testName: string;
}

interface ShuffledChoice {
  key: string;
  value: string;
}

interface TestAnswer {
  questionIndex: number;
  selectedAnswers: string[];
  isCorrect: boolean;
  question: Question;
  shuffledChoices: ShuffledChoice[];
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const MockTest: React.FC<MockTestProps> = ({ questions, testName }) => {
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); // Will be calculated based on question count
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionCount, setQuestionCount] = useState(65);
  const [questionCountInput, setQuestionCountInput] = useState('65');
  const [shuffledChoicesMap, setShuffledChoicesMap] = useState<Record<number, ShuffledChoice[]>>({});
  const [showDiscussions, setShowDiscussions] = useState<number | null>(null);

  // Format time limit for display
  const formatTimeLimit = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minutes`;
    } else {
      return `${minutes} minutes ${remainingSeconds} seconds`;
    }
  };

  // Calculate time based on question count (2 hours for 65 questions)
  const calculateTimeLimit = (numQuestions: number) => {
    const baseTimeMinutes = 120; // 2 hours for 65 questions
    const timePerQuestion = baseTimeMinutes / 65;
    const totalMinutes = timePerQuestion * numQuestions;
    
    // Convert to seconds and round up to nearest 15 seconds
    const totalSeconds = Math.ceil(totalMinutes * 60);
    const roundedSeconds = Math.ceil(totalSeconds / 15) * 15;
    
    return roundedSeconds;
  };

  // Handle page refresh warning during active test
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTestStarted && !isTestCompleted) {
        e.preventDefault();
        e.returnValue = 'You are currently taking a mock test. Leaving this page will lose all your progress. Are you sure?';
        return e.returnValue;
      }
    };

    if (isTestStarted && !isTestCompleted) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTestStarted, isTestCompleted]);

  // Clear any mock test data from localStorage on component mount
  useEffect(() => {
    // Clean up any previous mock test data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mockTest')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Function to render text with images or placeholders
  const renderTextWithImages = (text: string, images: string[] = []) => {
    const parts = text.split('//IMG//');
    const result: React.ReactNode[] = [];
    
    parts.forEach((part, index) => {
      if (part) {
        result.push(
          <span key={`text-${index}`}>
            {part.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < part.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
      
      // Add image or placeholder after each text part (except the last one)
      if (index < parts.length - 1) {
        if (images[index]) {
          result.push(
            <div key={`img-${index}`} className="question-image-container">
              <img 
                src={images[index]} 
                alt={`Image ${index + 1}`}
                className="question-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          );
        } else {
          result.push(
            <div key={`placeholder-${index}`} className="missing-image">
              <p>📷 Image placeholder - Image not available in dataset</p>
            </div>
          );
        }
      }
    });
    
    return result;
  };

  const initializeTest = () => {
    // Select random questions based on questionCount
    const shuffled = shuffleArray(questions);
    const selectedQuestions = shuffled.slice(0, questionCount);
    setTestQuestions(selectedQuestions);
    
    // Initialize shuffled choices for all questions
    const choicesMap: Record<number, ShuffledChoice[]> = {};
    selectedQuestions.forEach((question, index) => {
      const hasValidChoices = Object.values(question.choices).some(choice => choice.trim().length > 0);
      
      if (hasValidChoices) {
        const choicesArray = Object.entries(question.choices)
          .filter(([key, value]) => value.trim().length > 0)
          .map(([key, value]) => ({
            key,
            value
          }));
        choicesMap[index] = shuffleArray(choicesArray);
      } else {
        // For questions without valid choices, create empty array
        choicesMap[index] = [];
      }
    });
    setShuffledChoicesMap(choicesMap);
    
    setCurrentQuestionIndex(0);
    setTestAnswers([]);
    const calculatedTime = calculateTimeLimit(questionCount);
    setTimeLeft(calculatedTime);
    setIsTestStarted(false);
    setIsTestCompleted(false);
    setShowResults(false);
    // Clear mock test active flag when initializing new test
    localStorage.removeItem('mockTestActive');
  };

  useEffect(() => {
    initializeTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, questionCount]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTestStarted && timeLeft > 0 && !isTestCompleted) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTestStarted && !isTestCompleted) {
      completeTest();
    }

    return () => clearTimeout(timer);
  }, [isTestStarted, timeLeft, isTestCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setIsTestStarted(true);
    // Save that mock test is active
    localStorage.setItem('mockTestActive', 'true');
  };

  const handleAnswer = (selectedAnswers: string[]) => {
    const currentQuestion = testQuestions[currentQuestionIndex];
    const correctAnswers = currentQuestion.correct_answer.split('');
    
    const isCorrect = selectedAnswers.length === correctAnswers.length && 
                     selectedAnswers.every(answer => correctAnswers.includes(answer));

    const testAnswer: TestAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswers,
      isCorrect,
      question: currentQuestion,
      shuffledChoices: shuffledChoicesMap[currentQuestionIndex]
    };

    setTestAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = testAnswer;
      return updated;
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < testQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    // Remove the else clause - no auto-complete on last question
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeTest = () => {
    setIsTestCompleted(true);
    setIsTestStarted(false);
    // Clear mock test active flag
    localStorage.removeItem('mockTestActive');
  };

  const calculateScore = () => {
    const correctAnswers = testAnswers.filter(answer => answer && answer.isCorrect).length;
    return {
      correct: correctAnswers,
      total: testQuestions.length,
      percentage: Math.round((correctAnswers / testQuestions.length) * 100)
    };
  };

  const showDetailedResults = () => {
    setShowResults(true);
  };

  const backToSummary = () => {
    setShowResults(false);
  };

  if (!isTestStarted && !isTestCompleted) {
    return (
      <div className="mock-test-start">
        <div className="test-info">
          <h2>🎯 {testName} - Mock Test</h2>
          <div className="test-details">
            <div className="detail-item">
              <span className="detail-label">Questions:</span>
              <input
                type="number"
                min="1"
                max="65"
                value={questionCountInput}
                onChange={(e) => setQuestionCountInput(e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === '' || isNaN(parseInt(value))) {
                    setQuestionCount(1);
                    setQuestionCountInput('1');
                  } else {
                    const num = Math.min(Math.max(1, parseInt(value)), 65);
                    setQuestionCount(num);
                    setQuestionCountInput(num.toString());
                  }
                }}
                className="question-count-input"
              />
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Limit:</span>
              <span className="detail-value">{formatTimeLimit(calculateTimeLimit(questionCount))}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Question Order:</span>
              <span className="detail-value">Randomized</span>
            </div>
          </div>
          <div className="test-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>You have {formatTimeLimit(calculateTimeLimit(questionCount))} to complete {questionCount} questions</li>
              <li>Questions are presented in random order</li>
              <li>You can navigate between questions using Previous/Next buttons</li>
              <li>No feedback will be shown during the test</li>
              <li>Timer will start when you click "Start Test"</li>
              <li>Test will auto-submit when time expires</li>
              <li>You must reach the last question to submit the test</li>
              <li>Detailed results will be shown after completion</li>
            </ul>
          </div>
          <button className="start-test-btn" onClick={startTest}>
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (isTestCompleted && !showResults) {
    const score = calculateScore();
    return (
      <div className="mock-test-results">
        <div className="results-card">
          <h2>🎉 Test Completed!</h2>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-percentage">{score.percentage}%</span>
              <span className="score-fraction">{score.correct}/{score.total}</span>
            </div>
          </div>
          <div className="score-details">
            <div className="score-item correct">
              <span className="score-label">Correct:</span>
              <span className="score-value">{score.correct}</span>
            </div>
            <div className="score-item incorrect">
              <span className="score-label">Incorrect:</span>
              <span className="score-value">{score.total - score.correct}</span>
            </div>
            <div className="score-item total">
              <span className="score-label">Total:</span>
              <span className="score-value">{score.total}</span>
            </div>
          </div>
          <div className="results-actions">
            <button className="review-btn" onClick={showDetailedResults}>
              Review Answers
            </button>
            <button className="restart-test-btn" onClick={initializeTest}>
              Take Another Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="detailed-results">
        <div className="results-header">
          <h2>📋 Detailed Results</h2>
          <button className="back-btn" onClick={backToSummary}>
            ← Back to Summary
          </button>
        </div>
        
        <div className="results-list">
          {testQuestions.map((question, index) => {
            const answer = testAnswers[index];
            const correctAnswers = question.correct_answer.split('');
            
            const getChoiceClass = (choice: string) => {
              if (!answer) {
                // For skipped questions, only highlight correct answers
                const isCorrectChoice = correctAnswers.includes(choice);
                return isCorrectChoice ? 'choice correct-highlight' : 'choice';
              }
              
              const isSelected = answer.selectedAnswers.includes(choice);
              const isCorrectChoice = correctAnswers.includes(choice);

              if (isSelected && isCorrectChoice) return 'choice correct';
              if (isSelected && !isCorrectChoice) return 'choice incorrect';
              if (!isSelected && isCorrectChoice) return 'choice correct-highlight';
              return 'choice';
            };

            return (
              <div key={index} className="result-question">
                <div className="result-header">
                  <h3>Question {index + 1}</h3>
                  <div className="result-actions">
                    <span className={`result-indicator ${answer ? (answer.isCorrect ? 'correct' : 'incorrect') : 'skipped'}`}>
                      {answer ? (answer.isCorrect ? '✓ Correct' : '✗ Incorrect') : '⊘ Skipped'}
                    </span>
                    {question.discussion && question.discussion.length > 0 && (
                      <button 
                        className="discussions-btn"
                        onClick={() => setShowDiscussions(index)}
                      >
                        💬 Discussions {question.discussion_count && `(${question.discussion_count})`}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="question-text">
                  {renderTextWithImages(question.question_text, question.question_images || [])}
                </div>

                <div className="choices">
                  {shuffledChoicesMap[index]?.map(({ key, value }) => (
                    <div key={key} className={getChoiceClass(key)}>
                      <span className="choice-label">{key}</span>
                      <span className="choice-text">
                        {renderTextWithImages(value, question.answer_images || [])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showDiscussions !== null && (
          <Discussions
            discussions={testQuestions[showDiscussions]?.discussion}
            discussionCount={testQuestions[showDiscussions]?.discussion_count}
            questionText={testQuestions[showDiscussions]?.question_text}
            questionNumber={testQuestions[showDiscussions]?.question_number}
            onClose={() => setShowDiscussions(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mock-test-active">
      <div className="test-header">
        <div className="test-progress">
          <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <MockQuestionCard
        key={`mock-${currentQuestionIndex}-${testQuestions[currentQuestionIndex]?.question_id}`}
        question={testQuestions[currentQuestionIndex]}
        shuffledChoices={shuffledChoicesMap[currentQuestionIndex] || []}
        selectedAnswers={testAnswers[currentQuestionIndex]?.selectedAnswers || []}
        onAnswerChange={handleAnswer}
      />

      <div className="test-navigation">
        <button 
          className="nav-btn prev-btn" 
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </button>
        
        {currentQuestionIndex === testQuestions.length - 1 && (
          <button className="complete-btn" onClick={completeTest}>
            Submit Test
          </button>
        )}
        
        <button 
          className="nav-btn next-btn" 
          onClick={nextQuestion}
          disabled={currentQuestionIndex === testQuestions.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// Separate component for mock test questions (no feedback during test)
interface MockQuestionCardProps {
  question: Question;
  shuffledChoices: ShuffledChoice[];
  selectedAnswers: string[];
  onAnswerChange: (selectedAnswers: string[]) => void;
}

const MockQuestionCard: React.FC<MockQuestionCardProps> = ({ 
  question, 
  shuffledChoices, 
  selectedAnswers, 
  onAnswerChange 
}) => {
  const correctAnswers = question.correct_answer.split('');
  const isMultipleAnswer = correctAnswers.length > 1;

  // Function to render text with images or placeholders
  const renderTextWithImages = (text: string, images: string[] = []) => {
    const parts = text.split('//IMG//');
    const result: React.ReactNode[] = [];
    
    parts.forEach((part, index) => {
      if (part) {
        result.push(
          <span key={`text-${index}`}>
            {part.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < part.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
      
      // Add image or placeholder after each text part (except the last one)
      if (index < parts.length - 1) {
        if (images[index]) {
          result.push(
            <div key={`img-${index}`} className="question-image-container">
              <img 
                src={images[index]} 
                alt={`Image ${index + 1}`}
                className="question-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          );
        } else {
          result.push(
            <div key={`placeholder-${index}`} className="missing-image">
              <p>📷 Image placeholder - Image not available in dataset</p>
            </div>
          );
        }
      }
    });
    
    return result;
  };

  const handleAnswerClick = (choice: string) => {
    if (isMultipleAnswer) {
      const updated = selectedAnswers.includes(choice)
        ? selectedAnswers.filter(a => a !== choice)
        : [...selectedAnswers, choice];
      onAnswerChange(updated);
    } else {
      onAnswerChange([choice]);
    }
  };

  // Check if question has valid choices
  const hasValidChoices = shuffledChoices.length > 0;
  const hasImagePlaceholder = question.question_text.includes('//IMG//');

  return (
    <div className="question-card">
      <div className="question-header">
        <h2>Question {question.question_number}</h2>
        {isMultipleAnswer && (
          <span className="multiple-indicator">Multiple Answers</span>
        )}
        {!hasValidChoices && hasImagePlaceholder && (
          <span className="multiple-indicator">📷 Image-Based</span>
        )}
      </div>
      
      <div className="question-text">
        {renderTextWithImages(question.question_text, question.question_images || [])}
      </div>

      {hasValidChoices ? (
        <div className="choices">
          {shuffledChoices.map(({ key, value }) => (
            <div
              key={key}
              className={`choice ${selectedAnswers.includes(key) ? 'selected' : ''}`}
              onClick={() => handleAnswerClick(key)}
            >
              <span className="choice-label">{key}</span>
              <span className="choice-text">
                {renderTextWithImages(value, question.answer_images || [])}
              </span>
            </div>
          ))}
        </div>
      ) : hasImagePlaceholder ? (
        <div className="question-error">
          <p>📷 This question contains images with answer choices that are not available in the current dataset.</p>
          <p>The answer choices for this question are likely contained within the images above.</p>
          <p><em>Note: This question will be automatically marked as incorrect in the test results.</em></p>
        </div>
      ) : (
        <div className="question-error">
          <p>⚠️ This question appears to be missing answer choices.</p>
        </div>
      )}

      {/* No submit button in mock test - users navigate with Previous/Next buttons */}
    </div>
  );
};

export default MockTest;

export {};