import React from 'react';
import { TestMetadata } from '../types';
import './TestSelector.css';

interface TestSelectorProps {
  tests: TestMetadata[];
  selectedTest: TestMetadata | null;
  onTestSelect: (test: TestMetadata) => void;
}

const TestSelector: React.FC<TestSelectorProps> = ({ tests, selectedTest, onTestSelect }) => {
  return (
    <div className="test-selector">
      <div className="test-selector-header">
        <h2>📚 Select Practice Test</h2>
        <p>Choose from available certification practice tests</p>
      </div>
      
      <div className="tests-grid">
        {tests.map((test) => (
          <div
            key={test.id}
            className={`test-card ${selectedTest?.id === test.id ? 'selected' : ''}`}
            onClick={() => onTestSelect(test)}
          >
            <div className="test-card-header">
              <h3>{test.name}</h3>
              <span className="test-category">{test.category}</span>
            </div>
            
            <p className="test-description">{test.description}</p>
            
            <div className="test-stats">
              <div className="test-stat">
                <span className="stat-label">Questions:</span>
                <span className="stat-value">{test.totalQuestions}</span>
              </div>
              <div className="test-stat">
                <span className="stat-label">Time Limit:</span>
                <span className="stat-value">{test.timeLimit} min</span>
              </div>
              <div className="test-stat">
                <span className="stat-label">Passing Score:</span>
                <span className="stat-value">{test.passingScore}%</span>
              </div>
              <div className="test-stat">
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value">{test.difficulty}</span>
              </div>
            </div>
            
            {selectedTest?.id === test.id && (
              <div className="selected-indicator">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>
      
      {tests.length === 0 && (
        <div className="no-tests">
          <p>No practice tests available. Please add test files to the tests folder.</p>
        </div>
      )}
    </div>
  );
};

export default TestSelector;