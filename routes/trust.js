const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = (pool, jwtSecret) => {
    const router = express.Router();

    router.post('/join-trust', async (req, res) => {
        const { name, mobile, location, email, gender, photoUrl, paymentScreenshotUrl } = req.body || {};
        const member = {
            name: String(name || '').trim(),
            mobile: String(mobile || '').trim(),
            location: String(location || '').trim(),
            email: String(email || '').trim(),
            gender: String(gender || '').trim().toLowerCase(),
            photoUrl: String(photoUrl || '').trim(),
            paymentScreenshotUrl: String(paymentScreenshotUrl || '').trim(),
        };
        if (Object.values(member).some((value) => !value)) {
            return res.status(400).json({ message: 'Please provide all membership details, photo, and payment screenshot' });
        }
        if (!['male', 'female', 'other'].includes(member.gender)) {
            return res.status(400).json({ message: 'Invalid gender' });
        }
        try {
            const result = await pool.query(
                `INSERT INTO trust_members
                    (name, mobile, location, email, gender, photo_url, payment_screenshot_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, name, mobile, location, email, gender,
                           photo_url AS "photoUrl",
                           payment_screenshot_url AS "paymentScreenshotUrl",
                           created_at AS "createdAt"`,
                [member.name, member.mobile, member.location, member.email, member.gender, member.photoUrl, member.paymentScreenshotUrl]
            );
            return res.status(201).json({ ok: true, member: result.rows[0] });
        } catch (error) {
            console.error('Trust membership save error:', error);
            return res.status(500).json({ message: 'Could not save membership application' });
        }
    });

    router.get('/trust-members', requireAdmin(jwtSecret), async (_req, res) => {
        try {
            const result = await pool.query(
                `SELECT id, name, mobile, location, email, gender,
                        photo_url AS "photoUrl",
                        payment_screenshot_url AS "paymentScreenshotUrl",
                        created_at AS "createdAt"
                 FROM trust_members ORDER BY created_at DESC`
            );
            return res.json({ trustMembers: result.rows });
        } catch (error) {
            console.error('Trust members query error:', error);
            return res.status(500).json({ message: 'Could not fetch trust members' });
        }
    });

    // The member directory is public and returns only fields shown on member cards.
    router.get('/members', async (_req, res) => {
        try {
            const result = await pool.query(
                `SELECT id, name, location AS address, photo_url AS "photoUrl",
                        created_at AS "memberSince"
                 FROM trust_members ORDER BY created_at DESC`
            );
            return res.json({ members: result.rows });
        } catch (error) {
            console.error('Member directory query error:', error);
            return res.status(500).json({ message: 'Could not fetch members' });
        }
    });

    return router;
};
