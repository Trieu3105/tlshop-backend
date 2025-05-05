const express = require('express');
const db = require('../data/db');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'User API is healthy', 
        apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8080/api" // Use API_BASE_URL from .env
    });
});

// Lấy tất cả user từ database
router.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

module.exports = router;
