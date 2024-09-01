// Importing the express module
const express = require('express');
const path = require('path');

// Creating an instance of express
const app = express();

// Define a port number
const port = process.env.PORT || 4000;

// Define the public directory to serve static files
app.use(express.static(path.join(__dirname, '/public')));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
