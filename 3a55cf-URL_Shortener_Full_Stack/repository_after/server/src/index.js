const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');
const urlsRouter = require('./routes/urls');
const redirectRouter = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/urls', urlsRouter);
app.use('/', redirectRouter);

app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err.message);
  
  res.status(500).json({ 
    error: 'Internal server error', 
    code: 'INTERNAL_ERROR' 
  });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
});

module.exports = app;
