// server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors'); // Import CORS middleware
const { Pool } = require('pg');
const { body, param, validationResult } = require('express-validator');
const morgan = require('morgan'); // For logging HTTP requests
const jwt = require('jsonwebtoken'); // For JWT authentication
const bcrypt = require('bcrypt'); // For password hashing

const app = express();

// ---------------------
// CORS Configuration
// ---------------------

// Define CORS options
const corsOptions = {
  origin: 'http://localhost:5173', // Frontend URL
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};

// Apply CORS middleware before any routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// ---------------------
// Middleware Setup
// ---------------------

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for logging HTTP requests
app.use(morgan('dev'));

// ---------------------
// Environment Variables
// ---------------------

const PORT = process.env.PORT || 5001;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure to set this in your .env

// ---------------------
// PostgreSQL Connection Pool
// ---------------------

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database successfully.');
  release();
});

// ---------------------
// Authentication Middleware
// ---------------------

// Middleware to authenticate JWT tokens for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expected format: Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access token is missing.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// ---------------------
// Routes
// ---------------------

// Sample Route: Home
app.get('/', (req, res) => {
  res.send('Welcome to the Backend API!');
});

// User Registration Route
app.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE email = $1;', [email]);
      if (userCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already exists.' });
      }

      // Determine the role: 'admin' if first user, else 'user'
      const userCountResult = await pool.query('SELECT COUNT(*) FROM users;');
      const userCount = parseInt(userCountResult.rows[0].count, 10);
      const role = userCount === 0 ? 'admin' : 'user';

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user with role
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role;',
        [name, email, hashedPassword, role]
      );

      // Generate JWT Token
      const token = jwt.sign(
        { userId: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({ message: 'User registered successfully.', token });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// User Login Route
app.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const userCheck = await pool.query('SELECT * FROM users WHERE email = $1;', [email]);
      if (userCheck.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = userCheck.rows[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login successful.', token });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Sample Route: Get all users (excluding soft-deleted users)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE deleted_at IS NULL;');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route: Delete a specific user by email (Protected)
app.delete(
  '/users/:email',
  authenticateToken,
  [param('email').isEmail().withMessage('Valid email is required.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.params;

    try {
      const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING *;', [email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.status(200).json({ message: 'User deleted successfully.', user: result.rows[0] });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Route: Clear all users (Protected)
// WARNING: This route will delete all users in the table.
app.delete('/users', authenticateToken, async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    res.status(200).json({ message: 'All users have been deleted successfully.' });
  } catch (err) {
    console.error('Error executing query:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ---------------------
// Session Routes
// ---------------------

/**
 * @route   POST /sessions
 * @desc    Add a new gaming session for the authenticated user
 * @access  Protected
 */
app.post(
  '/sessions',
  authenticateToken,
  [
    body('buy_in_amount').isDecimal({ gt: 0 }).withMessage('Buy-in amount must be a positive number.'),
    body('cash_out_amount').isDecimal().withMessage('Cash-out amount must be a number.'),
    body('number_of_buy_ins').isInt({ gt: 0 }).withMessage('Number of buy-ins must be a positive integer.'),
    body('stakes').matches(/^\d+\/\d+$/).withMessage('Stakes must be in the format X/Y (e.g., 1/3).'),
    body('game_type').isIn(['NLH', 'PLO']).withMessage('Game type must be either NLH or PLO.'),
    body('location').notEmpty().withMessage('Location is required.'),
    body('session_date').isISO8601().withMessage('Date must be a valid ISO8601 date.'),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      buy_in_amount,
      cash_out_amount,
      number_of_buy_ins,
      stakes,
      game_type,
      location,
      session_date,
      notes,
    } = req.body;

    const user_id = req.user.userId;

    try {
      // Calculate win_loss
      const win_loss = parseFloat(cash_out_amount) - parseFloat(buy_in_amount) * parseInt(number_of_buy_ins, 10);

      const result = await pool.query(
        `INSERT INTO sessions 
          (user_id, buy_in_amount, cash_out_amount, number_of_buy_ins, stakes, game_type, location, session_date, notes, win_loss)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *;`,
        [
          user_id,
          buy_in_amount,
          cash_out_amount,
          number_of_buy_ins,
          stakes,
          game_type,
          location,
          session_date,
          notes,
          win_loss,
        ]
      );

      // Calculate cumulative W/L
      const cumulativeResult = await pool.query(
        `SELECT COALESCE(SUM(win_loss), 0) AS cumulative_win_loss 
         FROM sessions 
         WHERE user_id = $1 AND deleted_at IS NULL;`,
        [user_id]
      );

      const cumulativeWinLoss = cumulativeResult.rows[0].cumulative_win_loss;

      res.status(201).json({
        message: 'Session added successfully.',
        session: result.rows[0],
        cumulative_win_loss: cumulativeWinLoss,
      });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
/**
 * @route   GET /sessions
 * @desc    Retrieve all gaming sessions for the authenticated user along with cumulative W/L
 * @access  Protected
 */
app.get('/sessions', authenticateToken, async (req, res) => {
  const user_id = req.user.userId;

  try {
    const sessionsResult = await pool.query(
      `SELECT 
         id, 
         buy_in_amount, 
         cash_out_amount, 
         number_of_buy_ins, 
         stakes, 
         game_type, 
         location, 
         session_date, 
         notes, 
         win_loss, 
         created_at 
       FROM sessions 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY session_date DESC;`,
      [user_id]
    );

    const cumulativeResult = await pool.query(
      `SELECT COALESCE(SUM(win_loss), 0) AS cumulative_win_loss 
       FROM sessions 
       WHERE user_id = $1 AND deleted_at IS NULL;`,
      [user_id]
    );

    const cumulativeWinLoss = cumulativeResult.rows[0].cumulative_win_loss;

    res.status(200).json({
      sessions: sessionsResult.rows,
      cumulative_win_loss: cumulativeWinLoss,
    });
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   PATCH /sessions/:id
 * @desc    Update an existing gaming session
 * @access  Protected
 */
app.patch(
  '/sessions/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Session ID must be an integer.'),
    body('buy_in_amount').optional().isDecimal({ gt: 0 }).withMessage('Buy-in amount must be a positive number.'),
    body('cash_out_amount').optional().isDecimal().withMessage('Cash-out amount must be a number.'),
    body('number_of_buy_ins').optional().isInt({ gt: 0 }).withMessage('Number of buy-ins must be a positive integer.'),
    body('stakes').optional().matches(/^\d+\/\d+$/).withMessage('Stakes must be in the format X/Y (e.g., 1/3).'),
    body('game_type').optional().isIn(['NLH', 'PLO']).withMessage('Game type must be either NLH or PLO.'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty.'),
    body('session_date').optional().isISO8601().withMessage('Date must be a valid ISO8601 date.'),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      buy_in_amount,
      cash_out_amount,
      number_of_buy_ins,
      stakes,
      game_type,
      location,
      session_date,
      notes,
    } = req.body;

    const user_id = req.user.userId;

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];
    let query = 'UPDATE sessions SET ';

    if (buy_in_amount) {
      fields.push(`buy_in_amount = $${fields.length + 1}`);
      values.push(buy_in_amount);
    }

    if (cash_out_amount) {
      fields.push(`cash_out_amount = $${fields.length + 1}`);
      values.push(cash_out_amount);
    }

    if (number_of_buy_ins) {
      fields.push(`number_of_buy_ins = $${fields.length + 1}`);
      values.push(number_of_buy_ins);
    }

    if (stakes) {
      fields.push(`stakes = $${fields.length + 1}`);
      values.push(stakes);
    }

    if (game_type) {
      fields.push(`game_type = $${fields.length + 1}`);
      values.push(game_type);
    }

    if (location) {
      fields.push(`location = $${fields.length + 1}`);
      values.push(location);
    }

    if (session_date) {
      fields.push(`session_date = $${fields.length + 1}`);
      values.push(session_date);
    }

    if (notes) {
      fields.push(`notes = $${fields.length + 1}`);
      values.push(notes);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    // Recalculate win_loss if relevant fields are updated
    const recalculateWinLoss = buy_in_amount || cash_out_amount || number_of_buy_ins;

    if (recalculateWinLoss) {
      fields.push(`win_loss = (cash_out_amount - (buy_in_amount * number_of_buy_ins))`);
    }

    query += fields.join(', ') + ` WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2} RETURNING *;`;
    values.push(id, user_id);

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found.' });
      }

      // Calculate updated cumulative W/L
      const cumulativeResult = await pool.query(
        `SELECT COALESCE(SUM(win_loss), 0) AS cumulative_win_loss 
         FROM sessions 
         WHERE user_id = $1 AND deleted_at IS NULL;`,
        [user_id]
      );

      const cumulativeWinLoss = cumulativeResult.rows[0].cumulative_win_loss;

      res.status(200).json({
        message: 'Session updated successfully.',
        session: result.rows[0],
        cumulative_win_loss: cumulativeWinLoss,
      });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @route   DELETE /sessions/:id
 * @desc    Delete a specific gaming session (Soft Delete)
 * @access  Protected
 */
app.delete(
  '/sessions/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Session ID must be an integer.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user_id = req.user.userId;

    try {
      const result = await pool.query(
        'UPDATE sessions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *;',
        [id, user_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found.' });
      }

      // Recalculate cumulative W/L
      const cumulativeResult = await pool.query(
        `SELECT COALESCE(SUM(win_loss), 0) AS cumulative_win_loss 
         FROM sessions 
         WHERE user_id = $1 AND deleted_at IS NULL;`,
        [user_id]
      );

      const cumulativeWinLoss = cumulativeResult.rows[0].cumulative_win_loss;

      res.status(200).json({
        message: 'Session deleted successfully.',
        session: result.rows[0],
        cumulative_win_loss: cumulativeWinLoss,
      });
    } catch (err) {
      console.error('Error executing query:', err.message);
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// ---------------------
// Centralized Error Handling Middleware
// ---------------------

// This should be placed after all other routes and middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------------------
// Start the Server
// ---------------------

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
