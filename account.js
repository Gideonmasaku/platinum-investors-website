const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', path.join(__dirname, 'views')); // Set views folder

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

// Route to serve edit-account.ejs with userId passed in
app.get('/edit-account', (req, res) => {
  const userId = 1; // Replace with dynamic user ID retrieval logic
  res.render('edit-account', { userId }); // Render EJS file and pass userId
});

// Route to handle account edit form submission
app.post('/edit-account', async (req, res) => {
  const { userId, first_name, last_name, email, password } = req.body;
  
  try {
    // Ensure userId is a number
    if (!userId || isNaN(userId)) {
      return res.status(400).send('Invalid user ID');
    }

    // Hash the password if provided, otherwise use existing password
    let query;
    let values;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `UPDATE users SET first_name = ?, last_name = ?, email = ?, password = ? WHERE id = ?`;
      values = [first_name, last_name, email, hashedPassword, userId];
    } else {
      query = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`;
      values = [first_name, last_name, email, userId];
    }

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error updating user information:', err);
        return res.status(500).send('Error updating account');
      }
      res.send('Account updated successfully');
    });
  } catch (err) {
    console.error('Error during account update:', err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
