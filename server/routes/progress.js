const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');

const router = express.Router();

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
};

// Validation for test and question IDs
const idValidation = [
  param('testId')
    .optional()
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid test ID format'),
  param('questionId')
    .optional()
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid question ID format')
];

// Validation for Study Mode progress
const studyProgressValidation = [
  body('testId')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid test ID format'),
  body('questionId')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid question ID format'),
  body('userAnswer')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('User answer must be between 1 and 10 characters'),
  body('isCorrect')
    .isBoolean()
    .withMessage('isCorrect must be a boolean'),
  body('timeTaken')
    .isInt({ min: 0 })
    .withMessage('Time taken must be a non-negative integer')
];

// Validation for Mock Test results
const mockTestValidation = [
  body('testId')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid test ID format'),
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  body('totalQuestions')
    .isInt({ min: 1 })
    .withMessage('Total questions must be a positive integer'),
  body('timeSpent')
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  body('answers.*.questionId')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid question ID format in answers'),
  body('answers.*.userAnswer')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('User answer must be between 1 and 10 characters'),
  body('answers.*.isCorrect')
    .isBoolean()
    .withMessage('isCorrect must be a boolean'),
  body('answers.*.timeTaken')
    .isInt({ min: 0 })
    .withMessage('Time taken must be a non-negative integer')
];

// Save Study Mode progress for a single question
router.post('/study', studyProgressValidation, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { testId, questionId, userAnswer, isCorrect, timeTaken } = req.body;
    const userId = req.user.id;

    // Sanitize inputs
    const sanitizedTestId = sanitizeInput(testId);
    const sanitizedQuestionId = sanitizeInput(questionId);
    const sanitizedUserAnswer = sanitizeInput(userAnswer);

    const db = req.app.locals.db;

    // Verify test and question exist
    const questionCheck = await db.query(
      'SELECT id FROM questions WHERE id = $1 AND test_id = $2',
      [sanitizedQuestionId, sanitizedTestId]
    );

    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Question not found in the specified test'
      });
    }

    // Insert or update progress
    const result = await db.query(
      `INSERT INTO user_progress (user_id, test_id, question_id, user_answer, is_correct, time_taken, session_type)
       VALUES ($1, $2, $3, $4, $5, $6, 'study')
       ON CONFLICT (user_id, question_id, session_type)
       DO UPDATE SET
         user_answer = EXCLUDED.user_answer,
         is_correct = EXCLUDED.is_correct,
         time_taken = EXCLUDED.time_taken,
         created_at = CURRENT_TIMESTAMP
       RETURNING id, created_at`,
      [userId, sanitizedTestId, sanitizedQuestionId, sanitizedUserAnswer, isCorrect, timeTaken]
    );

    res.json({
      message: 'Study progress saved successfully',
      progress: {
        id: result.rows[0].id,
        userId,
        testId: sanitizedTestId,
        questionId: sanitizedQuestionId,
        userAnswer: sanitizedUserAnswer,
        isCorrect,
        timeTaken,
        sessionType: 'study',
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Save study progress error:', error);
    res.status(500).json({
      error: 'Internal server error while saving study progress'
    });
  }
});

// Get Study Mode progress for a specific test
router.get('/study/:testId', idValidation, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const testId = sanitizeInput(req.params.testId);
    const userId = req.user.id;

    const db = req.app.locals.db;

    // Verify test exists
    const testCheck = await db.query(
      'SELECT id, name FROM tests WHERE id = $1',
      [testId]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Test not found'
      });
    }

    // Get user's study progress for this test
    const result = await db.query(
      `SELECT up.question_id, up.user_answer, up.is_correct, up.time_taken, up.created_at,
              q.question_text, q.correct_answer
       FROM user_progress up
       JOIN questions q ON up.question_id = q.id
       WHERE up.user_id = $1 AND up.test_id = $2 AND up.session_type = 'study'
       ORDER BY up.created_at DESC`,
      [userId, testId]
    );

    const progress = result.rows.map(row => ({
      questionId: row.question_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      timeTaken: row.time_taken,
      createdAt: row.created_at,
      questionText: row.question_text,
      correctAnswer: row.correct_answer
    }));

    // Calculate statistics
    const totalStudied = progress.length;
    const correctAnswers = progress.filter(p => p.isCorrect).length;
    const accuracy = totalStudied > 0 ? (correctAnswers / totalStudied) * 100 : 0;
    const totalTime = progress.reduce((sum, p) => sum + p.timeTaken, 0);
    const averageTime = totalStudied > 0 ? totalTime / totalStudied : 0;

    res.json({
      test: {
        id: testCheck.rows[0].id,
        name: testCheck.rows[0].name
      },
      progress,
      statistics: {
        totalStudied,
        correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100,
        totalTime,
        averageTime: Math.round(averageTime * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get study progress error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching study progress'
    });
  }
});

// Save Mock Test results
router.post('/mock-test', mockTestValidation, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { testId, score, totalQuestions, timeSpent, answers } = req.body;
    const userId = req.user.id;

    // Sanitize inputs
    const sanitizedTestId = sanitizeInput(testId);

    const db = req.app.locals.db;

    // Verify test exists
    const testCheck = await db.query(
      'SELECT id FROM tests WHERE id = $1',
      [sanitizedTestId]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Test not found'
      });
    }

    // Begin transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // Insert mock test result
      const mockTestResult = await client.query(
        `INSERT INTO mock_test_results (user_id, test_id, score, total_questions, time_spent)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, completed_at`,
        [userId, sanitizedTestId, score, totalQuestions, timeSpent]
      );

      const mockTestId = mockTestResult.rows[0].id;

      // Insert individual answers
      for (const answer of answers) {
        const sanitizedQuestionId = sanitizeInput(answer.questionId);
        const sanitizedUserAnswer = sanitizeInput(answer.userAnswer);

        await client.query(
          `INSERT INTO mock_test_answers (mock_test_result_id, question_id, user_answer, is_correct, time_taken)
           VALUES ($1, $2, $3, $4, $5)`,
          [mockTestId, sanitizedQuestionId, sanitizedUserAnswer, answer.isCorrect, answer.timeTaken]
        );
      }

      await client.query('COMMIT');

      res.json({
        message: 'Mock test results saved successfully',
        mockTest: {
          id: mockTestId,
          userId,
          testId: sanitizedTestId,
          score,
          totalQuestions,
          timeSpent,
          completedAt: mockTestResult.rows[0].completed_at,
          answersCount: answers.length
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Save mock test results error:', error);
    res.status(500).json({
      error: 'Internal server error while saving mock test results'
    });
  }
});

// Get Mock Test history
router.get('/mock-tests', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('testId')
    .optional()
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid test ID format')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const testIdFilter = req.query.testId ? sanitizeInput(req.query.testId) : null;

    const db = req.app.locals.db;

    // Build query with optional test filter
    let whereClause = 'WHERE mtr.user_id = $1';
    let queryParams = [userId];

    if (testIdFilter) {
      whereClause += ' AND mtr.test_id = $2';
      queryParams.push(testIdFilter);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM mock_test_results mtr 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalResults = parseInt(countResult.rows[0].count);

    // Get mock test results with pagination
    const query = `
      SELECT mtr.id, mtr.test_id, mtr.score, mtr.total_questions, mtr.time_spent, mtr.completed_at,
             t.name as test_name, t.passing_score
      FROM mock_test_results mtr
      JOIN tests t ON mtr.test_id = t.id
      ${whereClause}
      ORDER BY mtr.completed_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const result = await db.query(query, [...queryParams, limit, offset]);

    const mockTests = result.rows.map(row => ({
      id: row.id,
      testId: row.test_id,
      testName: row.test_name,
      score: row.score,
      totalQuestions: row.total_questions,
      timeSpent: row.time_spent,
      completedAt: row.completed_at,
      passingScore: row.passing_score,
      passed: row.score >= row.passing_score,
      percentage: Math.round((row.score / row.total_questions) * 100)
    }));

    res.json({
      mockTests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasNextPage: page < Math.ceil(totalResults / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get mock test history error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching mock test history'
    });
  }
});

// Get detailed Mock Test result
router.get('/mock-tests/:mockTestId', [
  param('mockTestId')
    .isInt({ min: 1 })
    .withMessage('Invalid mock test ID')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const mockTestId = parseInt(req.params.mockTestId);
    const userId = req.user.id;

    const db = req.app.locals.db;

    // Get mock test result
    const mockTestResult = await db.query(
      `SELECT mtr.id, mtr.test_id, mtr.score, mtr.total_questions, mtr.time_spent, mtr.completed_at,
              t.name as test_name, t.passing_score
       FROM mock_test_results mtr
       JOIN tests t ON mtr.test_id = t.id
       WHERE mtr.id = $1 AND mtr.user_id = $2`,
      [mockTestId, userId]
    );

    if (mockTestResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Mock test result not found'
      });
    }

    const mockTest = mockTestResult.rows[0];

    // Get individual answers
    const answersResult = await db.query(
      `SELECT mta.question_id, mta.user_answer, mta.is_correct, mta.time_taken,
              q.question_text, q.correct_answer, q.choices, q.discussion, q.discussion_count,
              q.question_images, q.answer_images
       FROM mock_test_answers mta
       JOIN questions q ON mta.question_id = q.id
       WHERE mta.mock_test_result_id = $1
       ORDER BY q.question_number`,
      [mockTestId]
    );

    const answers = answersResult.rows.map(row => ({
      questionId: row.question_id,
      questionText: row.question_text,
      choices: row.choices,
      userAnswer: row.user_answer,
      correctAnswer: row.correct_answer,
      isCorrect: row.is_correct,
      timeTaken: row.time_taken,
      discussion: row.discussion,
      discussionCount: row.discussion_count,
      questionImages: row.question_images,
      answerImages: row.answer_images
    }));

    res.json({
      mockTest: {
        id: mockTest.id,
        testId: mockTest.test_id,
        testName: mockTest.test_name,
        score: mockTest.score,
        totalQuestions: mockTest.total_questions,
        timeSpent: mockTest.time_spent,
        completedAt: mockTest.completed_at,
        passingScore: mockTest.passing_score,
        passed: mockTest.score >= mockTest.passing_score,
        percentage: Math.round((mockTest.score / mockTest.total_questions) * 100)
      },
      answers
    });

  } catch (error) {
    console.error('Get mock test details error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching mock test details'
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Get Study Mode statistics
    const studyStats = await db.query(
      `SELECT 
         COUNT(*) as total_studied,
         COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
         AVG(time_taken) as avg_time,
         test_id,
         t.name as test_name
       FROM user_progress up
       JOIN tests t ON up.test_id = t.id
       WHERE up.user_id = $1 AND up.session_type = 'study'
       GROUP BY test_id, t.name`,
      [userId]
    );

    // Get Mock Test statistics
    const mockTestStats = await db.query(
      `SELECT 
         COUNT(*) as total_tests,
         AVG(score) as avg_score,
         AVG(total_questions) as avg_total_questions,
         AVG(time_spent) as avg_time_spent,
         test_id,
         t.name as test_name,
         t.passing_score
       FROM mock_test_results mtr
       JOIN tests t ON mtr.test_id = t.id
       WHERE mtr.user_id = $1
       GROUP BY test_id, t.name, t.passing_score`,
      [userId]
    );

    // Overall statistics
    const overallStudy = await db.query(
      `SELECT 
         COUNT(*) as total_studied,
         COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
         AVG(time_taken) as avg_time
       FROM user_progress
       WHERE user_id = $1 AND session_type = 'study'`,
      [userId]
    );

    const overallMockTests = await db.query(
      `SELECT 
         COUNT(*) as total_tests,
         AVG(score) as avg_score,
         AVG(total_questions) as avg_total_questions,
         AVG(time_spent) as avg_time_spent
       FROM mock_test_results
       WHERE user_id = $1`,
      [userId]
    );

    const studyByTest = studyStats.rows.map(row => ({
      testId: row.test_id,
      testName: row.test_name,
      totalStudied: parseInt(row.total_studied),
      correctAnswers: parseInt(row.correct_answers),
      accuracy: row.total_studied > 0 ? Math.round((row.correct_answers / row.total_studied) * 100) : 0,
      averageTime: Math.round(parseFloat(row.avg_time) || 0)
    }));

    const mockTestsByTest = mockTestStats.rows.map(row => ({
      testId: row.test_id,
      testName: row.test_name,
      totalTests: parseInt(row.total_tests),
      averageScore: Math.round(parseFloat(row.avg_score) || 0),
      averagePercentage: Math.round((parseFloat(row.avg_score) / parseFloat(row.avg_total_questions)) * 100) || 0,
      averageTimeSpent: Math.round(parseFloat(row.avg_time_spent) || 0),
      passingScore: row.passing_score
    }));

    const overall = {
      study: {
        totalStudied: parseInt(overallStudy.rows[0].total_studied) || 0,
        correctAnswers: parseInt(overallStudy.rows[0].correct_answers) || 0,
        accuracy: overallStudy.rows[0].total_studied > 0 ? 
          Math.round((overallStudy.rows[0].correct_answers / overallStudy.rows[0].total_studied) * 100) : 0,
        averageTime: Math.round(parseFloat(overallStudy.rows[0].avg_time) || 0)
      },
      mockTests: {
        totalTests: parseInt(overallMockTests.rows[0].total_tests) || 0,
        averageScore: Math.round(parseFloat(overallMockTests.rows[0].avg_score) || 0),
        averagePercentage: overallMockTests.rows[0].avg_total_questions > 0 ?
          Math.round((parseFloat(overallMockTests.rows[0].avg_score) / parseFloat(overallMockTests.rows[0].avg_total_questions)) * 100) : 0,
        averageTimeSpent: Math.round(parseFloat(overallMockTests.rows[0].avg_time_spent) || 0)
      }
    };

    res.json({
      overall,
      studyByTest,
      mockTestsByTest
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user statistics'
    });
  }
});

module.exports = router;