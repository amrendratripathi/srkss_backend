const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors()); // Enable CORS for all origins
app.use(express.json());
app.use('/api', authRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://rajjubabu531_db_user:c22DpB8EDOKUtEzh@srkss.wj2xqv4.mongodb.net/?retryWrites=true&w=majority&appName=srkss', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    
    // Get the default connection
    const db = mongoose.connection;
    
    try {
        // Drop the existing collection to remove all indexes
        await db.collection('users').drop();
        console.log('Cleared existing collection and indexes');
    } catch (error) {
        // Ignore if collection doesn't exist
        if (error.code !== 26) {
            console.error('Error clearing collection:', error);
        }
    }
})
.catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});