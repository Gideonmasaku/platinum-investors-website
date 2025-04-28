const express = require('express'); 
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); // Import express-session for session management

// Initialize Express app
const app = express();
const PORT = 3002;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Set up session middleware
app.use(session({
  secret: 'your_secret_key', // Use a secure, random string here
  resave: false,
  saveUninitialized: true,
}));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'gideon',
  password: 'test123',
  database: 'platinum_investors'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database');
});

// Helper function to generate a unique account number
function generateAccountNumber() {
  return `PI${Math.floor(100000 + Math.random() * 900000)}`; // Generates a 6-digit account number prefixed with "PI"
}

// Signup route to handle form data submission
app.post('/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const accountNumber = generateAccountNumber(); // Generate account number
  const initialBalance = 0; // Initial balance set to zero

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (first_name, last_name, email, password, account_number, balance) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [first_name, last_name, email, hashedPassword, accountNumber, initialBalance], (err, results) => {
      if (err) {
        console.error('Failed to insert user data:', err);
        return res.status(500).send('Error occurred during registration');
      }

      res.redirect('/login.html'); // Redirect to login page after registration
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Server error');
  }
});

// Login route to handle login form submission
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(401).send('User not found');
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.userId = user.id; // Store user ID in session
      res.redirect('/home.html'); // Redirect to home page after successful login
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

// Route to fetch account details for display
app.get('/account-details', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }

  const query = 'SELECT first_name, last_name, account_number, balance FROM users WHERE id = ?';
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      console.error('Error retrieving account details:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(404).send('Account not found');
    }

    const user = results[0];
    res.json({
      fullName: `${user.first_name} ${user.last_name}`,
      accountNumber: user.account_number,
      balance: user.balance
    });
  });
});

// Serve the signup HTML file
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Serve the login HTML file
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

