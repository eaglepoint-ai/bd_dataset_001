const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { logError, RESERVED_WORDS } = require('../utils/validation');

router.get('/:code', (req, res) => {
  const { code } = req.params;
  
  if (RESERVED_WORDS.includes(code.toLowerCase())) {
    return res.status(404).json({ 
      error: 'Short URL not found', 
      code: 'NOT_FOUND' 
    });
  }
  
  try {
    const db = getDb();
    
    const url = db.prepare(`
      SELECT id, original_url, clicks 
      FROM urls 
      WHERE short_code = ?
    `).get(code);
    
    if (!url) {
      return res.status(404).json({ 
        error: 'Short URL not found', 
        code: 'NOT_FOUND' 
      });
    }
    
    db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE id = ?').run(url.id);
    
    res.redirect(302, url.original_url);
  } catch (error) {
    logError('Database error during redirect', error);
    res.status(500).json({ 
      error: 'Redirect failed. Please try again.', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

module.exports = router;
