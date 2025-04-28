const mysql = require('mysql2');


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


const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00
  );
`;


const createInvestmentsTableQuery = `
  CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    deposit_amount DECIMAL(10, 2) NOT NULL,
    total_contributions DECIMAL(10, 2) DEFAULT 0,
    expected_returns DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;


db.query(createUsersTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating users table:', err);
    return;
  }
  console.log('Users table created successfully');
});

// Execute the investments table creation query
db.query(createInvestmentsTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating investments table:', err);
    return;
  }
  console.log('Investments table created successfully');
});

// Close the connection
db.end();
