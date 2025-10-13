const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Render.com
app.get('/', (req, res) => {
    res.send('✅ Backend is running successfully!');
});

// Routes
app.use('/api', authRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://rajjubabu531_db_user:c22DpB8EDOKUtEzh@srkss.wj2xqv4.mongodb.net/?retryWrites=true&w=majority&appName=srkss')
.then(() => {
    console.log('Connected to MongoDB successfully');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});