require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const trustRoutes = require('./routes/trust');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in srkss.backend/.env');
}
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Add a private random secret to srkss.backend/.env');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || true }));
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'SRKSS API is running' }));
app.use('/api', authRoutes(pool, process.env.JWT_SECRET));
app.use('/api', trustRoutes(pool, process.env.JWT_SECRET));

async function start() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
            mobile TEXT NOT NULL UNIQUE,
            address TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trust_members (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            location TEXT NOT NULL,
            email TEXT NOT NULL,
            gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
            photo_url TEXT NOT NULL,
            payment_screenshot_url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`));
}

start().catch((error) => {
    console.error('Could not start API:', error);
    process.exit(1);
});
