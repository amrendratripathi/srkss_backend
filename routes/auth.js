const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// Test route to check if API is working
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Registration endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, gender, email, password } = req.body;

        // Validate required fields
        if (!name || !gender || !email || !password) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: 'name, gender, email, and password are required'
            });
        }

        // Validate gender
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({
                message: 'Invalid gender',
                allowed: ['male', 'female', 'other']
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name: name.trim(),
            gender,
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        // Try to save and catch validation errors
        try {
            await user.save();
            res.status(201).json({ 
                message: 'User registered successfully',
                user: {
                    name: user.name,
                    email: user.email,
                    gender: user.gender
                }
            });
        } catch (saveError) {
            console.error('Save Error:', saveError);
            if (saveError.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(saveError.errors).reduce((acc, key) => {
                        acc[key] = saveError.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            throw saveError;
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message,
            details: error.errors || {}
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Send success response
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Get all users endpoint
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field
        res.json({
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                role: user.role,
                createdAt: user.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get single user by ID endpoint
router.get('/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId, '-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

module.exports = router;