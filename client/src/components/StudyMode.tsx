import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { progressService } from '../services/progressService';
import Discussions from './Discussions';
import './StudyMode.css';

interface StudyModeProps {
  questions: Question[];
  testName: string;
  testId: string;
}

interface ShuffledChoice {
  key: string;
  value: string;
}

interface StudyProgress {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  createdAt: string;
  questionText: string;
  correctAnswer: string;
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

const StudyMode: React.FC<StudyModeProps> = ({ questions, testName, testId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [shuffledChoices, setShuffledChoices] = useState<Record<number, ShuffledChoice[]>>({});
  const [pageInput, setPageInput] = useState('');
  const [showDiscussions, setShowDiscussions] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({});
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  
  const questionsPerPage = 10;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  // Load existing progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const studyData = await progressService.getStudyProgress(testId);
        const progressMap: Record<string, StudyProgress> = {};
        const answeredSet = new Set<number>();
        const answersMap: Record<number, string[]> = {};
        
        studyData.progress.forEach((item) => {
          progressMap[item.questionId] = item;
          
          // Find question index and mark as answered
          const questionIndex = questions.findIndex(q => q.question_id === item.questionId);
          if (questionIndex !== -1) {
            answeredSet.add(questionIndex);
            answersMap[questionIndex] = [item.userAnswer];
          }
        });
        
        setProgress(progressMap);
        setAnsweredQuestions(answeredSet);
        setSelectedAnswers(answersMap);
        
      } catch (error: any) {
        console.error('Error loading study progress:', error);
        setError('Failed to load study progress. You can still continue studying.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [testId, questions]);

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

  // Initialize shuffled choices for current page questions
  useEffect(() => {
    const newShuffledChoices: Record<number, ShuffledChoice[]> = {};
    const newStartTimes: Record<number, number> = {};
    
    currentQuestions.forEach((question, index) => {
      const questionIndex = startIndex + index;
      if (!shuffledChoices[questionIndex]) {
        const choicesArray = Object.entries(question.choices).map(([key, value]) => ({
          key,
          value
        }));
        newShuffledChoices[questionIndex] = shuffleArray(choicesArray);
      }
      
      // Set start time for unanswered questions
      if (!answeredQuestions.has(questionIndex) && !questionStartTimes[questionIndex]) {
        newStartTimes[questionIndex] = Date.now();
      }
    });
    
    setShuffledChoices(prev => ({ ...prev, ...newShuffledChoices }));
    setQuestionStartTimes(prev => ({ ...prev, ...newStartTimes }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, questions]);

  const saveProgress = async (questionIndex: number, userAnswer: string, isCorrect: boolean, timeTaken: number) => {
    const question = questions[questionIndex];
    
    const progressData: StudyProgress = {
      questionId: question.question_id,
      userAnswer,
      isCorrect,
      timeTaken,
      createdAt: new Date().toISOString(),
      questionText: question.question_text,
      correctAnswer: question.correct_answer
    };

    // Update local state immediately
    setProgress(prev => ({
      ...prev,
      [question.question_id]: progressData
    }));

    // Save to server
    try {
      setIsSaving(true);
      await progressService.saveStudyProgress({
        testId,
        questionId: question.question_id,
        userAnswer,
        isCorrect,
        timeTaken
      });
    } catch (error: any) {
      console.error('Error saving study progress:', error);
      // Don't show error to user, just log it
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerClick = (questionIndex: number, choice: string) => {
    const question = questions[questionIndex];
    const correctAnswers = question.correct_answer.split('');
    const isMultipleAnswer = correctAnswers.length > 1;

    if (isMultipleAnswer) {
      setSelectedAnswers(prev => {
        const current = prev[questionIndex] || [];
        const updated = current.includes(choice)
          ? current.filter(a => a !== choice)
          : [...current, choice];
        return { ...prev, [questionIndex]: updated };
      });
    } else {
      // Single answer - immediately process and save
      const startTime = questionStartTimes[questionIndex] || Date.now();
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const isCorrect = choice === question.correct_answer;
      
      setSelectedAnswers(prev => ({ ...prev, [questionIndex]: [choice] }));
      setAnsweredQuestions(prev => {
        const newSet = new Set(prev);
        newSet.add(questionIndex);
        return newSet;
      });
      
      // Save progress immediately
      saveProgress(questionIndex, choice, isCorrect, timeTaken);
    }
  };

  const handleSubmitMultiple = (questionIndex: number) => {
    const question = questions[questionIndex];
    const selected = selectedAnswers[questionIndex] || [];
    const correctAnswers = question.correct_answer.split('');
    const startTime = questionStartTimes[questionIndex] || Date.now();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    const isCorrect = selected.length === correctAnswers.length && 
                     selected.every(answer => correctAnswers.includes(answer));
    
    setAnsweredQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(questionIndex);
      return newSet;
    });
    
    // Save progress immediately
    const userAnswer = selected.sort().join('');
    saveProgress(questionIndex, userAnswer, isCorrect, timeTaken);
  };

  const isCorrect = (questionIndex: number) => {
    const question = questions[questionIndex];
    const selected = selectedAnswers[questionIndex] || [];
    const correctAnswers = question.correct_answer.split('');
    
    if (selected.length === 0) return false;
    
    if (correctAnswers.length > 1) {
      return selected.length === correctAnswers.length && 
             selected.every(answer => correctAnswers.includes(answer));
    } else {
      return selected[0] === question.correct_answer;
    }
  };

  const getChoiceClass = (questionIndex: number, choice: string) => {
    const question = questions[questionIndex];
    const isAnswered = answeredQuestions.has(questionIndex);
    const selected = selectedAnswers[questionIndex] || [];
    const correctAnswers = question.correct_answer.split('');
    
    if (!isAnswered) {
      return selected.includes(choice) ? 'choice selected' : 'choice';
    }

    const isSelected = selected.includes(choice);
    const isCorrectChoice = correctAnswers.includes(choice);

    if (isSelected && isCorrectChoice) return 'choice correct';
    if (isSelected && !isCorrectChoice) return 'choice incorrect';
    if (!isSelected && isCorrectChoice) return 'choice correct-highlight';
    return 'choice';
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setPageInput(''); // Clear input when navigating
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
    } else {
      setPageInput(''); // Clear invalid input
    }
  };

  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button key={1} className="page-btn" onClick={() => goToPage(1)}>1</button>
      );
      if (startPage > 2) {
        buttons.push(<span key="start-ellipsis" className="ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="end-ellipsis" className="ellipsis">...</span>);
      }
      buttons.push(
        <button key={totalPages} className="page-btn" onClick={() => goToPage(totalPages)}>
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  const getStudyStats = () => {
    const totalStudied = answeredQuestions.size;
    const correctCount = Array.from(answeredQuestions).filter(index => isCorrect(index)).length;
    const accuracy = totalStudied > 0 ? Math.round((correctCount / totalStudied) * 100) : 0;
    
    return { totalStudied, correctCount, accuracy };
  };

  if (isLoading) {
    return (
      <div className="study-mode">
        <div className="loading">Loading study progress...</div>
      </div>
    );
  }

  const stats = getStudyStats();

  return (
    <div className="study-mode">
      <div className="study-header">
        <h2>🎯 {testName} - Study Mode</h2>
        <div className="study-progress-bar">
          <div className="progress-info">
            <span>{stats.totalStudied} studied • {stats.correctCount} correct • {stats.accuracy}% accuracy</span>
            {isSaving && <span className="saving-indicator">💾 Saving...</span>}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(stats.totalStudied / questions.length) * 100}%` }}
            />
            <span className="progress-text">{stats.totalStudied} / {questions.length}</span>
          </div>
        </div>
        <div className="page-info">
          Page {currentPage} of {totalPages} • Questions {startIndex + 1}-{Math.min(endIndex, questions.length)} of {questions.length}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="questions-list">
        {currentQuestions.map((question, index) => {
          const questionIndex = startIndex + index;
          const correctAnswers = question.correct_answer.split('');
          const isMultipleAnswer = correctAnswers.length > 1;
          const isAnswered = answeredQuestions.has(questionIndex);
          const selected = selectedAnswers[questionIndex] || [];
          
          // Check if question has valid choices
          const hasValidChoices = Object.values(question.choices).some(choice => choice.trim().length > 0);
          const hasImagePlaceholder = question.question_text.includes('//IMG//');

          // Handle questions with no valid text choices but image placeholders
          if (!hasValidChoices && hasImagePlaceholder) {
            return (
              <div key={question.question_id} className="study-question">
                <div className="question-header">
                  <h3>Question {question.question_number}</h3>
                  <span className="result-indicator incorrect">📷 Image-Based</span>
                </div>
                
                <div className="question-text">
                  {renderTextWithImages(question.question_text, question.question_images || [])}
                </div>

                <div className="question-error">
                  <p>This question contains images with answer choices that are not available in the current dataset.</p>
                  <p>The answer choices for this question are likely contained within the images above.</p>
                </div>
              </div>
            );
          }

          // Skip questions with no valid choices and no image placeholders
          if (!hasValidChoices) {
            return null;
          }

          return (
            <div key={question.question_id} className="study-question">
              <div className="question-header">
                <h3>Question {question.question_number}</h3>
                <div className="question-header-actions">
                  {isMultipleAnswer && (
                    <span className="multiple-indicator">Multiple Answers</span>
                  )}
                  {isAnswered && (
                    <>
                      <span className={`result-indicator ${isCorrect(questionIndex) ? 'correct' : 'incorrect'}`}>
                        {isCorrect(questionIndex) ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                      {question.discussion && question.discussion.length > 0 && (
                        <button 
                          className="discussions-btn"
                          onClick={() => setShowDiscussions(questionIndex)}
                        >
                          💬 Discussions {question.discussion_count && `(${question.discussion_count})`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="question-text">
                {renderTextWithImages(question.question_text, question.question_images || [])}
              </div>

              <div className="choices">
                {shuffledChoices[questionIndex]?.map(({ key, value }) => (
                  <div
                    key={key}
                    className={getChoiceClass(questionIndex, key)}
                    onClick={() => !isAnswered && handleAnswerClick(questionIndex, key)}
                  >
                    <span className="choice-label">{key}</span>
                    <span className="choice-text">
                      {renderTextWithImages(value, question.answer_images || [])}
                    </span>
                  </div>
                ))}
              </div>

              {isMultipleAnswer && !isAnswered && selected.length > 0 && (
                <button 
                  className="submit-btn" 
                  onClick={() => handleSubmitMultiple(questionIndex)}
                >
                  Submit Answer
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="pagination">
        <button 
          className="nav-btn prev-btn" 
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        
        <div className="page-buttons">
          {getPaginationButtons()}
          <form onSubmit={handlePageInputSubmit} className="page-input-form">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={handlePageInputChange}
              placeholder={`Go to page (1-${totalPages})`}
              className="page-input"
            />
            <button type="submit" className="page-input-btn">Go</button>
          </form>
        </div>
        
        <button 
          className="nav-btn next-btn" 
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>

      {showDiscussions !== null && (
        <Discussions
          discussions={questions[showDiscussions]?.discussion}
          discussionCount={questions[showDiscussions]?.discussion_count}
          questionText={questions[showDiscussions]?.question_text}
          questionNumber={questions[showDiscussions]?.question_number}
          onClose={() => setShowDiscussions(null)}
        />
      )}
    </div>
  );
};

export default StudyMode;