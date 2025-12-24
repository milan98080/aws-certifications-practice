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
      <div className="stats-container">
        <h1>AWS Solutions Architect Practice</h1>
        
        <div className="progress-bar-inline">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="stats-right">
          <div className="inline-stats">
            <span className="stat-compact">
              Q {currentQuestion + 1}/{totalQuestions}
            </span>
            <span className="stat-compact">
              <strong>{correctAnswers}</strong> correct
            </span>
            <span className="stat-compact">
              <strong>{Math.round(accuracy)}%</strong>
            </span>
          </div>
          
          <button className="restart-btn" onClick={onRestart}>
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizStats;