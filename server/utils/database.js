/**
 * Database utility functions with SQL injection prevention
 * All queries use parameterized statements to prevent SQL injection attacks
 */

/**
 * Execute a parameterized query safely
 * @param {Object} db - Database connection pool
 * @param {string} query - SQL query with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameters to bind to the query
 * @returns {Promise} Query result
 */
const executeQuery = async (db, query, params = []) => {
  try {
    // Validate that query uses parameterized placeholders
    if (params.length > 0) {
      const parameterPattern = /\$\d+/g;
      const matches = query.match(parameterPattern);
      const expectedParams = matches ? matches.length : 0;
      
      if (expectedParams !== params.length) {
        throw new Error(`Parameter count mismatch: expected ${expectedParams}, got ${params.length}`);
      }
    }

    // Execute the parameterized query
    const result = await db.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', {
      query: query.substring(0, 100) + '...', // Log first 100 chars of query
      paramCount: params.length,
      error: error.message
    });
    throw error;
  }
};

/**
 * Execute a transaction with multiple parameterized queries
 * @param {Object} db - Database connection pool
 * @param {Function} transactionFn - Function that receives a client and executes queries
 * @returns {Promise} Transaction result
 */
const executeTransaction = async (db, transactionFn) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    const result = await transactionFn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Validate and sanitize SQL identifiers (table names, column names)
 * Only allows alphanumeric characters, underscores, and dots
 * @param {string} identifier - SQL identifier to validate
 * @returns {string} Validated identifier
 * @throws {Error} If identifier is invalid
 */
const validateSqlIdentifier = (identifier) => {
  if (typeof identifier !== 'string') {
    throw new Error('SQL identifier must be a string');
  }

  // Allow alphanumeric characters, underscores, and dots only
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
  
  if (!validPattern.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  // Prevent SQL keywords (basic list)
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'UNION', 'WHERE', 'FROM', 'JOIN', 'HAVING', 'ORDER', 'GROUP'
  ];

  if (sqlKeywords.includes(identifier.toUpperCase())) {
    throw new Error(`SQL keyword not allowed as identifier: ${identifier}`);
  }

  return identifier;
};

/**
 * Build a safe WHERE clause with parameterized conditions
 * @param {Object} conditions - Object with column: value pairs
 * @param {number} startParamIndex - Starting parameter index (default: 1)
 * @returns {Object} Object with whereClause string and parameters array
 */
const buildWhereClause = (conditions, startParamIndex = 1) => {
  if (!conditions || typeof conditions !== 'object') {
    return { whereClause: '', parameters: [] };
  }

  const entries = Object.entries(conditions);
  if (entries.length === 0) {
    return { whereClause: '', parameters: [] };
  }

  const clauses = [];
  const parameters = [];
  let paramIndex = startParamIndex;

  for (const [column, value] of entries) {
    // Validate column name
    validateSqlIdentifier(column);
    
    if (value === null || value === undefined) {
      clauses.push(`${column} IS NULL`);
    } else if (Array.isArray(value)) {
      // Handle IN clause
      const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
      clauses.push(`${column} IN (${placeholders})`);
      parameters.push(...value);
    } else {
      clauses.push(`${column} = $${paramIndex++}`);
      parameters.push(value);
    }
  }

  const whereClause = `WHERE ${clauses.join(' AND ')}`;
  return { whereClause, parameters };
};

/**
 * Build a safe ORDER BY clause
 * @param {string|Array} orderBy - Column name(s) to order by
 * @param {string} direction - 'ASC' or 'DESC' (default: 'ASC')
 * @returns {string} Safe ORDER BY clause
 */
const buildOrderByClause = (orderBy, direction = 'ASC') => {
  if (!orderBy) {
    return '';
  }

  const validDirections = ['ASC', 'DESC'];
  const safeDirection = validDirections.includes(direction.toUpperCase()) ? direction.toUpperCase() : 'ASC';

  if (Array.isArray(orderBy)) {
    const columns = orderBy.map(col => validateSqlIdentifier(col)).join(', ');
    return `ORDER BY ${columns} ${safeDirection}`;
  } else {
    const column = validateSqlIdentifier(orderBy);
    return `ORDER BY ${column} ${safeDirection}`;
  }
};

/**
 * Build pagination LIMIT and OFFSET clause
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Object with limitClause and parameters
 */
const buildPaginationClause = (page = 1, limit = 10) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
  const offset = (safePage - 1) * safeLimit;

  return {
    limitClause: 'LIMIT $1 OFFSET $2',
    parameters: [safeLimit, offset]
  };
};

module.exports = {
  executeQuery,
  executeTransaction,
  validateSqlIdentifier,
  buildWhereClause,
  buildOrderByClause,
  buildPaginationClause
};