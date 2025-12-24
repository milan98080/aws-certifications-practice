import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import QuizStats from './QuizStats';
import { Question } from '../types';

interface RandomPracticeProps {
  questions: Question[];
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

const RandomPractice: React.FC<RandomPracticeProps> = ({ questions }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const initializeQuestions = () => {
    // Randomize the order of questions
    const shuffled = shuffleArray(questions);
    setShuffledQuestions(shuffled);
  };

  useEffect(() => {
    initializeQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const handleNextQuestion = (isCorrect: boolean) => {
    setAnsweredQuestions(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      const finalScore = isCorrect ? correctAnswers + 1 : correctAnswers;
      alert(`Quiz completed! You got ${finalScore} out of ${shuffledQuestions.length} questions correct. Accuracy: ${Math.round((finalScore / shuffledQuestions.length) * 100)}%`);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setAnsweredQuestions(0);
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
      />
      
      {currentQuestionIndex < shuffledQuestions.length && (
        <QuestionCard
          key={`random-${currentQuestionIndex}-${shuffledQuestions[currentQuestionIndex].question_id}`}
          question={shuffledQuestions[currentQuestionIndex]}
          onNext={handleNextQuestion}
        />
      )}
    </div>
  );
};

export default RandomPractice;

export {};