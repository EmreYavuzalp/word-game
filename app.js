// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

app.use(express.json());

// Define routes
const apiRouter = require('./routes/api');

app.use('/api', apiRouter);

// Serve static files for the Vue.js frontend
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Catch-all route for Vue.js frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});
  
// File Structure Suggestion:
// project-root
// ├── client            // Vue.js frontend
// │   ├── public
// │   │   └── index.html
// │   ├── src
// │   │   ├── components
// │   │   │   └── HelloWorld.vue
// │   │   ├── views
// │   │   │   └── HomeView.vue
// │   │   ├── App.vue
// │   │   └── main.js
// │   └── package.json
// ├── routes            // Express.js routes
// │   ├── api.js
// │   └── games.js
// ├── models            // Game logic and models
// │   └── WordGameFSM.js
// ├── .env
// ├── app.js            // Express.js entry point
// ├── package.json      // Backend dependencies
// └── README.md
