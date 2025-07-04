const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const libraryRoutes = require('./routes/library');
const streamRoutes = require('./routes/stream');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for video streaming
app.use('/media', express.static(path.join(__dirname, 'media')));

// API Routes
app.use('/api/movies', movieRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/stream', streamRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Periploko server running on port ${PORT}`);
  console.log(`📁 Media directory: ${path.join(__dirname, 'media')}`);
}); 