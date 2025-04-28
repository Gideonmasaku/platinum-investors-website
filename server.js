const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3002;

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'gideon',
  password: 'test123',
  database: 'platinum_investors',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database');
});

// Route to get user's current investments
app.get('/get-investments', (req, res) => {
  const email = req.query.email;

  const userQuery = 'SELECT id, balance FROM users WHERE email = ?';
  db.query(userQuery, [email], (err, results) => {
    if (err) {
      console.error('Error retrieving user data:', err);
      return res.status(500).send('Server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const userId = results[0].id;

    // Fetch total contributions and expected returns
    const investmentQuery = `
      SELECT 
        IFNULL(SUM(deposit_amount), 0) AS total_contributions, 
        IFNULL(SUM(expected_returns), 0) AS expected_returns 
      FROM investments 
      WHERE user_id = ?
    `;
    db.query(investmentQuery, [userId], (err, investmentResults) => {
      if (err) {
        console.error('Error retrieving investment data:', err);
        return res.status(500).send('Server error');
      }

      const investments = investmentResults[0];
      res.json({
        totalContributions: investments.total_contributions.toFixed(2),
        expectedReturns: investments.expected_returns.toFixed(2),
      });
    });
  });
});

/// Route to add a new investment
app.post('/add-investment', (req, res) => {
    const { email, depositAmount } = req.body;
  
    const userQuery = 'SELECT id, balance FROM users WHERE email = ?';
    db.query(userQuery, [email], (err, results) => {
      if (err) {
        console.error('Error retrieving user data:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const userId = results[0].id;
      const currentBalance = results[0].balance;
  
      const expectedReturns = depositAmount * 0.05; // Example calculation
  
      const insertInvestmentQuery = `
        INSERT INTO investments (user_id, deposit_amount, expected_returns) 
        VALUES (?, ?, ?)
      `;
      db.query(insertInvestmentQuery, [userId, depositAmount, expectedReturns], (err, insertResult) => {
        if (err) {
          console.error('Error inserting investment:', err);
          return res.status(500).json({ success: false, message: 'Error adding investment' });
        }
  
        const newBalance = currentBalance + depositAmount;
  
        const updateUserBalanceQuery = 'UPDATE users SET balance = ? WHERE id = ?';
        db.query(updateUserBalanceQuery, [newBalance, userId], (err, updateResult) => {
          if (err) {
            console.error('Error updating user balance:', err);
            return res.status(500).json({ success: false, message: 'Error updating balance' });
          }
  
          // Fetch updated totals
          const fetchUpdatedTotalsQuery = `
            SELECT 
              IFNULL(SUM(deposit_amount), 0) AS total_contributions, 
              IFNULL(SUM(expected_returns), 0) AS expected_returns 
            FROM investments 
            WHERE user_id = ?
          `;
          db.query(fetchUpdatedTotalsQuery, [userId], (err, updatedResults) => {
            if (err || updatedResults.length === 0) {
              console.error('Error fetching updated totals:', err);
              return res.status(500).json({ success: false, message: 'Error fetching updated totals' });
            }
  
            const updatedTotals = updatedResults[0];
            res.json({
              success: true,
              totalContributions: updatedTotals.total_contributions.toFixed(2),
              expectedReturns: updatedTotals.expected_returns.toFixed(2),
            });
          });
        });
      });
    });
  });
  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
