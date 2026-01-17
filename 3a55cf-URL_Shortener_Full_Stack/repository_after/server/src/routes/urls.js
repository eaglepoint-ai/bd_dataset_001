const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { isValidUrl, validateShortCode, generateShortCode, logError } = require('../utils/validation');

router.post('/', (req, res) => {
  const { url, customCode } = req.body;
  
  if (!isValidUrl(url)) {
    return res.status(400).json({ 
      error: 'Please enter a valid URL (must start with http:// or https://)', 
      code: 'INVALID_URL' 
    });
  }
  
  const codeValidation = validateShortCode(customCode);
  if (!codeValidation.valid) {
    return res.status(400).json({ 
      error: codeValidation.error, 
      code: codeValidation.code 
    });
  }
  
  const db = getDb();
  
  let shortCode;
  if (codeValidation.autoGenerate) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      shortCode = generateShortCode();
      const existing = db.prepare('SELECT id FROM urls WHERE short_code = ?').get(shortCode);
      if (!existing) break;
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      logError('Failed to generate unique short code after max attempts');
      return res.status(500).json({ 
        error: 'Unable to generate short code. Please try again.', 
        code: 'INTERNAL_ERROR' 
      });
    }
  } else {
    shortCode = codeValidation.shortCode;
    
    const existing = db.prepare('SELECT id FROM urls WHERE short_code = ?').get(shortCode);
    if (existing) {
      return res.status(409).json({ 
        error: `Short code "${shortCode}" is already taken. Please choose another.`, 
        code: 'DUPLICATE_CODE' 
      });
    }
  }
  
  try {
    const stmt = db.prepare(`
      INSERT INTO urls (original_url, short_code) 
      VALUES (?, ?)
    `);
    const result = stmt.run(url, shortCode);
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    res.status(201).json({
      id: result.lastInsertRowid,
      originalUrl: url,
      shortCode: shortCode,
      shortUrl: `${baseUrl}/${shortCode}`,
      clicks: 0,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ 
        error: `Short code "${shortCode}" is already taken. Please choose another.`, 
        code: 'DUPLICATE_CODE' 
      });
    }
    
    logError('Database error creating URL', error);
    res.status(500).json({ 
      error: 'Failed to create short URL. Please try again.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    const urls = db.prepare(`
      SELECT id, original_url, short_code, clicks, created_at 
      FROM urls 
      ORDER BY created_at DESC
    `).all();
    
    const formattedUrls = urls.map(url => ({
      id: url.id,
      originalUrl: url.original_url,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      clicks: url.clicks,
      createdAt: url.created_at
    }));
    
    res.json(formattedUrls);
  } catch (error) {
    logError('Database error listing URLs', error);
    res.status(500).json({ 
      error: 'Failed to retrieve URLs. Please try again.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalUrls,
        COALESCE(SUM(clicks), 0) as totalClicks
      FROM urls
    `).get();
    
    res.json({
      totalUrls: stats.totalUrls,
      totalClicks: stats.totalClicks
    });
  } catch (error) {
    logError('Database error getting stats', error);
    res.status(500).json({ 
      error: 'Failed to retrieve statistics.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    const url = db.prepare(`
      SELECT id, original_url, short_code, clicks, created_at 
      FROM urls 
      WHERE id = ?
    `).get(id);
    
    if (!url) {
      return res.status(404).json({ 
        error: 'URL not found', 
        code: 'NOT_FOUND' 
      });
    }
    
    res.json({
      id: url.id,
      originalUrl: url.original_url,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      clicks: url.clicks,
      createdAt: url.created_at
    });
  } catch (error) {
    logError('Database error getting URL', error);
    res.status(500).json({ 
      error: 'Failed to retrieve URL.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const db = getDb();
    
    const result = db.prepare('DELETE FROM urls WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'URL not found', 
        code: 'NOT_FOUND' 
      });
    }
    
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    logError('Database error deleting URL', error);
    res.status(500).json({ 
      error: 'Failed to delete URL.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

module.exports = router;
