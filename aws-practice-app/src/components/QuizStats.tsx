import React from 'react';
import './QuizStats.css';

interface QuizStatsProps {
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
  onRestart: () => void;
}

const QuizStats: React.FC<QuizStatsProps> = ({ 
  currentQuestion, 
  totalQuestions, 
  correctAnswers,
  onRestart 
}) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const accuracy = currentQuestion > 0 ? (correctAnswers / currentQuestion) * 100 : 0;

  return (
    <div className="quiz-stats">
      <div className="stats-header">
        <h1>AWS Solutions Architect Practice</h1>
        <button className="restart-btn" onClick={onRestart}>
          Restart Quiz
        </button>
      </div>
      
      <div className="progress-section">
        <div className="progress-info">
          <span>Question {currentQuestion + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="accuracy-section">
        <div className="stat-item">
          <span className="stat-label">Correct:</span>
          <span className="stat-value">{correctAnswers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Accuracy:</span>
          <span className="stat-value">{Math.round(accuracy)}%</span>
        </div>
      </div>
    </div>
  );
};

export default QuizStats;