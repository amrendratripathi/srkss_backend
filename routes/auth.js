const express = require('express');
const bcrypt = require('bcrypt');
const { createToken, requireAdmin } = require('../middleware/auth');

module.exports = (pool, jwtSecret) => {
    const router = express.Router();

    router.get('/test', (req, res) => res.json({ message: 'API is working' }));

    router.post('/register', async (req, res) => {
        const name = String(req.body.name || '').trim();
        const gender = String(req.body.gender || '').trim().toLowerCase();
        const mobile = String(req.body.mobile || '').trim();
        const address = String(req.body.address || '').trim();
        const password = String(req.body.password || '');
        if (!name || !gender || !mobile || !address || !password) {
            return res.status(400).json({ message: 'Name, gender, mobile number, address, and password are required' });
        }
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Gender must be male, female, or other' });
        }
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                `INSERT INTO users (name, gender, mobile, address, password_hash)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, name, gender, mobile, address, role, created_at`,
                [name, gender, mobile, address, passwordHash]
            );
            return res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
        } catch (error) {
            if (error.code === '23505') return res.status(409).json({ message: 'A user with this mobile number already exists' });
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Could not register user' });
        }
    });

    router.post('/login', async (req, res) => {
        const mobile = String(req.body.mobile || req.body.email || '').trim();
        const password = String(req.body.password || '');
        if (!mobile || !password) return res.status(400).json({ message: 'Mobile number and password are required' });
        try {
            const result = await pool.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
            const user = result.rows[0];
            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return res.status(401).json({ message: 'Invalid mobile number or password' });
            }
            return res.json({
                message: 'Login successful',
                token: createToken(user, jwtSecret),
                user: { id: user.id, name: user.name, mobile: user.mobile, address: user.address, gender: user.gender, role: user.role },
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Could not log in' });
        }
    });

    router.get('/users', requireAdmin(jwtSecret), async (req, res) => {
        try {
            const result = await pool.query('SELECT id, name, gender, mobile, address, role, created_at AS "createdAt" FROM users ORDER BY created_at DESC');
            return res.json({ users: result.rows });
        } catch (error) {
            console.error('Users query error:', error);
            return res.status(500).json({ message: 'Could not fetch users' });
        }
    });

    return router;
};
