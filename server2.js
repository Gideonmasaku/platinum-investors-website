const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3004;


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

// Function to generate an access token from Safaricom
async function getMpesaToken() {
  const consumerKey = 'YOUR_CONSUMER_KEY'; // replace with your Safaricom consumer key
  const consumerSecret = 'YOUR_CONSUMER_SECRET'; // replace with your Safaricom consumer secret
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating MPesa token:', error);
    throw error;
  }
}

// Route to fund user account via MPesa
app.post('/fund-account', async (req, res) => {
  const { phoneNumber, amount, email } = req.body;

  try {
    // Get the token for authentication
    const token = await getMpesaToken();

    const businessShortCode = 'YOUR_SHORTCODE'; // replace with your MPesa shortcode
    const passkey = 'YOUR_PASSKEY'; // replace with your MPesa passkey
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber, // the phone number that is funding
      PartyB: businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: 'http://localhost:3002/mpesa-callback', // your callback URL
      AccountReference: email, // using email as a unique identifier
      TransactionDesc: 'Account funding via MPesa',
    };

    // Send the request to initiate MPesa payment
    const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.json({
      success: true,
      message: 'Payment request sent, awaiting user action.',
      response: response.data,
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate MPesa payment' });
  }
});

// Route to handle MPesa callback
app.post('/mpesa-callback', (req, res) => {
  const { Body: { stkCallback } } = req.body;

  if (stkCallback.ResultCode === 0) {
    const amountPaid = stkCallback.CallbackMetadata.Item.find(i => i.Name === 'Amount').Value;
    const phoneNumber = stkCallback.CallbackMetadata.Item.find(i => i.Name === 'PhoneNumber').Value;
    
    // Update the user's account balance in the database
    const email = stkCallback.CallbackMetadata.Item.find(i => i.Name === 'AccountReference').Value;
    const updateBalanceQuery = 'UPDATE users SET balance = balance + ? WHERE email = ?';

    db.query(updateBalanceQuery, [amountPaid, email], (err, results) => {
      if (err) {
        console.error('Error updating user balance:', err);
        return res.status(500).send('Failed to update balance');
      }
      
      console.log(`Successfully updated balance for ${email}: Ksh ${amountPaid}`);
      res.status(200).json({ success: true, message: 'Payment successful and balance updated' });
    });
  } else {
    console.log('Payment failed:', stkCallback.ResultDesc);
    res.status(400).json({ success: false, message: 'Payment failed' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
