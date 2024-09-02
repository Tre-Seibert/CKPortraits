require('dotenv').config(); // for loading env variables
const mysql = require('mysql2'); // for database
const fs = require('fs'); // for reading ssl keys/cert - prodution
const nodemailer = require('nodemailer'); // for automatic emails
const express = require('express');
const path = require('path');
const app = express(); // library building web apps for node js 
//const port = process.env.PORT; // get port from env file
// Define a port number
const port = process.env.PORT || 4000;

app.use(express.json());

// Define the public directory to serve static files
app.use(express.static(path.join(__dirname, '/public')));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// route for about page
app.get('/kaili', (req, res) => {
  res.sendFile(__dirname + '/public/kaili.html');
});

// route for booking page
app.get('/camille', (req, res) => {
  res.sendFile(__dirname + '/public/camille.html');
});

// route for about page
app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/public/kaili.html');
});


// setup creds for MySQL database
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// try to connect to db
con.connect(function(err) {
  if (err) {
      console.error("Error connecting to database:", err);
      return;
  }
  console.log("Connected to MySQL");
});

// interval (in milliseconds) to send keep-alive queries - 1 minute
const KEEP_ALIVE_INTERVAL = 60000;

// function to send a keep-alive query to the database
// this function prevents mariadb from timingout due to inacitivity
// this will be changed in the future when implementing connection pooling
function sendKeepAliveQuery() {
  con.query('SELECT 1', (err, result) => {
      if (err) {
          console.error('Error sending keep-alive query:', err);
      } else {
          console.log('Keep-alive query sent successfully.');
      }
  });
}

// send the initial keep-alive query
sendKeepAliveQuery();

// set up periodic execution of keep-alive queries
setInterval(sendKeepAliveQuery, KEEP_ALIVE_INTERVAL);

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
  },
});

// handle sbooking submission with reCAPTCHA verification
app.post('/submit-booking', async (req, res) => {
  const {eventDate, name, email, phone, details, recaptchaToken } = req.body;

  // verify reCAPTCHA response
  // reCAPTCHA secret key
  const secretKey = process.env.RECAPTCHA_SECRET;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
  
  try {
      // import node-fetch
      const fetch = await import('node-fetch');
      
      // send api request to reCAPTCHA
      const response = await fetch.default(verifyUrl, { method: 'POST' }); // use fetch.default because it's an ES module
      
      // await response
      const json = await response.json();

      // display message if verifcaiton fails
      if (!json.success) {
        console.log("Frick")
          return res.status(400).send("reCAPTCHA verification failed");
      }
      else {

      }
  } 
  // throw errors if there an error is returned
  catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      return res.status(500).send("Error verifying reCAPTCHA");
  }

  // configure nodemailer settings
  const mailOptions = {
      from: 'shawneerunevents@gmail.com',
      to: 'shawneerunevents@gmail.com', 
      subject: `${name} - New Booking Request`,
      text: `
      New booking request:
      Booking Date: ${eventDate}
      Client Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Details: ${details}
      `,
  };

  // send the email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Failed to send email');
      } else {
      console.log('Email sent:', info.response);
      res.status(200).send('Booking submitted successfully');
      }
  });

  console.log("BETTTTSKI")
  // proceed with booking insertion
  // insert the booking details into the database using parameterized query
  const sql = "INSERT INTO Bookings (booking_date, client_name, email, phone_number, details) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [eventDate, name, email, phone, details];
  con.query(sql, values, (err, result) => {
      // check for errors
      if (err) {
          console.error("Error inserting booking:", err);
          return res.status(500).send("Error inserting booking");
      }
      console.log("Booking inserted successfully");
      return res.status(200).send("Booking inserted successfully");
  });
});

// handle fetching events from Google Calendar via server-side
app.get('/fetch-events', async (req, res) => {
  try {
      // import api
      const { google } = require('googleapis');
      const fs = require('fs');

      // load the credentials JSON file
      const credentials = require('./key.json');
      // configure authentication with the service account
      const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      });

      // create a google calendar API client
      const calendar = google.calendar({ version: 'v3', auth });

      // define the date range (next 3 years from the current date)
      const currentDate = new Date();
      const endDate = new Date(currentDate.getFullYear() + 3, currentDate.getMonth(), currentDate.getDate());

      // fetch events from Google Calendar api
      const events = await calendar.events.list({
          calendarId: 'camillekailiphotography@gmail.com',
          timeMin: currentDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
      });
      
      // for testing
      console.log('Fetched Events:', events.data.items);
      console.log('Total Events:', events.data.items.length);

      // store needed details in dict
      const modifiedEvents = events.data.items.map(event => ({
          summary: 'Booked',
          start: { date: event.start.date },
          end: { date: event.end.date }
      }));

      // for testing
      console.log(modifiedEvents);

      // respond with the modified events
      res.json(modifiedEvents);
  } catch (error) {
      console.error('Error fetching events from Google Calendar via server-side:', error);
      res.status(500).send('Error fetching events from Google Calendar via server-side');
  }
});



// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
