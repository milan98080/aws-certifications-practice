-- AWS Practice Test Application Database Schema

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tests table for practice test metadata
CREATE TABLE tests (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    total_questions INTEGER,
    time_limit INTEGER,
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table for individual test questions
CREATE TABLE questions (
    id VARCHAR(50) PRIMARY KEY,
    test_id VARCHAR(50) REFERENCES tests(id) ON DELETE CASCADE,
    question_number INTEGER,
    question_text TEXT NOT NULL,
    choices JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    is_multiple_choice BOOLEAN DEFAULT FALSE,
    question_images TEXT[],
    answer_images TEXT[],
    discussion JSONB,
    discussion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress table for Study Mode individual question tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id VARCHAR(50) REFERENCES tests(id) ON DELETE CASCADE,
    question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(10),
    is_correct BOOLEAN,
    time_taken INTEGER, -- in seconds
    session_type VARCHAR(20) CHECK (session_type IN ('study')) DEFAULT 'study',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id, session_type)
);

-- Mock test results table for complete test sessions
CREATE TABLE mock_test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id VARCHAR(50) REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_spent INTEGER NOT NULL, -- in seconds
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mock test answers table for individual answers in mock tests
CREATE TABLE mock_test_answers (
    id SERIAL PRIMARY KEY,
    mock_test_result_id INTEGER REFERENCES mock_test_results(id) ON DELETE CASCADE,
    question_id VARCHAR(50) REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(10),
    is_correct BOOLEAN,
    time_taken INTEGER -- in seconds
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_test_id ON user_progress(test_id);
CREATE INDEX idx_user_progress_user_test ON user_progress(user_id, test_id);
CREATE INDEX idx_mock_test_results_user_id ON mock_test_results(user_id);
CREATE INDEX idx_mock_test_results_test_id ON mock_test_results(test_id);
CREATE INDEX idx_mock_test_answers_result_id ON mock_test_answers(mock_test_result_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();