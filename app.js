// Import the Express library
const express = require('express');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
app.use(bodyParser.json());

// THIS IS THE VERIFY TOKEN YOU CREATED
const MY_VERIFY_TOKEN = "My_Super_Secret_Bot_Token_987654321qwertyuiop";

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));

// Accepts GET requests at the /webhook endpoint. This is for VERIFICATION.
app.get('/webhook', (req, res) => {

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a 'mode' and 'token' is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent are correct
    if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at the /webhook endpoint. This is for receiving messages.
app.post('/webhook', (req, res) => {
  // This is where you will handle incoming messages from users
  // For now, we just send a 200 OK status to acknowledge receipt
  let body = req.body;
  console.log(JSON.stringify(body, null, 2)); // Log the message body
  res.sendStatus(200);
});
