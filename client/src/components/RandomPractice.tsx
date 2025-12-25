import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import QuizStats from './QuizStats';
import { Question } from '../types';

interface RandomPracticeProps {
  questions: Question[];
  testName: string;
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

const RandomPractice: React.FC<RandomPracticeProps> = ({ questions, testName }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [currentAnswerProcessed, setCurrentAnswerProcessed] = useState(false);

  const initializeQuestions = () => {
    // Randomize the order of questions
    const shuffled = shuffleArray(questions);
    setShuffledQuestions(shuffled);
    setCurrentAnswerProcessed(false);
  };

  useEffect(() => {
    initializeQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // Reset answer processed flag when question changes
  useEffect(() => {
    setCurrentAnswerProcessed(false);
  }, [currentQuestionIndex]);

  const processAnswer = (isCorrect: boolean) => {
    if (currentAnswerProcessed) return; // Prevent double processing
    
    setCurrentAnswerProcessed(true);
    setAnsweredQuestions(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNextQuestion = (isCorrect: boolean) => {
    // Process answer if not already processed
    if (!currentAnswerProcessed) {
      processAnswer(isCorrect);
    }
    
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      const finalCorrect = currentAnswerProcessed ? correctAnswers : (isCorrect ? correctAnswers + 1 : correctAnswers);
      const finalAnswered = currentAnswerProcessed ? answeredQuestions : answeredQuestions + 1;
      alert(`Quiz completed! You got ${finalCorrect} out of ${finalAnswered} questions correct. Accuracy: ${Math.round((finalCorrect / finalAnswered) * 100)}%`);
    }
  };

  // New callback for immediate answer processing
  const handleAnswerSubmitted = (isCorrect: boolean) => {
    processAnswer(isCorrect);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setAnsweredQuestions(0);
    setCurrentAnswerProcessed(false);
    // Re-randomize questions on restart
    initializeQuestions();
  };

  if (shuffledQuestions.length === 0) {
    return (
      <div className="loading">Loading questions...</div>
    );
  }

  return (
    <div className="random-practice">
      <QuizStats
        currentQuestion={answeredQuestions}
        totalQuestions={shuffledQuestions.length}
        correctAnswers={correctAnswers}
        onRestart={handleRestart}
        testName={testName}
      />
      
      {currentQuestionIndex < shuffledQuestions.length && (
        <QuestionCard
          key={`random-${currentQuestionIndex}-${shuffledQuestions[currentQuestionIndex].question_id}`}
          question={shuffledQuestions[currentQuestionIndex]}
          onNext={handleNextQuestion}
          onAnswerSubmitted={handleAnswerSubmitted}
        />
      )}
    </div>
  );
};

export default RandomPractice;

export {};